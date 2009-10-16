// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Loader sandbox promise setup create */

"import system/promise as promise";
"import system/sandbox as sandbox";
"export package Loader";
"export create setup";

/**
  @file
  
  The Loader module implement a package-based module loader that can fetch 
  packages from any server provided that you register the module first.

  When you load tiki, a global loader is automatically created that will 
  instantiate from this module.
*/

// types of promises
var SCRIPTS     = 'scripts', 
    CATALOG     = 'catalog', 
    MODULES     = 'modules',
    STYLESHEETS = 'stylesheets', 
    LOADS       = 'loads';

/**
  @class
  
  The Loader class instantiated whenever you create a new loader.

  You can optionally pass a pending queue of actions which will be replayed 
  on the loader immediate.
*/
Loader = function(id, queue) {
  this.id = id ;
  this.scripts = [];
  this.packages = []; 
  this.stylesheets = [];
  this.modules = {} ;
  this.sandbox = sandbox.create(id, this);
  this.register('default', {}); // always have a default package
  this.register('tiki', {}); // always local also
  
  // replay queue if provided
  var len = queue ? queue.length : 0, idx, action;
  for(idx=0;idx<len;idx++) {
    action = queue[idx];
    this[action.m].apply(this, action.a);
  }
  
  this._queue = queue ;
  return this ;
};

Loader.prototype = {

  /**
    List of all loaded script urls.
    
    @property {Array}
  */
  scripts: null,
  
  /**
    List of all loaded stylesheet urls.
  
    @property {Array}
  */
  stylesheets: null,
  
  /**
    List of all registered package names.
    
    @property {Array}
  */
  packages: null,
  
  /**
    The default Sandbox for the loader.
    
    @property {Sandbox}
  */
  sandbox: null,
  
  /**
    Registered modules, organized by package name.
  */
  modules: null,
  
  // ..........................................................
  // PUBLIC METHODS
  // 
  
  /**
    Takes a module name as well as a current module name and returns an 
    absolute module identifier within the current package.  This is used when
    looking up module names inside of a package.
  */
  resolve: function(moduleId, curModuleId) {
    var path, len, idx, packageId, part;
    
    if (moduleId.indexOf('.') >= 0) {

      // if we have a packageId embedded, get that first
      if ((idx=moduleId.indexOf(':'))>=0) {
        packageId = moduleId.slice(0,idx);
        moduleId = moduleId.slice(idx+1);
      }
      
      path = curModuleId ? curModuleId.split('/') : [];
      moduleId = moduleId.split('/');
      len = moduleId.length;
      for(idx=0;idx<len;idx++) {
        part = moduleId[idx];
        if (part === '..') {
          if (path.length<1) throw "invalid path: " + moduleId.join('/');
          path.pop();
        
        } else if (part !== '.') path.push(part);
      }

      moduleId = path.join('/');
      if (packageId) moduleId = packageId + ':' + moduleId;
    }  
    return moduleId ;
  },
  
  /**
    Takes a packageId (may be null) and a moduleId.  If the moduleId contains
    a package name, it will replacing the calling packageId.  If you pass 
    only one param, we assume it is a moduleId.
    
    @param {String} packageId the package id
    @param {String} moduleId the module id
    @param {Hash} hash optional hash to use for return.  
    @returns {Hash} hash with packageId and moduleId params
  */
  canonical: function(packageId, moduleId, hash) {
    if (arguments.length === 1) {
      moduleId = packageId;
      packageId = null;
    }
    if (!hash) hash = {};

    var idx = moduleId.indexOf(':');
    if (idx>=0) {
      packageId = moduleId.slice(0, idx);
      moduleId  = moduleId.slice(idx+1);
    }
    
    hash.packageId = packageId;
    hash.moduleId  = moduleId;
    return hash;
  },
  
  /**
    Registers a package with the loader.  The package descriptor should
    include properties to describe scripts that should be loaded as well
    as dependencies.
    
    If you call this method more than once with the same package name,
    the new package descriptor will replace the old one, so beware!
    
    @param {String} name the package name
    @param {Hash} desc a package descriptor
    @returns {Loader} receiver
  */
  register: function(name, desc) {
    var catalog = this._catalog, key;
    if (!catalog) catalog = this._catalog = {};
    catalog[name] = desc;
    
    // if the descriptor names other packages, add them those packages
    // to the catalog if they are not already there so that we can load
    // them.  However, the packages should not actually be 'registered'
    // since they haven't really loaded yet.
    var info = desc ? desc.packages : null;
    if (info) {
      for(key in info) {
        if (!info.hasOwnProperty(key) || catalog[key]) continue;
        catalog[key] = info[key];
      }
    }

    // for the package being registered, also add the package to the list
    // of known packages and resolve a CATALOG promise for it.  This may
    // allow other packages to immediately load their contents as well.
    if (!this._resolved(CATALOG, name)) this.packages.push(name);
    this._promiseFor(CATALOG, name).resolve(name);        
  },
  
  /**
    Registers a script with the loader.  If this is the first time this
    has been called, resolves a promise and adds the URL to the scripts
    array.
    
    @param {String} url the script to load
    @returns {Loader} reciever
  */
  script: function(url) {
    if (!this._resolved(SCRIPTS, url)) this.scripts.push(url);
    this._promiseFor(SCRIPTS, url).resolve(url);        
    return this;
  },
  
  /**
    Registers that a given stylesheet has been loaded.  If this is the 
    first time this has been called, resolves a promise and adds the URL
    to the stylesheets array.
  */
  stylesheet: function(url) {
    if (!this._resolved(STYLESHEETS, url)) this.stylesheets.push(url);
    this._promiseFor(STYLESHEETS, url).resolve(url);        
    return this;
  },
  
  /**
    Registers a module with the loader. 
    
    @param {String} pkgName name of package the module belongs to
    @param {String} moduleName name of module itself
    @param {Function} factory factory function for module
    @returns {Loader} receiver
  */
  module: function(pkgName, moduleName, factory) {
    var factories = this._factories, sub;
    if (!factories) factories = this._factories = {};
    sub = factories[pkgName];
    if (!sub) sub = factories[pkgName] = {} ;
    sub[moduleName] = factory;
    
    if (!this._resolved(MODULES, pkgName, moduleName)) {
      var modules = this.modules[pkgName];
      if (!modules) modules = this.modules[pkgName] = [];
      modules.push(moduleName);
    }
    
    this._promiseFor(MODULES, pkgName, moduleName).resolve(moduleName);
  },

  /** @private
  
    Gets a promise to load a script.  If the promise is still pending,
    then setup an action on the promise to actually load the script. Once
    the script registers itself, this promise will resolve.
  */
  _loadScript: function(url) {
    var pr = this._promiseFor(SCRIPTS, url);
    if (pr.status === promise.PENDING) {
      var loader = this ;
      pr.action(function(pr) {
        var body = document.body, el;
        if (!body) promise.cancel('no document to append script');
        
        el = document.createElement('script');
        el.setAttribute('src', url);
        body.appendChild(el);
        
        body = el = null ;
      });
    }
    return pr;
  },

  /** @private
  
    Gets a promise to load a script.  If the promise is still pending,
    then setup an action on the promise to actually load the script. Once
    the script registers itself, this promise will resolve.
  */
  _loadStylesheet: function(url) {
    var pr = this._promiseFor(STYLESHEETS, url);
    if (pr.status === promise.PENDING) {
      var loader = this ;
      pr.action(function(pr) {
        var body = document.body, el;
        if (!body) pr.cancel('no document to append stylesheet');
        
        el = document.createElement('link');
        el.setAttribute('rel', 'stylesheet');
        el.setAttribute('href', url);
        body.appendChild(el);
        body = el = null ;
        
        loader.stylesheet(url); // register and resolve promise
      });
    }
    return pr;
  },
  
  /** @private
  
    Loads the package if it is found in the catalog.  If a promise is 
    passed, the promise will depend on any found items loading.  May do 
    nothing.
  */
  _loadPackage: function(pkgName, pr) {
    var info = this._catalog ? this._catalog[pkgName] : null,
        items, loc, item, ordered, next, prDepends;
        
    if (!info) return this; // nothing to do

    // PROCESS DEPENDENCES.  
    // Create a single promise to gate these dependencies.  Load each 
    // dependency then resolve the depend promise.  This will gate scripts
    // and stylesheets.
    items = info.depends;
    loc   = items ? items.length : 0;
    prDepends = promise.create();
    while(--loc>=0) prDepends.depends(this.load(items[loc]));
    pr.depends(prDepends); // wait till resolved..
    prDepends.resolve();
    
    // PROCESS SCRIPTS
    items = info.scripts;
    loc   = items ? items.length : 0;
    next  = null;
    ordered = info.ordered !== false;  // assume ordered
    
    while(--loc>=0) {
      item = this._loadScript(items[loc]); // get promise to load script
      pr.depends(item); // package promise must wait...

      // ordered scripts must load in series. make next wait on current
      if (ordered) {
        if (next) item.then(next, next.run, next.cancel);
        
      // unordered scripts can load right away
      } else item.run();

      next = item ;
    }
    
    // start first item when ordered as soon as dependencies resolve
    if (next && ordered) prDepends.then(next, next.run, next.cancel);
    
    
    // PROCESS STYLESHEETS
    // Stylesheets can only load once dependencies have loaded to ensure
    // CSS rules layer properly.  They must also run in order to ensure
    // the links are in the correct order.
    items = info.stylesheets;
    loc   = items ? items.length : 0;
    next  = null;
    while(--loc >= 0) {
      item = this._loadStylesheet(items[loc]);
      pr.depends(item);
      if (next) item.then(next, next.run, next.cancel);
      next = item;
    }
    if (next) prDepends.then(next, next.run, next.cancel);
    
    // all done...
  },
  
  /**
    Loads a package asynchronously.  Returns the package info or a promise
    to return the package info when completed.  Use the promise module to
    handle this promise.
  */
  load: function(pkgName, fromPackageName) {
    var ret = this._promiseFor(LOADS, pkgName);
    
    // if the promise is pending (meaning it hasn't been started yet),
    // then either resolve it now or setup an action to load.
    if (ret.status === promise.PENDING) {
      if (this.ready(pkgName)) {
        ret.resolve(); // already loaded - just resolve.

      // not fully loaded yet.  Setup the promise action and run it.
      } else {

        var loader = this ;
        
        // this is the actual load action.  Before we can really "load"
        // the package, the package needs to be registered in the catalog.
        // Hence for this action we actually just want to listen for the
        // catalog registration.  Once registered, then we load the 
        // scripts and stylesheets as needed.
        //
        // Also if some info was already found in the catalog, we'll get
        // scripts, stylesheets, and dependencies listed going there as 
        // well.  These are not going to be formal dependencies however,
        // until the actual package is registered.
        ret.action(function(pr) {
          
          // wait for package to be registered.  Once registered, load 
          // all of its contents and then resolve the load promise.
          loader._promiseFor(CATALOG, pkgName).then(pr, function() {
            loader._loadPackage(pkgName, pr);
            pr.resolve();
            
          // handle cancelling...
          }, function(reason) { pr.cancel(reason); });

          // in case there is info already in the catalog, get it going.
          // any of these items must load before the promise can resolve 
          // as well.
          loader._loadPackage(pkgName, pr);
          
        }).run();
      }
    }
    
    return ret;
  },

  /**
    Requires a module.  This will instantiate a module in the default 
    sandbox.
  */
  require: function(packageName, moduleName) {
    return this.sandbox.require(packageName, moduleName);
  },
  
  /**
    Return true if package or module is ready.
    
    @param {String} packageName package name
    @param {String} moduleName optional module name
    @returns {Boolean} true if ready
  */
  ready: function(packageName, moduleName) {
    if (!this._resolved(CATALOG, packageName)) return false;
    
    var info = this._catalog[packageName], items, loc;
    
    // check dependencies
    items = info.depends;
    loc = items ? items.length : 0;
    while (--loc>=0) {
      if (!this.ready(items[loc])) return false ;
    }
    
    // check stylesheets
    items = info.stylesheets ;
    loc = items ? items.length : 0;
    while (--loc >= 0) {
      if (!this._resolved(STYLESHEETS, items[loc])) return false ;
    }
    
    // check scripts
    items = info.scripts;
    loc = items ? items.length : 0;
    while(--loc >= 0) {
      if (!this._resolved(SCRIPTS, items[loc])) return false ;
    }
    
    // check module if provided...
    if (moduleName) {
      if (!this._resolved(MODULES, packageName, moduleName)) return false;
    }
    
    return true ;
  },
  
  /**
    Discover and run the factory function for the passed module.  Returns
    the result.
  */
  factory: function(packageName, moduleName, require, exports, info) {
    var factories = this._factories, factory;

    // default package is special.  if you don't define it there, then
    // look in the tiki package.
    if (packageName === 'default') {
      factory = factories['default'];
      if (factory) factory = factory[moduleName] ;
      if (!factory) packageName = 'tiki';
    }
    
    if (!factory) {
      if (!this.ready(packageName, moduleName)) {
        throw (packageName + ':' + moduleName + " is not ready");
      }
      
      factory = factories[packageName][moduleName];
    }

    return factory(require, exports, info);
  },
  
  // ..........................................................
  // PRIVATE METHODS
  // 
  
  // eventually will provide a promise for the specified type/name. used
  // for dependency tracking
  _promiseFor: function(promiseType, name1, name2) {
    
    var promises = this._promises, sub1, sub2, ret, Q; 
    if (!promises) promises = this._promises = {};
    
    sub1 = promises[promiseType];
    if (!sub1) sub1 = promises[promiseType] = {};

    if (name2 === undefined) {
      sub2 = sub1; 
      name2 = name1;
    } else {
      sub2 = sub1[name1];
      if (!sub2) sub2 = sub1[name1] = {} ;
    } 
    
    ret = sub2[name2];
    if (!ret) ret = sub2[name2] = promise.create(promiseType);
    return ret ;
  },

  _discoverdStylesheets: false,
  
  // discovers any stylesheets in the document body
  discoverStylesheets: function() {
    this._discoveredStylesheets = true;
    if ('undefined' === typeof document) return this; //nothing to do

    var links = document.getElementsByTagName('link'),
        loc = links ? links.length : 0,
        link;
    while(--loc>=0) {
      link = links[loc];
      if (!link || (link.rel !== 'stylesheet')) continue;
      link = link.getAttribute('href');
      if (link) this.stylesheet(link.toString());
    }
    
    link = link = loc = null;
    
    return this ;
  },
  
  // returns true if a promise already exists for the type/name.  
  _resolved: function(promiseType, name1, name2) {
    if ((promiseType === STYLESHEETS) && !this._discoveredStylesheets) {
      this.discoverStylesheets();
    }
    
    var ret = this._promises;
    if (ret) ret = ret[promiseType];
    if (ret) ret = ret[name1];
    if (ret && name2) ret = ret[name2];
    return ret ? (ret.status===promise.RESOLVED) : false ;
  },
  
  /** @private */
  _inspectLoader: function() {
    
    // assemble list of known modules
    var lines = [], 
        modules = this.modules,
        key, names, len, idx, emitted = false;
        
    lines.push("Loader<id=" + this.id + ">:");
    
    if (this.packages.length>0) {
      lines.push("  packages: " + this.packages.join(','));
      lines.push('');
    }

    if (this.scripts.length>0) {
      lines.push("  scripts:");
      len = this.scripts.length;
      for(idx=0;idx<len;idx++) lines.push("    " + this.scripts[idx]);
      lines.push('');
    }


    if (this.stylesheets.length>0) {
      lines.push("  stylesheets:");
      len = this.scripts.length;
      for(idx=0;idx<len;idx++) lines.push("    " + this.scripts[idx]);
      lines.push('');
    }
            
    for(key in modules) {
      if (!modules.hasOwnProperty(key)) continue ;

      names = modules[key];
      len   = names ? names.length : 0;
      if (len===0) continue;

      if (!emitted) {
        lines.push("  modules: ");
        emitted = true;
      }
      
      for(idx=0;idx<len;idx++) lines.push("   " + key + ':' + names[idx]);
      lines.push('');
    } 
    
    return lines.join("\n");
  },
  
  _inspectModule: function(packageName, moduleName) {
    var lines = [];
    lines.push(packageName + ':' + moduleName + " (" + (this.ready(packageName, moduleName) ? 'READY' : 'NOT READY') + "):");
    lines.push(this._inspectPackage(packageName));
    return lines.join("\n");
  },
  
  _inspectPackage: function(packageName) {

    // emit header...
    var lines = [],
        info  = this._catalog ? this._catalog[packageName] : null,
        idx, len, item, parts;
        
    lines.push(packageName + " (" + (this.ready(packageName) ? 'READY' : 'NOT READY') + "): " + (info ? '' : 'Not in Catalog!') );
    
    if (!info) return lines.join("\n");
    
    len = info.depends ? info.depends.length : 0;
    if (len > 0) {
      parts = [];
      for(idx=0;idx<len;idx++) {
        item = info.depends[idx];
        parts.push(item + ' (' + (this.ready(item) ? 'READY' : 'NOT READY') + ')');            
      }
      lines.push('  depends: ' + parts.join(', '));
    }
    
    len = info.scripts ? info.scripts.length : 0;
    if (len > 0) {
      lines.push("\n  scripts:");
      for(idx=0;idx<len;idx++) {
        item = info.scripts[idx];
        lines.push('    ' + item + ' (' + (this._resolved(SCRIPTS, item) ? 'READY' : 'NOT READY') + ')');
      }
    }

    len = info.stylesheets ? info.stylesheets.length : 0;
    if (len > 0) {
      lines.push("\n  stylesheets:");
      for(idx=0;idx<len;idx++) {
        item = info.stylesheets[idx];
        lines.push('    ' + item + '(' + (this._resolved(STYLESHEETS, item) ? 'READY' : 'NOT READY') + ')');
      }
    }
    
    return lines.join("\n");
  },

  /** @private */
  inspect: function(packageName, moduleName) {
    if (arguments.length === 0) return this._inspectLoader();
    else if (!moduleName) return this._inspectPackage(packageName);
    else return this._inspectModule(packageName, moduleName);
  },
  
  /** @private - toString for loader */
  toString: function() {
    return "Loader<id=" + this.id + ">";
  }
  
};

// setup the default loader if needed.  pass in the current loader
setup = function setup(curLoader) {
  if (curLoader && !curLoader.isBootstrap) return curLoader;
  
  var queue = curLoader ? curLoader.queue : null,
      id    = curLoader ? curLoader.id : 'default',
      ret   = new Loader(id, queue);
      
  // once we are done with the old loader; tear it down to release memory
  if (curLoader && curLoader.destroy) curLoader.destroy();
  return ret ;
};

create = function create(id) {
  return new Loader(id);
};

