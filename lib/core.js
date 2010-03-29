// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*jslint evil:true */

/**
  @file 
  
  This file implements the core building blocks needed to implement the 
  tiki runtime in an environment.  If you can require this one module, you can
  setup a runtime that will load additional packages.
  
  It is important that this module NOT require() any other modules since a
  functioning require() statement may not be available.  The module can 
  populate, but not replace, the exports object.

  To configure a Tiki runtime, you need to create a Sandbox and Loader 
  instance from this API with one or more loader Sources.  The BrowserSource
  object implements the basic source you need to work in the browser.  The
  Repository object implemented in the server-side only 'file' API can be 
  used to load from a local repository of packages.
*/

// used for type checking.  This allows the type strings to be minified.
var T_FUNCTION = 'function',
    T_STRING   = 'string',
    T_UNDEFINED = 'undefined';
    
    
var IS_CANONICAL = /^::/; // must begin with ::
var isCanonicalId = function(id) {
  return !!IS_CANONICAL.exec(id);
};  

var DEBUG = function() {
  exports.debug.apply(this, arguments);
};

exports.debug = function() {
  var msg = Array.prototype.join.call(arguments, '');
  require('sys').debug(msg);
};

// ..........................................................
// CORE UTILITIES
// 

var TMP_ARY = [];

/**
  Tests whether the passed object is an array or not.
*/
var isArray;

if (Array.isArray) {
  isArray = Array.isArray;
} else {
  isArray = function(obj) {
    if ('object' !== typeof obj) return false;
    if (obj instanceof Array) return true;
    return obj.constructor && (obj.constructor.name==='Array');
  };
}

/**
  Create a new object with the passed object as the prototype.
*/
var createObject;
if (Object.create) {
  createObject = Object.create;
} else {
  var K = function() {},
      Kproto = K.prototype;
  createObject = function(obj) {
    if (!obj) obj = Object.prototype;
    K.prototype = obj;
    
    var ret = new K();
    ret.prototype = obj;
    K.prototype = Kproto;
    
    return ret ;
  };
}
exports.createObject = createObject;

var _constructor, _extend, extend;

// returns a new constructor function with clean closure...
_constructor = function() {
  return function() {
    if (this.init) return this.init.apply(this, arguments);
    else return this;
  };
};

_extend = function() {
  return extend(this);
};

/**
  Creates a "subclass" of the passed constructor.  The default constructor
  will call look for a local "init" method and call it.
  
  If you don't pass an initial constructor, this will create a new based 
  object.
*/
extend = function(Constructor) {
  var Ret = _constructor();
  Ret.prototype = createObject(Constructor.prototype);
  Ret.prototype.constructor = Ret;
  Ret.super_ = Constructor;
  Ret.extend = _extend;
  return Ret;
};
exports.extend = extend;

/**
  Invokes an async callback, returning the return value.  Since in the 
  browser we can't actually be async, this code just throws an error if you
  actually go async.
  
  For platforms that can actually wait on async code to complete, they should
  override the wait export.
  
  @param func {Function}
    The function to invoke.  The function should accept a single param - the
    callback to invoke when finished.
    
  @returns {Object} return value from async operation
*/
var wait = function(func) {
  var finished = false, err, ret;
  func(function(e, v) {
    finished = true;
    err = e; ret = v;
  });
  
  if (!finished) err = new Error('Cannot run function async');
  if (err) throw err;
  return ret ;
};
exports.wait = wait;

/**
  Returns a continuable that will apply the mapper function to the passed 
  array, passing it to the callback when complete.
  
  The mapper function should have the form:
  
  {{{
    function fn(item, callback) { ... };
  }}}
  
*/
var comap = function(array, fn) {
  var len = array.length;
  return function(done) {
    var idx = -1,
        ret = [];
    
    var loop = function(err, val) {
      if (err) return done(err);
      if (idx>=0) ret[idx] = val; // skip first call
      idx++;
      if (idx>=len) return done(null, ret);
      fn(array[idx], loop);
    };
    
    loop();
  };
};

/** 
  Returns a continuable that will invoke a callback on each item in the 
  array until one of them returns true.  Otherwise, returns false.
*/
var cofind = function(array, fn) {
  var len = array.length;
  return function(done) {
    var idx = -1,
        ret = [];
    
    var loop = function(err, val) {
      if (err) return done(err);
      if ((idx>=0) && val) return done(null, array[idx]);
      idx++;
      if (idx>=len) return done(); // not found
      fn(array[idx], loop);
    };
    
    loop();
  };
};

var PENDING = 'pending',
    READY   = 'ready',
    RUNNING = 'running';
    
/**
  Returns a function that will execute the continuable exactly once and 
  then cache the result.  Invoking the same return function more than once
  will simply return the old result. 
  
  This is a good replacement for promises in many cases.
  
  h3. Example
  
  {{{
    // load a file only once
    var loadit = Co.once(Co.fs.loadFile(pathToFile));

    loadit(function(content) { 
      // loads the file
    });
    
    loadit(function(content) {
      // if already loaded, just invokes with past content
    });
    
  }}}
  
  @param {Function} cont
    Continuable to invoke 
    
  @returns {Function} 
    A new continuable that will only execute once then returns the cached
    result.
*/
var once = function(action, context) {
  var state = PENDING,
      queue = [],
      makePending = false,
      args  = null;

  var ret = function(callback) {
    if (!context) context = this;
    
    // cont has already finished, just invoke callback based on result
    switch(state) {
      
      // already resolved, invoke callback immediately
      case READY:
        callback.apply(null, args);
        break;

      // action has started running but hasn't finished yet
      case RUNNING:
        queue.push(callback);
        break;
        
      // action has not started yet
      case PENDING:
        queue.push(callback);
        state = RUNNING;

        action.call(context, function(err) {
          args  = Array.prototype.slice.call(arguments);
          
          var oldQueue = queue, oldArgs = args;

          if (makePending) {
            state = PENDING;
            queue = [];
            args  = null; 
            makePending = false;

          } else {
            state = READY;
            queue = null;
          }
          
          if (oldQueue) {
            oldQueue.forEach(function(q) { q.apply(null, oldArgs); });
          }
        });
        break;
    }
    return this;
  };

  // allow the action to be reset so it is called again
  ret.reset = function() {
    switch(state) {
      
      // already run, need to reset
      case READY: 
        state = PENDING;
        queue = [];
        args  = null;
        break;
        
      // in process - set makePending so that resolving will reset to pending
      case RUNNING:
        makePending = true;
        break;
        
      // otherwise ignore pending since there is nothing to reset
    }
  };
  
  return ret ;
};
exports.once = once;

/**
  Iterate over a property, setting display names on functions as needed.
  Call this on your own exports to setup display names for debugging.
*/
var displayNames = function(obj, root) {
  var a = TMP_ARY;
  a[0] = root;
  
  var k,v;
  for(k in obj) {
    if (!obj.hasOwnProperty(k)) continue ;
    v = obj[k];
    if ('function' === typeof v) {
      a[1] = k;
      if (!v.displayName) {
        v.displayName = root ? a.join('.') : k;
        displayNames(v.prototype, v.displayName);
      }
      
    }
  }
  
  a.length = 0;
  return obj;
};

// ..........................................................
// semver
// 

// ..........................................................
// NATCOMPARE
// 
// Used with thanks to Kristof Coomans 
// Find online at http://sourcefrog.net/projects/natsort/natcompare.js
// Cleaned up JSLint errors

/*
natcompare.js -- Perform 'natural order' comparisons of strings in JavaScript.
Copyright (C) 2005 by SCK-CEN (Belgian Nucleair Research Centre)
Written by Kristof Coomans <kristof[dot]coomans[at]sckcen[dot]be>

Based on the Java version by Pierre-Luc Paour, of which this is more or less a straight conversion.
Copyright (C) 2003 by Pierre-Luc Paour <natorder@paour.com>

The Java version was based on the C version by Martin Pool.
Copyright (C) 2000 by Martin Pool <mbp@humbug.org.au>

This software is provided 'as-is', without any express or implied
warranty.  In no event will the authors be held liable for any damages
arising from the use of this software.

Permission is granted to anyone to use this software for any purpose,
including commercial applications, and to alter it and redistribute it
freely, subject to the following restrictions:

1. The origin of this software must not be misrepresented; you must not
claim that you wrote the original software. If you use this software
in a product, an acknowledgment in the product documentation would be
appreciated but is not required.
2. Altered source versions must be plainly marked as such, and must not be
misrepresented as being the original software.
3. This notice may not be removed or altered from any source distribution.
*/
var natcompare = function() {
  
  var isWhitespaceChar = function(a) {
    var charCode = a.charCodeAt(0);
    return charCode <= 32;
  };

  var isDigitChar = function(a) {
    var charCode = a.charCodeAt(0);
    return ( charCode >= 48  && charCode <= 57 );
  };

  var compareRight = function(a,b) {
    var bias = 0,
        ia   = 0,
        ib   = 0,
        ca, cb;

    // The longest run of digits wins.  That aside, the greatest
    // value wins, but we can't know that it will until we've scanned
    // both numbers to know that they have the same magnitude, so we
    // remember it in BIAS.
    for (;; ia++, ib++) {
      ca = a.charAt(ia);
      cb = b.charAt(ib);

      if (!isDigitChar(ca) && !isDigitChar(cb)) return bias;
      else if (!isDigitChar(ca)) return -1;
      else if (!isDigitChar(cb)) return +1;
      else if (ca < cb) if (bias === 0) bias = -1;
      else if (ca > cb) if (bias === 0) bias = +1;
      else if (ca === 0 && cb === 0) return bias;
    }
  };

  var natcompare = function(a,b) {

    var ia  = 0, 
    ib  = 0,
    nza = 0, 
    nzb = 0,
    ca, cb, result;

    while (true) {
      // only count the number of zeroes leading the last number compared
      nza = nzb = 0;

      ca = a.charAt(ia);
      cb = b.charAt(ib);

      // skip over leading spaces or zeros
      while ( isWhitespaceChar( ca ) || ca =='0' ) {
        if (ca == '0') nza++;
        else nza = 0; // only count consecutive zeroes
        ca = a.charAt(++ia);
      }

      while ( isWhitespaceChar( cb ) || cb == '0') {
        if (cb == '0') nzb++;
        else nzb = 0; // only count consecutive zeroes
        cb = b.charAt(++ib);
      }

      // process run of digits
      if (isDigitChar(ca) && isDigitChar(cb)) {
        if ((result = compareRight(a.substring(ia), b.substring(ib))) !== 0) {
          return result;
        }
      }

      // The strings compare the same.  Perhaps the caller
      // will want to call strcmp to break the tie.
      if (ca === 0 && cb === 0) return nza - nzb;

      if (ca < cb) return -1;
      else if (ca > cb) return +1;

      ++ia; ++ib;
    }
  };

  return natcompare;
}();
exports.natcompare = natcompare;

// ..........................................................
// PUBLIC API
// 

// Support Methods
var invalidVers = function(vers) {
  return '' + vers + ' is an invalid version string';
};
invalidVers.displayName = 'invalidVers';

var compareNum = function(vers1, vers2, num1, num2) {
  num1 = Number(num1);
  num2 = Number(num2);
  if (isNaN(num1)) throw invalidVers(vers1);
  if (isNaN(num2)) throw invalidVers(vers2);
  return num1 - num2 ;
};
compareNum.displayName = 'compareNum';


var vparse;
var semver = {
  
  /**
    Parse the version number into its components.  Returns result of a regex.
  */
  parse: function(vers) {
    var ret = vers.match(/^(=|~)?([\d]+?)(\.([\d]+?)(\.(.+))?)?$/);
    if (!ret) return null; // no match
    return [ret, ret[2], ret[4] || '0', ret[6] || '0', ret[1]];
  },


  /**
    Returns the major version number of a version string. 

    @param {String} vers
      version string

    @returns {Number} version number or null if could not be parsed
  */
  major: function(vers) {
    return Number(vparse(vers)[1]);
  },

  /**
    Returns the minor version number of a version string


    @param {String} vers
      version string

    @returns {Number} version number or null if could not be parsed
  */
  minor: function(vers) {
    return Number(vparse(vers)[2]);
  },

  /**
    Returns the patch of a version string.  The patch value is always a string
    not a number
  */
  patch: function(vers) {
    var ret = vparse(vers)[3];
    return isNaN(Number(ret)) ? ret : Number(ret);
  },

  STRICT: 'strict',
  NORMAL: 'normal',

  /**
    Returns the comparison mode.  Will be one of NORMAL or STRICT
  */
  mode: function(vers) {
    var ret = vparse(vers)[4];
    return ret === '=' ? semver.STRICT : semver.NORMAL;
  },

  /**
    Compares two patch strings using the proper matching formula defined by
    semver.org.  Returns:
    
    @param {String} patch1 first patch to compare
    @param {String} patch2 second patch to compare
    @returns {Number} -1 if patch1 < patch2, 1 if patch1 > patch2, 0 if equal 
  */
  comparePatch: function(patch1, patch2) {
    var num1, num2;

    if (patch1 === patch2) return 0; // equal

    num1   = Number(patch1);
    num2   = Number(patch2);

    if (isNaN(num1)) {
      if (isNaN(num2)) {
        // do lexigraphic comparison
        return natcompare(patch1, patch2);

      } else return -1; // num2 is a number therefore num1 < num2

    // num1 is a number but num2 is not so num1 > num2
    } else if (isNaN(num2)) {
      return 1 ;
    } else {
      return num1<num2 ? -1 : (num1>num2 ? 1 : 0) ;
    }
  },

  /**
    Compares two version strings, using natural sorting for the patch.
  */
  compare: function(vers1, vers2) {
    var ret ;

    if (vers1 === vers2) return 0;
    if (!vers1) return -1; 
    if (!vers2) return 1; 

    vers1 = vparse(vers1);
    vers2 = vparse(vers2);

    ret = compareNum(vers1[0], vers2[0], vers1[1], vers2[1]);
    if (ret === 0) {
      ret = compareNum(vers1[0], vers2[0], vers1[2], vers2[2]);
      if (ret === 0) ret = semver.comparePatch(vers1[3], vers2[3]);
    }

    return (ret < 0) ? -1 : (ret>0 ? 1 : 0);
  },

  /**
    Returns true if the second version string represents a version compatible 
    with the first version.  In general this means the second version must be
    greater than or equal to the first version but its major version must not 
    be different.
  */
  compatible: function(reqVers, curVers) {
    if (!reqVers) return true; // always compatible with no version
    if (reqVers === curVers) return true; // fast path

    // strict mode, must be an exact (semantic) match
    if (semver.mode(reqVers) === semver.STRICT) {
      return curVers && (semver.compare(reqVers, curVers)===0);

    } else {
      if (!curVers) return true; // if no vers, always assume compat

      // major vers
      if (semver.major(reqVers) !== semver.major(curVers)) return false; 
      return semver.compare(reqVers, curVers) <= 0;
    }
  },

  /**
    Normalizes version numbers so that semantically equivalent will be treated 
    the same.
  */
  normalize: function(vers) {
    var patch;

    vers = semver.parse(vers);

    patch = Number(vers[3]);
    if (isNaN(patch)) patch = vers[3];

    return [Number(vers[1]), Number(vers[2]), patch].join('.');
  }
  
};
exports.semver = semver;
vparse = semver.parse;


// ..........................................................
// FACTORY
// 

/**
  @constructor
  
  A factory knows how to instantiate a new module for a sandbox, including 
  generating the require() method used by the module itself.  You can return
  custom factories when you install a plugin.  Your module should export
  loadFactory().
  
  The default factory here actually expects to receive a module descriptor
  as generated by the build tools.
*/
var Factory = exports.extend(Object);
exports.Factory = Factory;

Factory.prototype.init = function(moduleId, pkg, factory) {
  this.id  = moduleId;
  this.pkg = pkg;
  this.factory = factory;
};

var _createRequire = function(sandbox, module) {
  
  var curId  = module.id,
      curPkg = module.pkg;
      
  // basic synchronous require
  var req = function(moduleId, packageId) {
    if (packageId && moduleId.indexOf(':')<0) {
      moduleId = packageId+':'+moduleId;
    }
    
    return exports.wait(function(done) {
      sandbox.require(moduleId, curId, curPkg, false, done);
    });
  };

  // async version - packageId is optional
  req.ensure = function(moduleId, packageId, done) {

    // packageId is optional
    if (T_FUNCTION === typeof packageId) {
      done = packageId;
      packageId = null;
    }

    // always normalize moduleId to an array
    if (!isArray(moduleId)) {
      if (packageId && moduleId.indexOf(':')<0) {
        moduleId = packageId+':'+moduleId;
      }
      moduleId = [moduleId];
    }
    
    // if no arguments passed to callback, just ask sandbox for module - which 
    // will load the associated factory without activating it.  Otherwise,
    // do an actual require to run the module so we can return it
    var method =  (done.length===0) ? 'module' : 'require';
    comap(moduleId, function(moduleId, done) {
      sandbox[method](moduleId, curId, curPkg, true, done);

    })(function(err, results) { 
      if (err) throw err;
      
      // invoke callback, passing the actual modules themselves
      if (method === 'require') return done.apply(null, results);
      
      // don't pass the modules - just invoke callback
      else return done();
    });
  };
  
  var _reqReady = function(moduleIds, done) {
    cofind(moduleIds, function(moduleId, done) {
      sandbox.ready(moduleId, curId, curPkg, done);
    })(function(err, found) {
      if (err) return done(err);
      else return done(null, !!found);
    });
  };
  
  // return true if the passed module or modules are ready for use right now
  // this is like calling ensure() but it won't load anything that isn't 
  // actually ready
  req.ready = function(moduleId, packageId, done) {
    var idx, len ;

    // packageId is optional
    if (T_FUNCTION === typeof packageId) {
      done = packageId;
      packageId = null;
    }

    // always normalize moduleId to an array
    if (!isArray(moduleId)) {
      if (packageId && moduleId.indexOf(':')<0) {
        moduleId = packageId+':'+moduleId;
      }
      moduleId = [moduleId];
    }

    if (done) {
      _reqReady(moduleId, done);
    } else {
      return exports.wait(function(done) { _reqReady(moduleId, done); });
    }
  };
  
  req.wait = exports.wait;
  
  // mark main module in sandbox
  req.main = sandbox.main;
  req.sandbox = sandbox;
  
  return req;
};


/**
  Actually generates a new set of exports for the named sandbox.  The sandbox
  must return a module object that can be used to generate the factory.
  
  If the current value of the local factory is a string, then we will actually
  eval/compile the factory as well.
  
  @param sandbox {Sandbox}
    The sandbox the will own the module instance
    
  @param module {Module}
    The module object the exports will belong to
    
  @returns {Hash} exports from instantiated module
*/
Factory.prototype.call = function(sandbox, module) {

  // get the factory function, evaluate if needed
  var func = this.factory,
      filename = this.__filename,
      dirname  = this.__dirname;
      
  if (T_STRING === typeof(func)) {
    func = this.factory = Factory.compile(func, this.pkg.id+':'+this.id);
  }

  // generate a nested require for this puppy
  var req = _createRequire(sandbox, module),
      exp = module.exports;
  func.call(exp, req, exp, module, filename, dirname);
  return module.exports;
};


// standard wrapper around a module.  replace item[1] with a string and join.
var MODULE_WRAPPER = [
  '(function(require, exports, module) {',
  null,
  '\n});\n//@ sourceURL=',
  null,
  '\n'];

/**
  Evaluates the passed string.  Returns a function.
  
  @param moduleText {String}
    The module text to compile
    
  @param moduleId {String}
    Optional moduleId.  If provided will be used for debug
    
  @returns {Function} compiled factory
*/
Factory.compile = function(moduleText, moduleId) {
  var ret;
  
  MODULE_WRAPPER[1] = moduleText;
  MODULE_WRAPPER[3] = moduleId || '(unknown module)';
  
  ret = MODULE_WRAPPER.join('');
  ret = eval(ret);
  
  MODULE_WRAPPER[1] = MODULE_WRAPPER[3] = null;
  return ret;
};

exports.Factory = Factory;

// ..........................................................
// MODULE
// 

/**
  A Module describes a single module, including its id, ownerPackage, and
  the actual module exports once the module has been instantiated.  It also
  implements the resource() method which can lookup a resource on the module's
  package.
*/
var Module = exports.extend(Object);
exports.Module = Module;

Module.prototype.init = function(id, ownerPackage) {
  this.id = id;
  this.ownerPackage = ownerPackage;

  var module = this;
  
  /**
    Lookup a resource on the module's ownerPackage.  Returns a URL or path 
    for the discovered resource.  The method used to detect the module or 
    package is implemented in the package.
    
    Note that this method is generated for each module we create because some
    code will try to pluck this method off of the module and call it in a
    different context.
    
    @param resourceId {String}
      Full or partial name of resource to retrieve
      
    @param done {Function}
      Optional.  Makes the resource discovery asyncronous
      
    @returns {String} url or path if not called async
  */
  this.resource = function(id, done) {
    return ownerPackage.resource(id, module.id, done);
  };
};

// ..........................................................
// PACKAGE
// 

/**
  Package expects you to register the package with a config having the 
  following keys:
  
    {
      "name": "name-of-package" (vs canonical id)
      "version": current version of package (if known)
      
      // these are dependencies you require to run.  If the package is 
      // async loaded, these will be the ones loaded
      "dependencies": {
         "package-name": "version"
      },
      
      // these map a specific package-name/version to a canonicalId that must
      // be registered for the package to be loaded.  You may include 
      // additional packages here that may be referenced but are not required
      // to run (for example - lazy loaded packages)
      //
      // This also forms the universe of packages this particular package can
      // reference.
      //
      "tiki:packages": {
        "package-name": [
          { "version": "1.0.0", "id": "canonicalId", "url": "url" }
        ]
      },

      // ids mapped to urls.  all of these scripts must be loaded for this 
      // package to be considered ready 
      "tiki:scripts": {
        "id": "url"
      },
      
      // stylesheets that must be loaded for this package to be considered
      // ready.  The id is used so that the URL can load from a relative path
      // that may move around and still be accurate.
      "tiki:stylesheets": {
        "id": "url",
        "id": "url"
      },
      
      // maps asset paths for non-JS and non-CSS assets to URLs.  Used to 
      // progrmatically load images, etc.
      "tiki:resources": {
        "asset/path": "url",
        "asset/path": "url"
      }
    }

  This registration ensures that the package and it's related assets are 
  loaded.
*/
     
var Package = exports.extend(Object);
exports.Package = Package;

Package.prototype.init = function(id, config) {
  if (!isCanonicalId(id)) id = '::'+id; // normalize
  this.id = id;
  this.config = config;
  this.isReady = true;
};

// ..........................................................
// Package Configs
// 

/**
  Retrieves the named config property.  This method can be overidden by 
  subclasses to perform more advanced processing on the key data
  
  @param {String} key
    The key to retrieve
    
  @returns {Object} the key value or undefined
*/
Package.prototype.get = function(key) {
  return this.config ? this.config[key] : undefined;
};

/**
  Updates the named config property.

  @param {String} key
    The key to update
    
  @param {Object} value
    The object value to change
    
  @returns {Package} receiver
*/
Package.prototype.set = function(key, value) {
  if (!this.config) this.config = {};
  this.config[key] = value;
  return this;
};

/**
  Determines the required version of the named packageId, if any, specified
  in this package.
  
  @param {String} packageId
    The packageId to lookup
    
  @returns {String} The required version or null (meaning any)
*/
Package.prototype.requiredVersion = function(packageId) { 
  var deps = this.get('dependencies');
  return deps ? deps[packageId] : null;
};

// ..........................................................
// Nested Packages
// 

Package.prototype.canonicalPackageId = function(packageId, vers, done) {
  if ((packageId === this.get('name')) && semver.compatible(vers, this.get('version'))) {
      return done(null, this.id);
  }
  
  return done(null, null);
};

/**
  Looks up nested packages.  In the browser, packages can't have nested
  versions so this default just always returns false.
*/
Package.prototype.packageFor = function(canonicalId, fetchIfNeeded, done) {
  if (canonicalId === this.id) return done(null, this);
  return done(null, null);
};

Package.prototype.packageReady = function(canonicalId) {
  if (canonicalId === this.id) return this.isReady;
};

// ..........................................................
// Package Module Loading
// 

/**
  Detects whether the moduleId exists in the current package.  Invokes the 
  passed callback with an error object (if there was an error) and a flag.
  
  @param {String} moduleId
    The moduleId to check
    
  @param {Function} done
    Callback.  Expect an error object and a Bool.
    
  @returns {void}
*/
Package.prototype.exists = function(moduleId, done) {
  return done(null, !!(this.factories && this.factories[moduleId]));
};

/**
  Invokes callback with a Factory object for the passed moduleId or null if
  no matching factory could be found.
*/
Package.prototype.load = function(moduleId, done) {
  return done(null, this.factories ? this.factories[moduleId] : null);
};

// ..........................................................
// LOADER
// 

// potentially optimize to avoid memory churn.
var joinPackageId = function joinPackageId(packageId, moduleId) {
  return packageId+':'+moduleId;
};

/**
  A loader is responsible for finding and loading factory functions.  The 
  primary purpose of the loader is to find packages and modules in those 
  packages.  The loader typically relies on one or more sources to actually
  find a particular package.
*/
var Loader = exports.extend(Object);
exports.Loader = Loader;

Loader.prototype.init = function(sources) {
  this.sources = sources || [];
  this.clear();
};

/**
  Clear caches in the loader causing future requests to go back to the 
  sources.
*/
Loader.prototype.clear = function() {
  this.factories = {};
  this.canonicalIds = {};
  this.packages ={};
  this.packageSources = {};
  this.canonicalPackageIds = {};
};

/**
  The default package.  This can be replaced but normally it is empty, meaning
  it will never match a module.
  
  @property {Package}
*/
Loader.prototype.defaultPackage = new Package('default', { 
  name: "default" 
});

/**
  The anonymous package.  This can be used when loading files outside of a 
  package.
  
  @property {Package}
*/
Loader.prototype.anonymousPackage = new Package('(anonymous)', { 
  name: "(anonymous)"
});


/**

  Discovers the canonical id for a module.  A canonicalId is a valid URN that
  can be used to uniquely identify a module.
  that looks like:
  
    ::packageId:moduleId
    
  For example:
  
    ::sproutcore-runtime/1.2.0:mixins/enumerable
  
  Canonical Ids are discovered according to the following algorithm:
  
  1.  If you pass in an already canonicalId, return it
  2.  If you pass in a relative moduleId, it will be expanded and attached
      to the workingPackage.
  3.  If you pass in a moduleId with a packageId embedded, lookup the latest
      version of the package that is compatible with the passed workingPackage
  4.  If you pass a moduleId with no packageId embedded, then first look
      for the module on the workingPackage.  
  5.  If not found there, look for a packageId with the same name.  If that is 
      found, return either packageId:index or packageId:packageId as module.  
  6.  Otherwise, assume it is part of the default package. 

  @param {String} moduleId
    The moduleId to lookup.  May be a canonicalId, packageId:moduleId, 
    absolute moduleId or relative moduleId
    
  @param {String} curModuleId
    Optional.  moduleId of the module requesting the lookup.  Only needed if
    the moduleId param might be relative.
    
  @param {Package} workingPackage
    The working package making the request.  When searching for a package,
    only use packages that are compatible with the workingPackage.
    
    This parameter is also optional, though if you omit it, this method 
    assumes the anonymousPackage.
    
  @param {Function} done
    Callback invoked with format function(err, canonicalId).
    
  @returns {void}
*/
Loader.prototype.canonical = function(moduleId, curModuleId, workingPackage, fetchIfNeeded, done) {
  
  var loader = this, cache, cacheId, action,
      idx, packageId, defaultPackage, anonymousPackage; 
  
  // NORMALIZE PARAMS
  // normalize params - curModuleId can be omitted (though relative ids won't)
  // work
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }
  
  if (workingPackage && !(workingPackage instanceof Package)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = null;
  }

  if (fetchIfNeeded && (T_FUNCTION === typeof fetchIfNeeded)) {
    done = fetchIfNeeded;
    fetchIfNeeded = false;
  }

  // return immediately if already canonical
  if (isCanonicalId(moduleId)) return done(null, moduleId);
  
  // if no workingPackage, assume anonymous
  if (!workingPackage) workingPackage = this.anonymousPackage;

  
  // Resolve moduleId - may return canonical
  moduleId = loader._resolve(moduleId, curModuleId, workingPackage);
  if (moduleId && (moduleId instanceof Error)) return done(moduleId); // err
  if (isCanonicalId(moduleId)) return done(null, moduleId);
  
  // then lookup in cache
  cacheId = workingPackage ? workingPackage.id : '(null)';
  cache = this.canonicalIds;
  if (!cache) cache = this.canonicalIds = {};
  if (!cache[cacheId]) cache[cacheId] = {};
  cache = cache[cacheId];
  if (cache[moduleId]) return cache[moduleId](done);
  cacheId = moduleId; // save for later

  // Not Found in Cache.  Do a lookup
  idx = moduleId.indexOf(':');
  if (idx>=0) {
    packageId = moduleId.slice(0,idx);
    moduleId  = moduleId.slice(idx+1);
    if (moduleId[0]==='/') {
      return done(new Error('Absolute path not allowed with packageId'));
    }
  }

  defaultPackage = loader.defaultPackage;
  anonymousPackage = loader.anonymousPackage;

  // use once() to ensure that multiple canonical lookups will only happen
  // one time.
  action = cache[cacheId] = once(function(done) {

    // if packageId is provided, just resolve packageId to a canonicalId and 
    // return
    if (packageId && (packageId.length>0)) {
      loader._canonicalPackageId(packageId, null, workingPackage, function(err, canonicalId) {
        if (err) return done(err);
        if (!canonicalId) {
          action.reset(); // make sure we call again
          return done(); // not found!
        }
        
        else return done(null, joinPackageId(canonicalId,moduleId));
      });

    // no packageId is provided, we'll need to do a little more searching
    } else {

      // first look in workingPackage for match...
      (function(next) {
        if (!workingPackage) next(); //skip
        workingPackage.exists(moduleId, function(err, exists) {
          if (err) return done(err);
          if (exists) {
            return done(null, joinPackageId(workingPackage.id,moduleId));
          }
          else next();
        });
      })(function() {

        // not in working package, look for packageId:index or
        // packageId:packageId
        (function(next) {

          // find a canonicalId for this moduleId (i.e. packageId)
          loader._canonicalPackageId(moduleId, null, workingPackage, function(err, canonicalId) {
            if (err) return done(err);
            if (!canonicalId) return next(); // not found, moving on...

            // get the package for said canonicalId
            loader._packageFor(canonicalId, workingPackage, fetchIfNeeded, function(err,pkg){
              if (err) return done(err);
              if (!pkg) return next();  // not found, moving on...

              // look for a module named 'index'
              pkg.exists('index', function(err, exists) {
                if (err) return done(err);
                if (exists) return done(null, joinPackageId(pkg.id,'index')); 
                
                // if not found, look for moduleId:moduleId
                pkg.exists(moduleId, function(err, exists) {
                  if (err) return done(err);
                  if (exists) {
                    return done(null, joinPackageId(pkg.id,moduleId));
                  }
                  return next(); // not found
                });
              });
            });
          });

        // not in working package and isn't a package itself, assume default
        // package.  If there is no defaultPackage, return with the working
        // package.  This will fail but at least the error will be more 
        // helpful
        })(function() {
          if (defaultPackage) packageId = defaultPackage.id;
          else if (workingPackage) packageId = workingPackage.id;
          else if (anonymousPackage) packageId = anonymousPackage.id;
          else return done(new Error(moduleId+' not found'));
          return done(null, joinPackageId(packageId, moduleId));
        });
      });

    }
  });

  cache[cacheId](done); // invoke once handler..
};

// more specific alias for canonical()
Loader.prototype.canonicalModuleId = Loader.prototype.canonical;
  
/**

  Loads a factory for the named canonical module Id.  If you did not obtain
  the canonical module id through the loader's canonical() method, then you
  must also pass a workingPackage property so that the loader can locate the
  package that owns the module.
  
  The returns factory function can be used to actually generate a module.
  
  @param {String} canonicalId
    A canonical module id
    
  @param {Package} workingPackage
    Optional working package.  Only required if you pass in a canonical id
    that you did not obtain from the loader's canonical() method.
    
  @param {Function} done
    Callback invoked when the factory is loaded
    
  @returns {void}
  
*/
Loader.prototype.load = function(canonicalId, workingPackage, fetchIfNeeded, done){

  var loader = this, cache, action;
  
  if (workingPackage && !(workingPackage instanceof Package)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = null;
  }

  if (fetchIfNeeded && (T_FUNCTION === typeof fetchIfNeeded)) {
    done = fetchIfNeeded;
    fetchIfNeeded = false;
  }

  if (!workingPackage) workingPackage = this.anonymousPackage;
  
  cache = this.factories;
  if (!cache) cache = this.factories = {};
  if (cache[canonicalId]) return cache[canonicalId](done);

  // use once so that multiple calls won't load more than once
  action = cache[canonicalId] = once(function(done) {
    var idx       = canonicalId.indexOf(':',3),
        packageId = canonicalId.slice(0,idx),
        moduleId  = canonicalId.slice(idx+1);

    loader._packageFor(packageId, workingPackage, fetchIfNeeded, function(err, pkg) {
      if (err || !pkg) action.reset(); 
      if (err) return done(err);
      if (!pkg) return done();

      pkg.load(moduleId, function(err, factory) {
        if (err || !factory) action.reset();
        return done(err, factory);
      });
    });
  });
  
  cache[canonicalId](done); // make sure it runs
};


// more specific alias for load()
Loader.prototype.loadFactory = Loader.prototype.load;

/**
  Discovers the canonical id for a package.  A cnaonicalID is a URN that can
  be used to uniquely identify a package.  It looks like: 
  
    ::packageId
  
  for example:
  
    ::sproutcore-datastore/1.2.0/1ef3ab23ce23ff938

  If you need to perform some low-level operation on a package, this method
  is the best way to identify the package you want to work with specifically.
  
  ## Examples
  
  Find a compatible package named 'foo' in the current owner module:
  
      loader.canonicalPackage('foo', ownerPackage, function(err, pkg) {
        // process response
      });
      
  Find the package named 'foo', exactly version '1.0.0'.  This may return a
  packes nested in the ownerPackage:
  
      loader.canonicalPackage('foo', '=1.0.0', ownerPackage, function(err, pkg) {
        // process response
      });
  
  Find the latest version of 'foo' installed in the system - not specific to 
  any particular package
  
      loader.canonicalPackage('foo', loader.anonymousPackage, function(err, pkg) {
        // process result
      });
      
  @param {String|Package} packageId
    The packageId to load.  If you pass a package, the package itself will
    be returned.
    
  @param {String} vers 
    The required version.  Pass null or omit this parameter to use the latest
    version (compatible with the workingPackage).
    
  @param {Package} workingPackage
    The working package.  This method will search in this package first for
    nested packages.  It will also consult the workingPackage to determine 
    the required version if you don't name a version explicitly.
    
    You may pass null or omit this parameter, in which case the anonymous
    package will be used for context.
    
  @param {Function} done 
    Callback.  Invoked with an error and the loaded package.  If no matching
    package can be found, invoked with null for the package.

  @returns {void}
*/
Loader.prototype.canonicalPackageId = function(packageId, vers, workingPackage, fetchIfNeeded, done) {

  var idx;

  // fast path in case you pass in a package already
  if (packageId instanceof Package) return done(null, packageId.id);
  
  // normalize the params.  vers may be omitted
  if (vers && (T_STRING !== typeof vers)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = vers;
    vers = null;
  }
  
  if (workingPackage && !(workingPackage instanceof Package)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = null;
  }

  if (fetchIfNeeded && (T_FUNCTION === typeof fetchIfNeeded)) {
    done = fetchIfNeeded;
    fetchIfNeeded = false;
  }

  // fast path packageId is already canonical
  if (isCanonicalId(packageId)) {
    // slice off any moduleId if needed
    idx = packageId.indexOf(':', 2);
    if (idx>=0) packageId = packageId.slice(0,idx);
    return done(null, packageId);
  }


  // must always have a package
  if (!workingPackage) workingPackage = this.anonymousPackage;
  
  // if packageId includes a moduleId, slice it off
  idx = packageId.indexOf(':');
  if (idx>=0) packageId = packageId.slice(0, idx);
  
  // now we can just pass onto internal primitive
  this._canonicalPackageId(packageId, vers, workingPackage, done);
};


/**
  Primitive returns the package instance for the named canonicalId.  You can
  pass in a canonicalId for a package only or a package and module.  In either
  case, this method will only return the package instance itself.
  
  Note that to load a canonicalId that was not resolved through the 
  canonicalPackageId() or canonical() method, you will need to also pass in
  a workingPackage so the loader can find the package.
  
  @param {String} canonicalId
    The canonicalId to load a package for.  May contain only the packageId or
    a moduleId as well.
    
  @param {Package} workingPackage
    Optional workingPackage used to locate the package.  This is only needed
    if you request a canonicalId that you did not obtain through the 
    canonical*() methods on the loader.
    
  @param {Function} done
    Callback invoked with package instance when loaded

  @returns {void}
*/
Loader.prototype.packageFor = function(canonicalId, workingPackage, fetchIfNeeded, done){

  if (workingPackage && !(workingPackage instanceof Package)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = null;
  }

  if (fetchIfNeeded && (T_FUNCTION === typeof fetchIfNeeded)) {
    done = fetchIfNeeded;
    fetchIfNeeded = false;
  }

  if (!workingPackage) workingPackage = this.anonymousPackage;
  
  // remove moduleId
  var idx = canonicalId.indexOf(':', 2);
  if (idx>=0) canonicalId = canonicalId.slice(0, idx);

  this._packageFor(canonicalId, workingPackage, fetchIfNeeded, done);
};

/**
  Verifies that the named canonicalId is ready for use, including any of its
  dependencies.  You can pass in either a canonical packageId only or a 
  moduleId.   In either case, this method will actually only check the package
  properties for dependency resolution since dependencies are not tracked for
  individual modules.
  
  @param {String} canonicalId
    The canonicalId to use for lookup
    
  @param 
*/
Loader.prototype.ready = function(canonicalId, workingPackage, fetchIfNeeded, done) {

  if (workingPackage && (T_FUNCTION === typeof workingPackage)) {
    done = workingPackage;
    workingPackage = null;
  }
  
  if (!workingPackage) workingPackage = this.anonymousPackage;
  
  // strip out moduleId
  var loader = this,
      idx = canonicalId.indexOf(':', 2), 
      moduleId;
  
  if (idx >= 0) {
    moduleId    = canonicalId.slice(idx+1);
    canonicalId = canonicalId.slice(0, idx);
  }
  
  this._packageReady(canonicalId, workingPackage, {}, function(err, isReady) {
    if (err || !isReady || !moduleId) return done(err, isReady);
    loader._packageFor(canonicalId, workingPackage, false, function(err, pkg){
      if (err) return done(err);
      if (!pkg) return done(null, false); // not ready
      return pkg.exists(moduleId, done); // only ready if moduleId exists
    });
  });
};

/**
  @private
  
  Discovers the canonical packageId for the named packageId, version and 
  working package.  This will also store in cache the source where you can
  locare and load the associated package, if needed.
  
  This primitive is used by all other package methods to resolve a package
  into a canonicalId that can be used to reference a specific package instance
  
  It does not perform any error checking on passed in parameters which is why
  it should never be called directly outside of the Loader itself.
  
  @param {String|Package} packageId
    The packageId to load.  If you pass a package, the package itself will
    be returned.
    
  @param {String} vers 
    The required version.  Pass null or omit this parameter to use the latest
    version (compatible with the workingPackage).
    
  @param {Package} workingPackage
    The working package.  This method will search in this package first for
    nested packages.  It will also consult the workingPackage to determine 
    the required version if you don't name a version explicitly.
    
  @param {Function} done 
    Callback.  Invoked with an error and the loaded package.  If no matching
    package can be found, invoked with null for the package.
    
  @returns {void}
*/
Loader.prototype._canonicalPackageId = function(packageId, vers, workingPackage, done) {
  
  // fast paths
  if (packageId instanceof Package) return done(null, packageId.id);
  if (isCanonicalId(packageId)) return done(null, packageId);
  
  var loader = this,
      cache = this.canonicalPackageIds,
      cacheId, scache, sources, action;

  // use anonymousPackage if no workingPackage is provided
  if (!workingPackage) workingPackage = this.anonymousPackage;
  if (!workingPackage) return done(new Error('working package is required'));

  // if packageId is already canonical, vers must be null, otherwise lookup
  // vers in working package
  if (!vers) vers = workingPackage.requiredVersion(packageId);
  
  // look in cache...
  cacheId = workingPackage.id;
  if (!cache) cache = this.canonicalPackageIds = {};
  if (!cache[cacheId]) cache[cacheId] = {};
  cache = cache[cacheId];
  if (!cache[packageId]) cache[packageId] = {};
  cache = cache[packageId];
  if (cache[vers]) return cache[vers](done);

  sources = this.sources;

  // not in cache, do the work
  action = cache[vers] = once(function(done) {
    
    // first, ask the workingPackage to find any matching package (since it 
    // can only have one version).  Then check the returned version against 
    // the expected version.  
    (function(next) {
      if (!workingPackage) return next(); // skip

      workingPackage.canonicalPackageId(packageId, vers, function(err, id) {
        if (err) return done(err);
        if (id) { // found - update sources cache and return this action...
          loader._cachePackageSource(id, workingPackage, workingPackage);
          return done(null, id);
        }

        // not found - make sure there isn't another incompatible version
        workingPackage.canonicalPackageId(packageId, null, function(err, id) {
          if (!err && id) {
            err = new Error(
              workingPackage.get('name')+" contains an incompatible nested"+
              " package "+packageId+" (expected: "+vers+")");
          }
          if (err) return done(err);
          return next(); // not other version so we can go on...
        });

      });

    })(function() {

      // next, if not found in the workingPackage, then ask each of our 
      // sources in turn until a match is found.  When found, return
      (function(next) {
        if (!sources) return next(); // skip if no sources

        var ret = null;
        cofind(sources, function(source, done) {
          source.canonicalPackageId(packageId, vers, function(err, id) {
            if (err) return done(err);
            if (id) {
              loader._cachePackageSource(id, workingPackage, source);
              ret = id;
              return done(null, true);
            } else {
              return done(null, false);
            }
          });

        })(function(err) {
          if (err) return done(err);
          if (ret) return done(null, ret); // found!
          return next(); // not found, skip
        });

      // no matching packages were found anywhere.  Just return null
      })(function() {
        // make this action run again next time in case pkg loads
        action.reset(); 
        done(); // resolve action
        
      });
    });
    
  });
  
  cache[vers](done);
};

// add a function to the cache that will immediately return the source
Loader.prototype._cachePackageSource = function(id, workingPackage, source) {
  var scache = this.packageSources, pkgId = workingPackage.id;
  
  if (!scache) scache = this.packageSources = {};
  if (!scache[pkgId]) scache[pkgId] = {};
  scache = scache[pkgId];
  scache[id] = function(done) { return done(null, source); };
};

/**
  Looks up the source for the named canonicalId in the cache.  Returns null
  if no match is found.
*/
Loader.prototype._sourceForCanonicalPackageId = function(canonicalId, workingPackage, done) {
  var scache = this.packageSources, wpackageId = workingPackage.id, 
      action, sources;

  if (!scache) scache = this.packageSources = {};
  if (!scache[wpackageId]) scache[wpackageId] = {};
  scache = scache[wpackageId];
  if (scache[canonicalId]) return scache[canonicalId](done);
  
  sources = this.sources;
  action = scache[canonicalId] = once(function(done) {
    
    // first, ask the workingPackage to find any matching package (since it 
    // can only have one version).  Then check the returned version against 
    // the expected version.  
    (function(next) {
      if (!workingPackage) return next(); // skip
      workingPackage.packageFor(canonicalId, false, function(err, id) {
        if (err) return done(err);
        if (id) return done(null, workingPackage);
        next(); // not found
      });

    })(function() {

      // next, if not found in the workingPackage, then ask each of our 
      // sources in turn until a match is found.  When found, return
      (function(next) {
        if (!sources) return next(); // skip if no sources

        var ret = null;
        cofind(sources, function(source, done) {
          source.packageFor(canonicalId, false, function(err, id) {
            if (err) return done(err);
            if (id) ret = source;
            done(null, !!id);
          });

        })(function(err) {
          if (err) return done(err);
          if (ret) return done(null, ret); // found!
          return next(); // not found, skip
        });

      // no matching packages were found anywhere.  Just return null
      })(function() {
        // make this action run again next time in case pkg loads
        action.reset(); 
        done(); // resolve action

      });
    });
    
  });
  
  action(done);
  
};

/**
  Primitive actually loads a package from a canonicalId.  Throws an exception
  if source for package is not already in cache.  Also caches loaded package.
*/
Loader.prototype._packageFor = function(canonicalId, workingPackage, fetchIfNeeded, done) {
  var loader = this, cache, action;

  // try to resolve out of cache
  cache = this.packages;
  if (!cache) cache = this.packages = {};
  if (cache[canonicalId]) return cache[canonicalId](done);

  action = cache[canonicalId] = once(function(done) {
    loader._sourceForCanonicalPackageId(canonicalId, workingPackage, function(err, source) {
      
      if (err || !source) {
        action.reset(); // recompute in case this changes
        return done(err, source);
      }
      
      source.packageFor(canonicalId, fetchIfNeeded, done);
    });
  });

  action(done);
};

/**
  Primitive simply checks to see if the named canonicalId is ready or not
*/
Loader.prototype._packageReady = function(canonicalId, workingPackage, seen, done) {
  var cache = this.packages, loader = this;

  // if we've already seen this package, exit immediately
  if (seen[canonicalId]) return done(null, true);
  seen[canonicalId] = true;
  
  // first try to find the package for the receiver. load if it necessary
  (function(next) {
    if (cache && cache[canonicalId]) return cache[canonicalId](next);
    loader._packageFor(canonicalId, workingPackage, false, next);
    
  // if pkg is found, also lookup dependencies
  })(function(err, pkg) {
    var deps, packageId, vers, packageIds;

    if (err) return done(err);
    if (!pkg) return done(null, false); // not ready

    deps = pkg.get('dependencies');
    if (!deps) return done(null, true); // this one is ready
    
    packageIds = [];
    for(packageId in deps) {
      if (!deps.hasOwnProperty(packageId)) continue;
      packageIds.push({ packageId: packageId, vers: vers });
    }
    
    // should return true if any of these are NOT ready.
    cofind(packageIds, function(info, done) {
      loader._canonicalPackageId(info.packageId, info.vers, pkg, 
      function(err, canonicalId) {
        if (err) return done(err);
        if (!canonicalId) return done(err, true); // NOT ready
        loader._packageReady(canonicalId, pkg, seen, function(err, ready) {
          if (err) return done(err);
          return done(err, !ready);
        });
      });
    })(function(err, isNotReady) {
      if (err) return done(err);
      return done(null, !isNotReady);
    });
  });
};

/**
  Take a relative or fully qualified module name as well as an optional
  base module Id name and returns a fully qualified module name.  If you 
  pass a relative module name and no baseId, throws an exception.

  Any embedded package name will remain in-tact.

  resolve('foo', 'bar', 'my_package') => 'foo'
  resolve('./foo', 'bar/baz', 'my_package') => 'my_package:bar/foo'
  resolve('/foo/bar/baz', 'bar/baz', 'my_package') => 'default:/foo/bar/baz'
  resolve('foo/../bar', 'baz', 'my_package') => 'foo/bar'
  resolve('your_package:foo', 'baz', 'my_package') => 'your_package:foo'

  If the returned id does not include a packageId then the canonical() 
  method will attempt to resolve the ID by searching the default package, 
  then the current package, then looking for a package by the same name.

  @param {String} moduleId relative or fully qualified module id
  @param {String} baseId fully qualified base id
  @returns {String} fully qualified name
*/
Loader.prototype._resolve = function(moduleId, curModuleId, pkg){
  var path, len, idx, part, parts, packageId, err;

  // if id does not contain a packageId and it starts with a / then 
  // return with anonymous package id.
  if (moduleId[0]==='/' && moduleId.indexOf(':')<0) {
    return this.anonymousPackage.id + ':' + moduleId;
  }

  // contains relative components?
  if (moduleId.match(/(^\.\.?\/)|(\/\.\.?\/)|(\/\.\.?\/?$)/)) {

    // if we have a packageId embedded, get that first
    if ((idx=moduleId.indexOf(':'))>=0) {
      packageId = moduleId.slice(0,idx);
      moduleId  = moduleId.slice(idx+1);
      path      = []; // path must always be absolute.

    // if no package ID, then use baseId if first component is . or ..
    } else if (moduleId.match(/^\.\.?\//)) {
      if (!curModuleId) {
        err = new Error("id required to resolve relative id: "+moduleId);
        return err;
      }

      // if base moduleId contains a packageId return an error
      if (curModuleId.indexOf(':')>=0) {
        err = new Error("current moduleId cannot contain packageId");
        return err;
      }
        
      // use the pkg.id (which will be canonical)
      if (pkg) packageId = pkg.id;

      // work from current moduleId as base.  Ignore current module name
      path = curModuleId.split('/');
      path.pop(); 

    } else path = [];

    // iterate through path components and update path
    parts = moduleId.split('/');
    len   = parts.length;
    for(idx=0;idx<len;idx++) {
      part = parts[idx];
      if (part === '..') {
        if (path.length<1) return new Error("invalid path: "+moduleId);
        path.pop();

      } else if (part !== '.') path.push(part);
    }

    moduleId = path.join('/');
    if (packageId) moduleId = joinPackageId(packageId, moduleId);
  }

  return moduleId ;
};


// ..........................................................
// SANDBOX
// 

/**
  A Sandbox maintains a cache of instantiated modules.  Whenever a modules 
  is instantiated, it will always be owned by a single sandbox.  This way
  when you required the same module more than once, you will always get the
  same module.
  
  Each sandbox is owned by a single loader, which is responsible for providing
  the sandbox with Factory objects to instantiate new modules.
  
  A sandbox can also have a 'main' module which can be used as a primary
  entry point for finding other related modules.
  
*/
var Sandbox = exports.extend(Object);
exports.Sandbox = Sandbox;

Sandbox.prototype.init = function(loader) {
  this.loader = loader;
  this.clear();
};

// ..........................................................
// RESOLVING MODULE IDS
// 

/**
  Retrieves a module object for the passed moduleId.  You can also pass 
  optional package information, including an optional curModuleId and a
  workingPackage.  You MUST pass at least a workingPackage.
  
  The returned module object represents the module but the module exports may
  not yet be instantiated.  Use require() to retrieve the module exports.
  
  @param {String} moduleId
    The module id to lookup.  Should include a nested packageId
    
  @param {String} curModuleId
    Optional current module id to resolve relative modules.
    
  @param {Package} workingPackage
    The working package making the request
    
  @param {Function} done
    Callback to invoke when the module has been retrieved.
    
  @returns {void}
*/
Sandbox.prototype.module = function(moduleId, curModuleId, workingPackage, fetchIfNeeded, done) {

  // curModuleId is optional
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }
  
  // workingPackage is optional 
  if (workingPackage && (T_FUNCTION === typeof workingPackage)) {
    done = workingPackage;
    workingPackage = null;
  }

  if (fetchIfNeeded && (T_FUNCTION === typeof fetchIfNeeded)) {
    done = fetchIfNeeded;
    fetchIfNeeded = false;
  }

  var sandbox = this,
      loader  = this.loader,
      cache   = this.modules;
      
  if (!cache) cache = this.modules = {};

  loader.canonical(moduleId, curModuleId, workingPackage, fetchIfNeeded,
  function(err, canonicalId) {
    
    var action;
    
    if (err) return done(err);
    if (!canonicalId) return done(); // not found
    if (cache[canonicalId]) return cache[canonicalId](done);

    // not in cache, generate new module object
    action = cache[canonicalId] = once(function(done) {
      var idx       = canonicalId.indexOf(':', 2), // skip '::'
          moduleId  = canonicalId.slice(idx+1),
          packageId = canonicalId.slice(0, idx);
          
      loader.packageFor(packageId, workingPackage, fetchIfNeeded, function(err,pkg) {
        if (err || !pkg) action.reset();
        if (err) return done(err);
        if (!pkg) return done(); // not found
        return done(null, new sandbox.Module(moduleId, pkg));
      });
    });

    action(done);
    
  });
};


/**
  Returns the exports for the named module.

  @param {String} moduleId
    The module id to lookup.  Should include a nested packageId
  
  @param {String} curModuleId
    Optional current module id to resolve relative modules.
  
  @param {Package} workingPackage
    The working package making the request
  
  @param {Function} done
    Callback to invoke when the module has been retrieved.
  
  @returns {void}
*/
Sandbox.prototype.require = function(moduleId, curModuleId, workingPackage, fetchIfNeeded, done) {

  // curModuleId is optional
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }

  // workingPackage is optional 
  if (workingPackage && (T_FUNCTION === typeof workingPackage)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = null;
  }
  
  if (fetchIfNeeded && (T_FUNCTION === typeof fetchIfNeeded)) {
    done = fetchIfNeeded;
    fetchIfNeeded = false;
  }

  var sandbox = this,
      loader  = sandbox.loader,
      cache   = this.exports,
      used    = this.usedExports;

  if (!cache) cache = this.exports = {};
  if (!used)  used  = this.usedExports = {};

  loader.canonical(moduleId, curModuleId, workingPackage, fetchIfNeeded,
  function(err, canonicalId) {

    var ret ;
    
    if (err) return done(err);
    if (!canonicalId) return done(); // not found
    
    // return out of cache...
    ret = cache[canonicalId];
    if (ret) {
      if (!used[canonicalId]) used[canonicalId] = ret;
      return done(null, ret);
    }

    // not in cache, load the module, factory and build exports
    ret = cache[canonicalId] = {};
    loader.load(canonicalId, workingPackage, fetchIfNeeded, function(err, factory) {
      if (err || !factory) cache[canonicalId] = null; // try again
      if (err) return done(err);
      if (!factory) return done(); // not found

      // get module
      sandbox.module(canonicalId, workingPackage, function(err, mod) {
        if (err) return done(err);
        
        mod.exports = ret; // use cached version
        var exp = factory.call(sandbox, mod);
        cache[canonicalId] = mod.exports = exp;
        
        // check for cyclical refs
        if (used[canonicalId] && (used[canonicalId] !== exp)) {
          err = new Error("cyclical requires() in "+canonicalId);
          return done(err);
        }
        
        return done(null, exp);
      });
    });
  });
};

/**
  Returns true if the given module is ready. This checks the local cache 
  first then hands this off to the loader.
*/
Sandbox.prototype.ready = function(moduleId, curModuleId, workingPackage, fetchIfNeeded, done) {

  // curModuleId is optional
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }

  // workingPackage is optional 
  if (workingPackage && !(workingPackage instanceof Package)) {
    done = fetchIfNeeded;
    fetchIfNeeded = workingPackage;
    workingPackage = null;
  }

  if (fetchIfNeeded && (T_FUNCTION === typeof fetchIfNeeded)) {
    done = fetchIfNeeded;
    fetchIfNeeded = false;
  }

  var sandbox = this,
      loader  = sandbox.loader;

  loader.canonical(moduleId, curModuleId, workingPackage, 
  function(err, canonicalId) {
    if (err) return done(err);
    if (!canonicalId) return done(null, false);
    loader.ready(canonicalId, workingPackage, fetchIfNeeded, done);
  });
  
};

/**
  Clears the sandbox.  requiring modules will cause them to be reinstantied
*/
Sandbox.prototype.clear = function() {
  this.exports = {};
  this.modules = {};
  this.usedExports = {};
  return this;
};

// ..........................................................
// BROWSER
// 

// Implements a default loader source for use in the browser.  This object
// should also be set as the "require" global on the browser to allow for
// module registrations

var Browser = exports.extend(Object);
exports.Browser = Browser;

Browser.prototype.init = function() {
  this.clear();
};

/**
  Reset the browser caches.  This would require all packages and modules 
  to register themselves.  You should also clear the associated loader and
  sandbox if you use this.
*/
Browser.prototype.clear = function() {
  this.packages    = {};
  this.factories   = {};
  this.stylesheets = {};
  this.scripts     = {};
  this.externals   = {}; // refs to external packages not yet loaded
};

/**
  Configures a basic sandbox environment based on the browser.  Now you can
  register and require from it.
*/
Browser.prototype.setup = function() {
  
};

// ..........................................................
// Registration API
// 

// creates a new action that will invoke the passed value then setup the
// resolve() method to wait on response
this._action  = function(action) {
  var ret;
  
  ret = once(function(done) {
    ret.resolve = function(err, val) {
      ret.resolve = null; // no more...
      done(err, val);
    };
    action(); 
  });
  return ret;
  
};

this._resolve = function(dict, key, value) {
  
  // for pushed content, just create the action function
  if (!dict[key]) dict[key] = function(done) { done(null, value); };
  
  // if a value already exists, call resolve if still valid
  else if (dict[key].resolve) dict[key].resolve(null, value);
  return this;
};

this._fail = function(dict, key, err) {
  if (dict[key].resolve) dict[key].resolve(err);
};

/**
  Register new package information.
*/
Browser.prototype.register = function(packageId, def) {
  if (def['tiki:external']) this.externals[packageId] = def;
  else this._resolve(this.packages, packageId, def);
  return this;
};

/**
  Main registration API for all modules.  Simply registers a module for later
  use by a package.
*/
Browser.prototype.define = function(key, def) {
  this._resolve(this.factories, key, def);
  return this; 
};

/**
  Register a script that has loaded
*/
Browser.prototype.script = function(scriptId) {
  this._resolve(this.scripts, scriptId, true);
};

/**
  Register a stylesheet that has loaded.
*/
Browser.prototype.stylesheet = function(stylesheetId) {
  this._resolve(this.stylesheets, stylesheetId, true);
};

// ..........................................................
// Called by Loader
// 

Browser.prototype.canonicalPackageId = function(packageId, vers, done) {
  
};

Browser.prototype.packageFor = function(canonicalId, fetchIfNeeded, done) {
  // fetchIfNeeded allows us to go get the package and all of its dependencies
  
};

// ..........................................................
// BROWSER PACKAGE
// 
var BrowserPackage = Package.extend();
Browser.prototype.Package = BrowserPackage;

