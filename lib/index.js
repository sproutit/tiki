// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================



// ..........................................................
// ..........................................................

// ..........................................................
// BROWSER READY/UNLOAD
// 

// These two methods are used by tiki to do some initial setup/teardown.  
// We also expose them as part of the global API so that other libraries can
// avoid reimplementing the same basic logic

var Invocation = require('invocation'),
    handlers   = {}, ready, unload;

var K = function() {};

function queueListener(src, status, queueName, target, method, args) {
  var inv ;
  
  // if ready, invoke immediately.  otherwise schedule
  if (src[status]) {
    if (target && target.isInvocation) target.invoke();
    else Invocation.invoke(target, method, args, 2);
    
  } else {
    if (target && target.isInvocation) inv = target.retain();
    else inv = Invocation.create(target, method, args, 2);
    if (!src[queueName]) src[queueName] = [];
    src[queueName].push(inv);
    src.schedule(); // only used by unload
  }
}

function flushQueue(src, queueName) {
  var q = src[queueName],
      len = q ? q.length : 0,
      idx, inv;
    
  for(idx=0;idx<len;idx++) {
    inv = q[idx];
    inv.invoke();
    inv.release(); // release to return to pool
  }
  src[queueName] = null;
}

/**
  Register a method you want to run when the browser has finished parsing the
  main HTML document body (but possibly before any images have loaded).  You
  can either pass target/method/arguments or an Invocation object.  If the 
  document is ready, the method will be invoked immediately.
  
  @param {Object|Invocation} target the target to call or an invocation
  @param {Function|String} method the function or method to invoke
  @param {Object...} args zero or more additional arguments to invoke
*/
ready = function(target, method, args) {
  queueListener(ready, 'isReady', 'queue', target, method, arguments);
};
exports.ready = ready;

/**
  Register a main function you want to run when the browser is ready. You
  can either pass target/method/arguments or an Invocation object.  If the 
  document is ready, the method will be invoked immediately.
  
  @param {Object|Invocation} target the target to call or an invocation
  @param {Function|String} method the function or method to invoke
  @param {Object...} args zero or more additional arguments to invoke
*/
ready.main = function(target, method, args) {
  queueListener(ready, 'isReady', 'mqueue', target, method, arguments);
};

// becomes true when ready fires 
ready.isReady = false; 

// called when the document becomes ready
ready.fire = function() {
  if (ready.isReady) return ; // nothing to do
  ready.isReady = true ; 
  if (require.loader) require.loader.isReady = true;
  
  // first cleanup any listeners so they don't fire again
  if (ready.cleanup) ready.cleanup();
  ready.cleanup = null; 
  
  // flush any pending queues
  flushQueue(ready, 'queue');
  flushQueue(ready, 'mqueue');
  
  // allow new instances of index (from bootloader etc) to chain
  var nextReady = require.loader ? require.loader.nextReady : null;
  if (nextReady && (nextReady !== ready)) nextReady.fire();
};
ready.fire.displayName = 'ready.fire()';

// ready is always scheduled so this method can do nothing
ready.schedule = K;

// always listen for onready event - detect based on platform
// those code is derived from jquery 1.3.1
// server-side JS
if (T_UNDEFINED === typeof document) {
  // TODO: handler server-side JS cases here

// Mozilla, Opera, webkit nightlies
} else if (document.addEventListener) {

  // cleanup handler to be called whenever any registered listener fires
  // should prevent additional listeners from firing
  ready.cleanup = function() {
    document.removeEventListener('DOMContentLoaded', ready.fire, false);
    document.removeEventListener('load', ready.fire, false);
  };
  
  // register listeners
  document.addEventListener('DOMContentLoaded', ready.fire, false);
  document.addEventListener('load', ready.fire, false);
  
// IE
} else if (document.attachEvent) {
  
  // cleanup handler - should cleanup all registered listeners
  ready.cleanup = function() {
    document.detachEvent('onreadystatechange', ready.fire);
    document.detachEvent('onload', ready.fire);
    ready.ieHandler = null; // this will stop the ieHandler from firing again
  };
  
  // listen for readystate and load events
  document.attachEvent('onreadystatechange', ready.fire);
  document.attachEvent('onload', ready.fire);
  
  // also if IE and no an iframe, continually check to see if the document is
  // ready
  // NOTE: DO NOT CHANGE TO ===, FAILS IN IE.
  if ( document.documentElement.doScroll && window == window.top ) {
    ready.ieHandler = function() {

      // If IE is used, use the trick by Diego Perini
      // http://javascript.nwbox.com/IEContentLoaded/
      if (ready.ieHandler && !ready.isReady) {
        try {
          document.documentElement.doScroll("left");
        } catch( error ) {
          setTimeout( ready.ieHandler, 0 );
          return;
        }
      }

      // and execute any waiting functions
      ready.fire();
    };

    ready.ieHandler();
  }
  
}

if (require.loader && require.loader.previousLoader) {
  if (require.loader.previousLoader.isReady) ready.fire();
  else require.loader.previousLoader.nextReady = ready;
  require.loader.previousLoder = null;
}

/**
  Register a method to execute just before the browser unloads.  Often used
  to cleanup any references to 'window' or 'document' to prevent a memory 
  leak.
  
  
  @param {Object|Invocation} target the target to call or an invocation
  @param {Function|String} method the function or method to invoke
  @param {Object...} args zero or more additional arguments to invoke
*/
unload = function(target, method, args) {
  queueListener(unload, 'isUnloading', 'queue', target, method, arguments);
};
exports.unload = unload;

// becomes true when unload fires
unload.isUnloading = false;

// call on unload
unload.fire = function() {
  if (unload.isUnloading) return;
  unload.isUnloading = true;
  
  if (unload.cleanup) unload.cleanup();
  unload.cleanup = null;

  // flush any pending queues
  var q = unload.queue,
      len = q ? q.length : 0,
      idx, inv;
    
  for(idx=0;idx<len;idx++) {
    inv = q[idx];
    inv.invoke();
    inv.release(); // release to return to pool
  }
  unload.queue = null;
  
};

unload.schedule = function() {
  if (unload.isScheduled) return ;
  unload.isScheduled = true;
  
  if (T_UNDEFINED === typeof document) {
    // TODO: Handle server-side JS mode
    
  } else if (document.addEventListener) {
    unload.cleanup = function() {
      document.removeEventListener('unload', unload.fire);
    };
    document.addEventListener('unload', unload.fire, false);
    
  } else if (document.attachEvent) {
    unload.cleanup = function() {
      document.detachEvent('onunload', unload.fire);
    };
    document.attachEvent('unload', unload.fire);
  }
};
