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

//@if debug

// export utility methods - mostly for testing purposes
exports.utils = {
  isArray: isArray,
  wait:    wait,
  comap:   comap,
  displayNames: displayNames
};

//@endif

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


function isWhitespaceChar(a)
{
    var charCode;
    charCode = a.charCodeAt(0);

    if ( charCode <= 32 )
    {
        return true;
    }
    else
    {
        return false;
    }
}

function isDigitChar(a)
{
    var charCode;
    charCode = a.charCodeAt(0);

    if ( charCode >= 48  && charCode <= 57 )
    {
        return true;
    }
    else
    {
        return false;
    }
}

function compareRight(a,b)
{
    var bias = 0;
    var ia = 0;
    var ib = 0;

    var ca;
    var cb;

    // The longest run of digits wins.  That aside, the greatest
    // value wins, but we can't know that it will until we've scanned
    // both numbers to know that they have the same magnitude, so we
    // remember it in BIAS.
    for (;; ia++, ib++) {
        ca = a.charAt(ia);
        cb = b.charAt(ib);

        if (!isDigitChar(ca)
                && !isDigitChar(cb)) {
            return bias;
        } else if (!isDigitChar(ca)) {
            return -1;
        } else if (!isDigitChar(cb)) {
            return +1;
        } else if (ca < cb) {
            if (bias === 0) {
                bias = -1;
            }
        } else if (ca > cb) {
            if (bias === 0) bias = +1;

        } else if (ca === 0 && cb === 0) {
            return bias;
        }
    }
}

function natcompare(a,b) {

    var ia = 0, ib = 0;
	var nza = 0, nzb = 0;
	var ca, cb;
	var result;

    while (true)
    {
        // only count the number of zeroes leading the last number compared
        nza = nzb = 0;

        ca = a.charAt(ia);
        cb = b.charAt(ib);

        // skip over leading spaces or zeros
        while ( isWhitespaceChar( ca ) || ca =='0' ) {
            if (ca == '0') {
                nza++;
            } else {
                // only count consecutive zeroes
                nza = 0;
            }

            ca = a.charAt(++ia);
        }

        while ( isWhitespaceChar( cb ) || cb == '0') {
            if (cb == '0') {
                nzb++;
            } else {
                // only count consecutive zeroes
                nzb = 0;
            }

            cb = b.charAt(++ib);
        }

        // process run of digits
        if (isDigitChar(ca) && isDigitChar(cb)) {
            if ((result = compareRight(a.substring(ia), b.substring(ib))) !== 0) {
                return result;
            }
        }

        if (ca === 0 && cb === 0) {
            // The strings compare the same.  Perhaps the caller
            // will want to call strcmp to break the tie.
            return nza - nzb;
        }

        if (ca < cb) {
            return -1;
        } else if (ca > cb) {
            return +1;
        }

        ++ia; ++ib;
    }
}


// ..........................................................
// PUBLIC API
// 

var semver = {};

/**
  Parse the version number into its components.  Returns result of a regex.
*/
semver.parse = function(vers) {
  var ret = vers.match(/^(=|~)?([\d]+?)(\.([\d]+?)(\.(.+))?)?$/);
  if (!ret) return null; // no match
  return [ret, ret[2], ret[4] || '0', ret[6] || '0', ret[1]];
};
var vparse = semver.parse;

/**
  Returns the major version number of a version string. 
  
  @param {String} vers
    version string
    
  @returns {Number} version number or null if could not be parsed
*/
semver.major = function(vers) {
  return Number(vparse(vers)[1]);
};
var major = semver.major;

/**
  Returns the minor version number of a version string
  
  
  @param {String} vers
    version string
    
  @returns {Number} version number or null if could not be parsed
*/
semver.minor = function(vers) {
  return Number(vparse(vers)[2]);
};

/**
  Returns the patch of a version string.  The patch value is always a string
  not a number
*/
semver.patch = function(vers) {
  var ret = vparse(vers)[3];
  return isNaN(Number(ret)) ? ret : Number(ret);
};

semver.STRICT = 'strict';
semver.NORMAL = 'normal';

/**
  Returns the comparison mode.  Will be one of NORMAL or STRICT
*/
semver.mode = function(vers) {
  var ret = vparse(vers)[4];
  return ret === '=' ? semver.STRICT : semver.NORMAL;
};
var mode = semver.mode;

/**
  Compares two patch strings using the proper matching formula defined by
  semver.org
*/
semver.comparePatch = function(patch1, patch2) {
  var num1, num2;
      
  if (patch1 === patch2) return 0; // equal
  
  num1   = Number(patch1);
  num2   = Number(patch2);
      
  if (isNaN(num1)) {
    if (isNaN(num2)) {
      // do lexigraphic comparison
      return natcompare(patch1, patch2);
      
    } else return -1; // num2 is a number therefore beats num1
    
  // num1 is a number but num2 is not so num1 beats.  otherwise just compare
  } else if (isNaN(num2)) {
    return 1 ;
  } else {
    return num1<num2 ? -1 : (num1>num2 ? 1 : 0) ;
  }
};

function invalidVers(vers) {
  return '' + vers + ' is an invalid version string';
}

function compareNum(vers1, vers2, num1, num2) {
  num1 = Number(num1);
  num2 = Number(num2);
  if (isNaN(num1)) throw invalidVers(vers1);
  if (isNaN(num2)) throw invalidVers(vers2);
  return num1 - num2 ;
}

/**
  Compares two version strings, using natural sorting for the patch.
*/
semver.compare = function(vers1, vers2) {
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
};

/**
  Returns true if the second version string represents a version compatible 
  with the first version.  In general this means the second version must be
  greater than or equal to the first version but its major version must not 
  be different.
*/
semver.compatible = function(reqVers, curVers) {
  if (!reqVers) return true; // always compatible with no version
  if (reqVers === curVers) return true; // fast path

  // strict mode, must be an exact (semantic) match
  if (mode(reqVers) === semver.STRICT) {
    return curVers && (semver.compare(reqVers, curVers)===0);

  } else {
    if (!curVers) return true; // if no vers, always assume compat
    if (major(reqVers) !== major(curVers)) return false; // major vers
    return semver.compare(reqVers, curVers) <= 0;
  }
};

/**
  Normalizes version numbers so that semantically equivalent will be treated 
  the same.
*/
semver.normalize = function(vers) {
  var patch;
  
  vers = semver.parse(vers);
  
  patch = Number(vers[3]);
  if (isNaN(patch)) patch = vers[3];
  
  return [Number(vers[1]), Number(vers[2]), patch].join('.');
};

exports.semver = semver;


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

var Factory = function(moduleId, pkg, factory) {
  this.id  = moduleId;
  this.pkg = pkg;
  this.factory = factory;
};
exports.Factory = Factory;


var _createRequire = function(sandbox, module) {
  
  var curId  = module.id,
      curPkg = module.pkg;
      
  // basic synchronous require
  var req = function(moduleId, packageId) {
    if (packageId && moduleId.indexOf(':')<0) {
      moduleId = packageId+':'+moduleId;
    }
    
    return exports.wait(function(done) {
      sandbox.require(moduleId, curId, curPkg, done);
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
      sandbox[method](moduleId, curId, curPkg, done);

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
var Module = function(id, ownerPackage) {
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
exports.Module = Module;

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
     
var Package = function(id, config) {
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
Package.prototype.packageFor = function(canonicalId, done) {
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
  return done(null, !!this.factories[moduleId]);
};

/**
  Invokes callback with a Factory object for the passed moduleId or null if
  no matching factory could be found.
*/
Package.prototype.load = function(moduleId, done) {
  return done(null, this.factories[moduleId]);
};

exports.Package = Package;

// ..........................................................
// LOADER
// 

/**
  A loader is responsible for finding and loading factory functions.  The 
  primary purpose of the loader is to find packages and modules in those 
  packages.  The loader typically relies on one or more sources to actually
  find a particular package.
*/
var Loader = function(sources) {
  this.sources = sources;
  this.clear();
};

/**
  Clear caches in the loader causing future requests to go back to the 
  sources.
*/
Loader.prototype.clear = function() {
  this.factories = {};
  this._canonicalIds = {};
  this._packagesByCanonicalPackageId ={};
  this._sourcesByCanonicalPackageId = {};
  this._canonicalPackageIdCache = {};
};

/**
  The default package.  This can be replaced but normally it is empty, meaning
  it will never match a module.
  
  @property {Package}
*/
Loader.prototype.defaultPackage = new Package('default');

/**
  The anonymous package.  This can be used when loading files outside of a 
  package.
  
  @property {Package}
*/
Loader.prototype.anonymousPackage = new Package('(anonymous)');

/**
  @private
  
  Discovers the canonical packageId for the named packageId, version and 
  working package.  This will also store in cache the source where you can
  locare and load the associated package, if needed.
  
  This primitive is used by all other package methods to resolve a package
  into a canonicalId that can be used to reference a specific package instance
  
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
  
  // fast path
  if (packageId instanceof Package) return done(null, packageId.id);
  if (packageId.indexOf('::')===0) return done(null, packageId); // done...
  
  var mustBeCompatible = false, // force exact version match
      sources          = this.sources,
      cache            = this._canonicalPackageIdCache,
      scache           = this._sourcesByCanonicalPackageId,
      vcache, cacheId;
  
  // if passed version was null, it means we want to get the latest compatible
  // package.  Ask the workingPackage to provide a required version first
  if (!vers && workingPackage) {
    vers = workingPackage.requiredVersion(packageId);
    if (vers) mustBeCompatible = true;
  }

  // get the cache for workingPackage
  cacheId = workingPackage ? workingPackage.id : '(null)';
  if (!cache) cache = this._canonicalPackageIdCache = {};
  if (!cache[cacheId]) cache[cacheId] = {};
  cache = cache[cacheId];
  
  // now see if we already have something in cache
  vcache = cache[packageId];
  if (vcache) {
    if (vcache[vers]) return vcache[vers].id;
  } else vcache = cache[packageId] = {};
  
  // nope - have to go find it
  if (!scache) scache = this._sourcesByCanonicalPackageId = {};
  
  // first, ask the workingPackage to find any matching package (since it can
  // only have one version).  Then check the returned version against the
  // expected version.  Note that if the expected version came from the 
  // list of dependencies then it MUST be an exact match or we throw an error
  (function(next) {
    if (!workingPackage) return next(); // skip

    workingPackage.canonicalPackageId(packageId, vers, function(err, id) {
      if (err) return done(err);
      if (id) {
        vcache[vers] = id;
        scache[id] = workingPackage;
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

    // next, if not found in the workingPackage, then ask each of our sources 
    // in turn until a match is found.  When found, return
    (function(next) {
      if (!sources) return next(); // skip if no sources

      var ret = null;
      cofind(sources, function(source, done) {
        source.canonicalPackageId(packageId, vers, function(err, id) {
          if (err) return done(err);
          if (id) {
            vcache[vers] = id;
            scache[id] = source;
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
      return done();
    });
  });
    
};

/**
  Looks up the source for the named canonicalId in the cache.  Returns null
  if no match is found.
*/
Loader.prototype._sourceForCanonicalPackageId = function(canonicalId) {
  var scache = this._sourcesByCanonicalPackageId;
  return scache ? scache[canonicalId] : null;
};

/**
  Primitive actually loads a package from a canonicalId.  Throws an exception
  if source for package is not already in cache.  Also caches loaded package.
*/
Loader.prototype._packageFor = function(canonicalId, done) {
  var err, ret, cache, source;

  // try to resolve out of cache
  cache = this._packagesByCanonicalPackageId;
  if (!cache) cache = this._packagesByCanonicalPackageId = {};
  if (ret = cache[canonicalId]) return done(null, ret);
  
  // no - get source and ask it to load it
  source = this._sourceForCanonicalPackageId(canonicalId);
  if (!source) {
    err = new Error("Canonical packageId "+canonicalId+" not yet resolved");
    return done(err);
  }
  
  source.packageFor(canonicalId, function(err, pkg) {
    if (err) return done(err);
    cache[canonicalId] = pkg;
    return done(null, pkg);
  });
  
};

/**
  Primitive simply checks to see if the named canonicalId is ready or not
*/
Loader.prototype._packageReady = function(canonicalId) {
  var cache, source;

  // try to resolve out of cache
  cache = this._packagesByCanonicalPackageId;
  if (cache && cache[canonicalId]) return true;
  
  // no - get source and ask it to load it
  source = this._sourceForCanonicalPackageId(canonicalId);
  if (!source) return false;
  
  return source.packageReady(canonicalId);
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
Loader.prototype.resolve = function(moduleId, packageId, id, pkg){
  var path, len, idx, part, parts;

  if (packageId && (moduleId.indexOf(':')<0)) {
    moduleId = packageId+':'+moduleId;
    packageId = null;
  }
  packageId = pkg ? pkg.get('name') : null;
  
  // if id does not contain a packageId and it starts with a / then 
  // return path so we can make it a default module
  if (moduleId[0]==='/' && moduleId.indexOf(':')<0) return moduleId;

  // must have some relative path components
  if (moduleId.match(/(^\.\.?\/)|(\/\.\.?\/)|(\/\.\.?\/?$)/)) {

    // if we have a packageId embedded, get that first
    if ((idx=moduleId.indexOf(':'))>=0) {
      packageId = moduleId.slice(0,idx);
      moduleId  = moduleId.slice(idx+1);
      path      = []; // path must always be absolute.

    // if no package ID, then use baseId if first component is . or ..
    } else if (moduleId.match(/^\.\.?\//)) {
      if (!id) {
        throw("id required to resolve relative: " + moduleId);
      }

      if((idx = id.indexOf(':'))>=0) {
        if (!packageId) packageId = id.slice(0,idx);
        id = id.slice(idx+1);
      }
      
      path = id.split('/');
      path.pop(); 

    } else path = [];

    // iterate through path components and update path
    parts = moduleId.split('/');
    len   = parts.length;
    for(idx=0;idx<len;idx++) {
      part = parts[idx];
      if (part === '..') {
        if (path.length<1) throw "invalid path: " + moduleId;
        path.pop();

      } else if (part !== '.') path.push(part);
    }

    moduleId = path.join('/');
    if (packageId) moduleId = joinPackageId(packageId, moduleId);

  }

  return moduleId ;
};

/**




*/
Loader.prototype.canonical = function(moduleId, curModuleId, workingPackage, done) {
  
  var loader = this,
      packageId, cache, cacheId, defaultPackage, cont, idx;
  
  if (moduleId.indexOf('::')===0) return moduleId; // already canonical
  
  // NORMALIZE PARAMS
  // normalize params - curModuleId can be omitted (though relative ids won't)
  // work
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }
  
  // workingPackage can be omitted also
  if (!done && (T_FUNCTION === typeof workingPackage)) {
    done = workingPackage;
    workingPackage = null;
  }
  
  // if no workingPackage, assume anonymous
  if (!workingPackage) workingPackage = this.anonymousPackage;
  

  // Resolve moduleId
  moduleId = loader.resolve(moduleId, curModuleId, workingPackage);
  
  // then lookup in cache
  cacheId = workingPackage ? workingPackage.id : '(null)';
  cache = this._canonicalIds;
  if (!cache) cache = this._canonicalIds = {};
  if (!cache[cacheId]) cache[cacheId] = {};
  cache = cache[cacheId];
  if (cache[moduleId]) return done(null, cache[moduleId]);
  cacheId = moduleId; // save for later


  // Not Found in Cache.  Do a lookup
  idx = moduleId.indexOf(':');
  if (idx>=0) {
    packageId = moduleId.slice(0,idx);
    moduleId  = moduleId.slice(idx+1);
  }

  // should be invoked when a match is found
  cont = function(canonicalId, moduleId) {
    canonicalId = canonicalId+':'+moduleId;
    cache[cacheId] = canonicalId;
    return done(null, canonicalId);
  };
  defaultPackage = this.defaultPackage;
  
  // If no packageId is provided, then assume workingPackage or 
  // defaultPackage
  if (!packageId || (packageId.length===0)) {

    // first look in workingPackage for match...
    (function(next) {
      if (!workingPackage) next(); //skip
      workingPackage.exists(moduleId, function(err, exists) {
        if (err) return done(err);
        
        // if does not exist but we don't have a defaultPackage anyway, 
        // then just go ahead and assume a working package
        if (exists || !defaultPackage) {
          return cont('::'+workingPackage.id, moduleId);
        }
        else next(); // does not exist, go one..
      });
      
    // not in working package, assume default package
    })(function() {
      
      // this case only happens if you don't have a workingPackage OR 
      // a default package
      if (!defaultPackage) return done(); // not found
      
      // not in workingPackage, just assume defaultPackage
      return cont('::'+defaultPackage.id, moduleId);
    });
    
  // if a packageId is provided, then find the matching packageId.
  } else {
    loader._canonicalPackageId(packageId, null, workingPackage, function(err, canonicalId) {
      if (err) return done(err);
      if (!canonicalId) return done(); // not found!
      else return cont(canonicalId, moduleId);
    });
  }
};

/**

  TODO
  
*/
Loader.prototype.load = function(moduleId, curModuleId, workingPackage, done){

  // normalize params - curModuleId can be omitted (though relative ids won't)
  // work
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }
  
  // workingPackage can be omitted also
  if (!done && (T_FUNCTION === typeof workingPackage)) {
    done = workingPackage;
    workingPackage = null;
  }
  
  var cache = this.factories;
  if (!cache) cache = this.factories = {};
  
  this.canonical(moduleId, curModuleId, workingPackage, function(err, id) {
    if (!err && !id) {
      err = new Error(moduleId+' not found');
    }
    if (err) return done(err);
    
    if (cache[id]) return done(null, cache[id]);
    
    var idx       = id.indexOf(':',3),
        packageId = id.slice(2,idx); // strip '::' also
    moduleId  = id.slice(idx+1);
        
    this._packageFor(packageId, function(err, pkg) {
      if (!err && !pkg) {
        err = new Error(id+' package not found');
      }
      if (err) return done(err);
      pkg.load(moduleId, function(err, factory) {
        if (err) return done(err);
        cache[id] = factory;
        return done(null, factory);
      });
    });
  });
  
};

/**
  Primitive method to discover a package based on some input settings.  You
  must always provide at least a packageId and a workingPackage to work from.
  
  You may also optionally specify a packageId version which will be used to 
  find the package.  If you do not name the version then we will look up the
  compatible version named in the workingPackage and use that (or latest if
  not named)

  ## Examples
  
  Find a compatible package named 'foo' in the current owner module:
  
      loader.packageFor('foo', ownerPackage, function(err, pkg) {
        // process response
      });
      
  Find the package named 'foo', exactly version '1.0.0'.  This may return a
  packes nested in the ownerPackage:
  
      loader.packageFor('foo', '=1.0.0', ownerPackage, function(err, pkg) {
        // process response
      });
  
  Find the latest version of 'foo' installed in the system - not specific to 
  any particular package
  
      loader.packageFor('foo', loader.anonymousPackage, function(err, pkg) {
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
    
  @param {Function} done 
    Callback.  Invoked with an error and the loaded package.  If no matching
    package can be found, invoked with null for the package.
    
  @returns {void}
*/
Loader.prototype.packageFor = function(packageId, vers, workingPackage, done){
  
  // fast path in case you pass in a package already
  if (packageId instanceof Package) return done(null, packageId);
  
  // normalize the params.  vers may be omitted
  if (vers && (T_STRING !== typeof vers)) {
    done = workingPackage;
    workingPackage = vers;
    vers = null;
  }
  
  // fast path if a canonicalId is passed in
  if (packageId.indexOf('::')===0) return this._packageFor(packageId, done);
  
  var loader;
  this._canonicalPackageId(packageId, vers, workingPackage, function(err, canonicalId) {
    if (err) return done(err);
    loader._packageFor(canonicalId, done);
  });
};

/**
  Verifies that the named package info is ready.
*/
Loader.prototype.packageReady = function(packageId,vers,workingPackage,done){
  
  // fast path in case you pass in a package already
  if (packageId instanceof Package) return done(null, true);
  
  // normalize the params.  vers may be omitted
  if (vers && (T_STRING !== typeof vers)) {
    done = workingPackage;
    workingPackage = vers;
    vers = null;
  }
  
  // fast path if a canonicalId is passed in
  if (packageId.indexOf('::')===0) return this._packageReady(packageId, done);
  
  var loader;
  this._canonicalPackageId(packageId, vers, workingPackage, function(err, canonicalId) {
    if (err) return done(err);
    return done(null, loader._packageReady(canonicalId));
  });
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
var Sandbox = function(loader) {
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
Sandbox.prototype.module = function(moduleId, curModuleId, workingPackage, done) {

  // curModuleId is optional
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }

  var sandbox = this,
      cache   = this.modules,
      packageId, idx, ret;
      
  if (!cache) cache = this.modules = {};

  sandbox.loader.canonical(moduleId, curModuleId, workingPackage, function(err, canonicalId) {
  
    if (!err && !canonicalId) {
      err = new Error(moduleId+' not found in '+workingPackage.get('name'));
    }
    if (err) return done(err);
    
    ret = cache[canonicalId];
    if (ret) return done(null, ret);

    // not in cache, generate new module object
    idx = canonicalId.indexOf(':', 3); // skip '::'
    moduleId = canonicalId.slice(idx+1);
    packageId = canonicalId.slice(0, idx);
    sandbox.loader.packageFor(packageId, workingPackage, function(err,pkg) {
      if (!err && !pkg) {
        err = new Error('package '+packageId+' not found');
      }
      if (err) return done(err);
      ret = new sandbox.Module(moduleId, pkg);
      return done(null, ret);
    });
    
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
Sandbox.prototype.require = function(moduleId, curModuleId, workingPackage, done) {

  // curModuleId is optional
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }

  var sandbox = this,
      loader  = sandbox.loader,
      cache   = this.exports,
      used    = this.usedExports,
      ret;
      
  if (!cache) cache = this.exports = {};
  if (!used)  used  = this.usedExports = {};

  sandbox.loader.canonical(moduleId, curModuleId, workingPackage, function(err, canonicalId) {
  
    if (!err && !canonicalId) {
      err = new Error(moduleId+' not found in '+workingPackage.get('name'));
    }
    if (err) return done(err);
    
    // return out of cache...
    ret = cache[canonicalId];
    if (ret) {
      if (!used[canonicalId]) used[canonicalId] = ret;
      return done(null, ret);
    }

    // not in cache, load the module, factory and build exports
    loader.load(canonicalId, null, workingPackage, function(err, factory) {
      if (!err && !factory) {
        err = new Error("Could not load factory for "+canonicalId);
      }
      if (err) return done(err);
      
      sandbox.module(canonicalId, null, workingPackage, function(err, mod) {
        if (err) return done(err);
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
Sandbox.prototype.ready = function(moduleId, curModuleId, workingPackage, done) {

  // curModuleId is optional
  if (curModuleId && (T_STRING !== typeof curModuleId)) {
    done = workingPackage;
    workingPackage = curModuleId;
    curModuleId = null;
  }

  var sandbox = this,
      loader  = sandbox.loader,
      cache   = this.exports,
      ret;
      
  if (!cache) cache = this.exports = {};

  sandbox.loader.canonical(moduleId, curModuleId, workingPackage, function(err, canonicalId) {
    
    if (err) return done(err);
    if (!canonicalId) return done(null, false);
    
    // if the module is already in cache, we're definitely ready
    if (cache[canonicalId]) return done(null, true);
    
    // ok - get the canonicalPackageId and ask if its ready
    var idx = canonicalId.indexOf(':', 3),
        packageId = canonicalId.slice(0,idx);

    sandbox.loader.packageReady(packageId, null, workingPackage, done);
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

exports.Sandbox = Sandbox;
