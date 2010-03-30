/*! @license
==========================================================================
Tiki 1.0 - CommonJS Runtime
copyright 2009-2010, Apple Inc., Sprout Systems Inc., and contributors.

Permission is hereby granted, free of charge, to any person obtaining a 
copy of this software and associated documentation files (the "Software"), 
to deal in the Software without restriction, including without limitation 
the rights to use, copy, modify, merge, publish, distribute, sublicense, 
and/or sell copies of the Software, and to permit persons to whom the 
Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in 
all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR 
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, 
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE 
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING 
FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER 
DEALINGS IN THE SOFTWARE.

Tiki is part of the SproutCore project.

SproutCore and the SproutCore logo are trademarks of Sprout Systems, Inc.

For more information visit http://www.sproutcore.com/tiki

==========================================================================
@license */

/*globals tiki ENV ARGV ARGS */

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
  
  var T_UNDEFINED = 'undefined',
      queue = [];
        
  // save a registration method in a queue to be replayed later once the 
  // real loader is available.
  function _record(method, args) {
    queue.push({ m: method, a: args });
  }
  
  var tiki = {
    
    // used to detect when real loader should replace this one
    isBootstrap: true,
    
    // log of actions to be replayed later
    queue: queue, 
    
    // helpers just record into queue
    register: function(packageId, opts) { 
      
      // this hack will make unit tests work for tiki by adding core_test to
      // the list of dependencies.
      if (packageId.match(/^tiki/) && this.ENV) {
        if ((this.ENV.app === 'tiki') && (this.ENV.mode === 'test')) {
          if (!opts.dependencies) opts.dependencies = {};
          opts.dependencies['core_test'] = '~';
        }
      }
      
      _record('register', arguments);
       return this;  
    },
    
    // Keep these around just in case we need them in the end...
    // script:   function() { 
    //   _record('script', arguments); 
    //   return this; 
    // },
    // 
    // stylesheet: function() { 
    //   _record('stylesheet', arguments); 
    //   return this; 
    // },

    // modules actually get saved as well a recorded so you can use them.
    module: function(moduleId, factory) {
      if (moduleId.match(/\:tiki$/)) this.tikiFactory = factory;
      _record('module', arguments);
      return this ;
    },

    // load the tikiFactory 
    start: function() {
      var exp = {}, ret;
      this.tikiFactory(null, exp, null); // no require or module!
      ret = exp.Browser.start(this.ENV, this.ARGS, queue);
      queue = null;
      return ret ;
    }
    
  };
  
  if (T_UNDEFINED !== typeof ENV) tiki.ENV = ENV;
  if (T_UNDEFINED !== typeof ARGV) tiki.ARGS = ARGV; // for older versions
  if (T_UNDEFINED !== typeof ARGS) tiki.ARGS = ARGS;
  
  return tiki;
  
}(); }

