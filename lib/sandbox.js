// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

"use exports Sandbox";

var core = require('./core'),
    FUNCTION = typeof('function');
    
var Sandbox = function(loader) {
  this.loader = loader;
  this.clear();
};

var _sandboxRequire = function(sandbox, id, factory, mod, done) {
  // save in cache in case of cyclical refs
  sandbox.exportsCache[id] = mod.exports; 

  mod.exports = factory.call(sandbox, mod);
  sandbox.exportsCache[id] = mod.exports; 

  // detect cyclical refs
  var used = sandbox.usedModules[id];
  if (used && (used !== mod.exports)) {
    var err = new Error("Circular require in "+id);
    if (done) return done(err);
    else throw err;
  }
  
  // done - return exports
  if (done) return done(null, mod.exports);
  else return mod.exports;
};

var _exportsCache = function(sandbox, id) {
  var ret = sandbox.exportsCache[id];
  if (ret) {
    if (!sandbox.usedModules[id]) sandbox.usedModules[id] = ret;
    return ret;
  }
};

/**
  Obtains a return module the invokes the factory if exports are not yet 
  generated.
*/
Sandbox.prototype.require = function(moduleId, packageId, vers, module, done){

  // normalize params
  if (FUNCTION === typeof packageId) {
    done = packageId;
    packageId = vers = module = null;
  } else if (FUNCTION === typeof vers) {
    done = vers;
    vers = module = null;
  } else if (FUNCTION === typeof module) {
    done = module;
    module = null;
  }

  // sync version
  var sandbox = this,
      id, ret, factory;
      
  if (!done) {
    id = this.loader.canonical(moduleId, packageId, vers, module);

    // get out of cache
    ret = _exportsCache(sandbox, id);
    if (ret) return ret;

    // get factory + module
    factory = sandbox.loader.load(id);
    return _sandboxRequire(sandbox, id, factory, sandbox.module(id));
  }
  
  // async version
  this.loader.canonical(moduleId, packageId, vers, module, function(err,id){
    if (err) return done(err);
    
    // return out of cache
    var ret = _exportsCache(sandbox, id);
    if (ret) return done(null, ret);

    // load factory first - this will also get any dependencies
    sandbox.loader.load(id, function(err, factory) {
      if (err) return done(err);

      // get a module object from the sandbox - generates exports obj
      sandbox.module(id, function(err, mod) {
        if (err) return done(err);
        _sandboxRequire(sandbox, id, factory, mod, done);
      });
    });
  });
};

var _addModule = function(sandbox, id, moduleId, pkg) {
  var ret = {
    id: '', // moduleId
    pkg: '', // package
    exports: {}
  };
  
  ret.resource = function(resourceId, done) {
    return pkg.resourceFor(resourceId, moduleId, done);
  };

  sandbox.modulesCache[id] = ret;
  return ret;  
};

var _module = function(sandbox, id, done) {
  var ret = sandbox.modulesCache[id];
  if (ret) {
    if (done) return done(null, ret);
    else return ret;
  }
  
  // sync version
  if (!done) {
    var pkg = sandbox.loader.packageFor(id);
    ret = _addModule(sandbox, id, sandbox.loader.moduleIdFor(id), pkg);
    return ret ;
  }
  
  // async version
  sandbox.loader.packageFor(id, function(err, pkg) {
    if (err) return done(err);
    ret = _addModule(sandbox, id, sandbox.loader.moduleIdFor(id), pkg);
    return done(null, ret);
  });
};

Sandbox.prototype.module = function(moduleId, packageId, vers, module, done){
  
  // normalize params
  if (FUNCTION === typeof packageId) {
    done = packageId;
    packageId = vers = module = null;
  } else if (FUNCTION === typeof vers) {
    done = vers;
    vers = module = null;
  } else if (FUNCTION === typeof module) {
    done = module;
    module = null;
  }

  // sync version
  var sandbox = this,
      id, ret;
      
  if (!done) {
    id = this.loader.canonical(moduleId, packageId, vers, module);
    return _module(sandbox, id);
  }
  
  // async version
  this.loader.canonical(moduleId, packageId, vers, module, function(err,id){
    if (err) return done(err);
    return _module(sandbox, id, done);
  });
  
};

/**
  Returns true if the given module is ready. This checks the local cache 
  first then hands this off to the loader.
*/
Sandbox.prototype.ready = function(moduleId, packageId, vers, module, done) {

  // normalize params
  if (FUNCTION === typeof packageId) {
    done = packageId;
    packageId = vers = module = null;
  } else if (FUNCTION === typeof vers) {
    done = vers;
    vers = module = null;
  } else if (FUNCTION === typeof module) {
    done = module;
    module = null;
  }

  // sync version
  var sandbox = this, id;
  if (!done) {
    id = this.loader.canonical(moduleId, packageId, vers, module);
    if (sandbox.exportsCache[id]) return true;
    else return sandbox.loader.ready(id);
  }
  
  // async version
  this.loader.canonical(moduleId, packageId, vers, module, function(err,id){
    if (err) return done(err);
    if (sandbox.exportsCache[id]) return done(null, true);
    else return sandbox.loader.ready(id, done);
  });
  
};

/**
  Clears the sandbox.  requiring modules will cause them to be reinstantied
*/
Sandbox.prototype.clear = function() {
  this.exportsCache = {};
  this.modulesCache = {};
  this.usedExports = {};
  return this;
};

exports.Sandbox = Sandbox;
exports.createSandbox = function(loader) {
  return new Sandbox(loader);
};
