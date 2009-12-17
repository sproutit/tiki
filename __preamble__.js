// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals tiki ENV ARGV */
 
"use modules false";
"use loader false";

/**
  Implements a very simple handler for the loader registration API so that
  additional scripts can load without throwing exceptions.  This loader can
  also return module instances for modules registered with an actual factory
  function.
  
  Note that this stub loader cannot be used on its own.  You must load the 
  regular tiki package as well, which will replace this loader as soon as it
  is fetched.
*/
if ("undefined" === typeof tiki) { var tiki = function() {
  
  var UNDEFINED = 'undefined',
      queue = [],
      factories = {}, // temporary store of modules
      modules = {};
  
  // save a registration method in a queue to be replayed later once the 
  // real loader is available.
  function _record(method, args) {
    queue.push({ m: method, a: args });
  }
  
  var tiki = {
    
    _modules: modules,
    _factories: factories,
    
    // used to detect when real loader should replace this one
    isBootstrap: true,
    
    // log of actions to be replayed later
    queue: queue, 
    
    // helpers just record into queue
    register: function(packageId, opts) { 
      
      // this hack will make unit tests work for tiki by adding core_test to
      // the list of dependencies.
      if ((packageId === 'tiki') && (UNDEFINED !== typeof ENV)) {
        if ((ENV.app === 'tiki') && (ENV.mode === 'test')) {
          if (!opts.depends) opts.depends = [];
          opts.depends.push('core_test');
        }
      }
      
      _record('register', arguments);
       return this;  
    },
    
    script:   function() { 
      _record('script', arguments); 
      return this; 
    },
    
    stylesheet: function() { 
      _record('stylesheet', arguments); 
      return this; 
    },

    // modules actually get saved as well a recorded so you can use them.
    module: function(moduleId, factory) {
      factories[moduleId] = factory;
      _record('module', arguments);
      return this ;
    },

    // require just instantiates the module if needed.  This allows registered
    // modules to be used during bootstrap.  Note that you can only 
    // instantiate modules that register with a real factory function.  
    //
    // use the directive "use factory_format function" in your file to turn 
    // this on.
    //
    require: function(moduleId) {
      var ret, factory, info, idx, packagePart, modulePart ;

      ret = modules[moduleId];
      
      if (!ret) {
        ret = modules[moduleId] = {} ;
        info = { id: moduleId, exports: ret };
        factory = factories[moduleId];
        if (typeof factory !== 'function') throw(moduleId+" is not function");
        factory.call(ret, tiki.require, ret, info);
        if (info.exports !== ret) ret = modules[moduleId] = info.exports;
      }
       
      return ret ;
    },
    
    // cleanup the bootstrap loader when finished
    destroy: function() {
      if (this.isDestroyed) return this;  // nothing to do
      this.isDestroyed = true;
      modules = factories = queue = this.queue = null ;
      return this ;
    }
    
  };
  
  tiki.require.loader = tiki;
  tiki.ENV = (typeof ENV !== UNDEFINED) ? ENV : undefined;
  tiki.ARGV = (typeof ARGV !== UNDEFINED) ? ARGV : undefined;
  
  return tiki;
  
}(); };

