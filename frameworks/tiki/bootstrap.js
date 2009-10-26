// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals tiki */

"resource bootstrap";
"use modules false";
"use loader false";

/**
  Implements a very simple handler for the loader registration API so that 
  additional scripts can load without throwing exceptions.  Once the actual
  tiki package loads, the real loader will replace this stub and then replays
  the registration history on itself.
*/
if ("undefined" === typeof tiki) { var tiki = function() {
  
  var queue = [];
  var factories = {} ; // temporary store of modules
  var modules = {};
  
  var MODULE_WRAPPER = [
    '(function(require, exports, module) {',
    null,
    '\n});\n//@ sourceURL=',
    null,
    ':',
    null,
    '\n'];
  
  function _record(method, args) {
    queue.push({ m: method, a: args });
  }
  
  var tiki = {
    
    // used to detect when real loader should replace this one
    isBootstrap: true,
    
    // log of actions to be replayed later
    queue: queue, 
    
    // helpers just record into queue
    register: function() { 
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
    module: function(packageId, moduleId, factory) {
      var p = factories[packageId];
      if (!p) p = factories[packageId] = {};
      p[moduleId] = factory;
      
      _record('module', arguments);
      return this ;
    },

    /**
      Takes module text, wraps it in a factory function and evaluates it to 
      return a module factory.  This method does not cache the results so call
      it sparingly.  
    */
    evaluate: function(moduleText, moduleId, packageId) {
      var ret;
      
      MODULE_WRAPPER[1] = moduleText;
      MODULE_WRAPPER[3] = packageId || '(unknown package)';
      MODULE_WRAPPER[5] = moduleId || '(unknown module)';
      
      ret = MODULE_WRAPPER.join('');
      ret = eval(ret);
       
      MODULE_WRAPPER[1] = MODULE_WRAPPER[3] = MODULE_WRAPPER[5] = null;
      
      ret.displayName = (packageId + ':' + moduleId);
      return ret;
    },
    
    // require just instantiates the module if needed.  This allows registered
    // modules to be used during bootstrap
    require: function(moduleId, packageId) {
      var ret, m, info, factory ;
      
      m = modules[packageId];
      if (!m) m = modules[packageId] = {};
      ret = m[moduleId];
      
      if (!ret) {
        ret = m[moduleId] = {} ;
        info = { id: moduleId };
        
        // convert string into function as needed.
        factory = factories[packageId][moduleId];
        if ('string' === typeof factory) {
          factory = tiki.evaluate(factory, moduleId, packageId);
          factories[packageId][moduleId] = factory;
        }
        
        factory.call(ret, tiki.require, ret, info);
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
  
  return tiki;
  
}(); };

