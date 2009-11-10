// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals ready unload Invocation */

"import core";
"import lib/invocation";
"import lib/platform";
"export package ready unload";

var platform = require(PLATFORM_PACKAGE);

// ..........................................................
// READY HANDLER
// 

// called when the document becomes ready.  work through the queue...
function _ready() {
  var queue = ready.queue, 
      mainQ = ready.mainQ,
      len   = queue.length,
      inv, idx;

  ready.isReady = ready.scheduled = YES ;
  ready.queue = []; // ok to alloc since it is usually only called once
  ready.mainQ = [];
  
  for(idx=0;idx<len;idx++) {
    inv = queue[idx];
    inv.invoke();
    inv.release(); // return to pool
  }

  // after calling ready handlers, invoke any main functions to start the app
  len = mainQ.length;
  for(idx=0;idx<len;idx++) {
    inv = mainQ[idx];
    inv.invoke();
    inv.release(); // return to pool
  }
};

/**
  Call to register methods you want run when the system is ready for the app
  to run.
*/
ready = function(target, method, args) {
  if (ready.isReady) {
    Invocation.invoke(target, method, arguments, 2);
    
  } else {
    if (!ready.scheduled && platform) platform.ready(_ready);
    ready.scheduled = YES ;
    ready.queue.push(Invocation.create(target, method, arguments, 2));
  }
  
  return this ;
};

ready.isReady = NO ;
ready.queue   = [] ;
ready.scheduled = NO ;
ready.mainQ   = [] ; // invocations for main. called after ready

ready.main = function(target, method, args) {
  if (ready.isReady) {
    Invocation.invoke(target, method, arguments, 2);
    
  } else {
    if (!ready.scheduled && platform) platform.ready(_ready);
    ready.scheduled = YES ;
    ready.mainQ.push(Invocation.create(target, method, arguments, 2));
  }
  
  return this ;
};

// ..........................................................
// UNLOAD HANDLER
// 

function _unload() {
  var queue = unload.queue, 
      len   = queue.length,
      inv, idx;

  unload.isUnloaded = unload.scheduled = YES ;
  unload.queue = [];
  
  for(idx=0;idx<len;idx++) {
    inv = queue[idx];
    inv.invoke();
    inv.release(); // return to pool
  }
}

/**
  Call to register methods you want run when the system is about to unload.
*/
unload = function(target, method, args) {
  if (unload.isUnloaded) {
    Invocation.invoke(target, method, arguments, 2);
    
  } else {
    if (!unload.scheduled && platform) platform.unload(_unload);
    unload.scheduled = YES;
    unload.queue.push(Invocation.create(target, method, arguments, 2));
  }
  
  return this ;
};

unload.isUnloaded = NO;
unload.queue      = [];
unload.scheduled  = NO;
