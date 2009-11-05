// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Sandbox create */

"export package Sandbox";
"export create";

"use factory_format function";

/**
  @file
  
  A Sandbox provides a common space to activate secure modules.  You will 
  often have only one sandbox within an application, though you could create
  as many as you like.  This might be useful, for example, to control access
  for plugins.

  To create a new Sandbox, you must pass in a Loader instance as well.  Most 
  of the time you can obtain a loader from the require.loader property.
  
  A new sandbox will inherit whatever modules are registered on the loader.
  Modules will actually be reinstantiated however, when you require each of 
  them.

  @since Tiki 1.0
*/


/**
  @class 

  A sandbox defines a common space where modules can be instantiated and 
  imported.  Each loader comes with a default sandbox where modules are 
  run though you can create additional sandboxes also if you wish.  

  Eventually this will form the basis of a secure system for giving 
  plugins limited access to your application code.

  To create a new sandbox just call the sandbox() method on a loader.  
  This will create a sandbox attached to the named loader.  Once you have 
  created a sandbox, you start running code by calling require().

*/
Sandbox = function Sandbox(id, loader, env) {

  var allExports = {}, // instantiated modules
      modules  = [], // names of instantiated modules
      HASH     = {},
      sandbox  = this;

  this.id = id ;
  this.modules = modules;
  this.loader = loader ; // expose loader

  // private clear method
  function _clear() {
    
    // if one or more module ids are passed, remove them
    var loc = arguments.length, moduleId;
    if (loc>0) {
      while(--loc>0) {
        moduleId = arguments[loc];
        if (moduleId && allExports[moduleId]) {
          delete allExports[moduleId];
          modules.splice(modules.indexOf(moduleId), 1);
        }
      }

    // no arguments passed, clear ALL exports.
    } else {
      allExports = {} ;
      modules.length = 0 ;
    }
  }
  _clear.displayName = 'Sandbox.clear';
  
  // this is the core require method.  requires that you pass either a 
  // bundleId
  function _require(moduleId, curModuleId) {
    var req, exports, moduleInfo, factory;

    // convert to canonical moduleId reference.
    moduleId = loader.canonical(moduleId, curModuleId);

    // see if its already initialized. return if so
    if (exp = allExports[moduleId]) return exp;
    
    // not defined...create it
    modules.push(moduleId);

    // not initialized, init module 
    allExports[moduleId] = exports = {};
    
    // generate custom require with safe info exposed
    req = function(m) { return _require(m, moduleId); };
    req.displayName = 'Sandbox.require';
    
    req.loader  = loader ;
    req.clear   = _clear;
    req.env     = env || {};
    req.sandbox = this;
    
    // setup module info describing module state
    moduleInfo = { id: moduleId };

    // run module factory in loader
    var func = loader.load(moduleId);
    if (!func) throw "could not load function for " + moduleId;
    func.call(exports, req, exports, moduleInfo);

    return exports;
  }

  // require a module...
  this.require = function(moduleId) { return _require(moduleId); };
  this.require.displayName = 'Sandbox.require';

};

// safe methods
Sandbox.prototype = {};

create = function create(id, loader, env) {
  return new Sandbox(id, loader, env);
};

