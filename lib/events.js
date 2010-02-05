// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Invocation = require('invocation');

// the reactor can schedule events to fire.  It is used along with an event
// emitter to fire events at a later time
var Reactor = tiki.extend({

  _level: 0,
  
  /**
    The current queue of invocations that need to be invoked
  */
  queue: null,
  
  begin: function() {
    this._level++;
    return this;
  },
  
  end: function() {
    this._level--;
    if (this._level<=0) {
      this._level = 0;
      this.flush();
    }
  },
  
  /**
    Schedule an invocation to fire in the reactor
  */
  schedule: function(target, method, args, ignore) {
    var queue = this.queue, 
        inv;
        
    if (arguments.length>1) {
      inv = Invocation.create(target, method, args, ignore);
    } else inv = target.retain() ;
        
    if (!queue) queue = this.queue = [];
    queue.push(inv);
    return this;
  },
  
  /**
    Flush any pending invocations.  This is normally called automatically 
    when you end a reactor loop
  */
  flush: function() {
    var repeat = true;
    while(repeat) repeat = this.invokeQueues();
    return this;
  },
  
  /**
    Actually invokes any pending items from the queue.  Must return true if 
    items were invoked and false otherwise.  Called by flush().  Override to
    enhance the reactor.
    
    @returns {Boolean}
  */
  invokeQueues: function() {
    var queue = this.queue,
        len   = queue ? queue.length : 0, 
        idx, inv;
        
    if (queue.length === 0) return false; // nothing to do

    // swap queues so that a new queue can fill
    this.queue = this._altQueue;
    this._altQueue = null;
    
    for(idx=0;idx<len;idx++) {
      inv = queue[idx];
      inv.invoke();
      inv.release(); // required to handle memory pool
    }

    // reset queue array and save it for the next flush.
    queue.length = 0;
    this._altQueue = queue;
    
    return true;
  }
    
});
exports.Reactor = Reactor;
exports.reactor = new Reactor('default');

var EventEmitter = tiki.extend({
  
  addListener: function(type, listener) {
    if (listener instanceof Function) {
      var events = this._ee_events;
      if (!events) events = this._ee_events = {};
      if (!events.hasOwnProperty(type)) events[type] = [];

      // To avoid recursion in the case that type == "newListeners"! Before
      // adding it to the listeners, first emit "newListeners".
      this.emit("newListener", type, listener);
      events[type].push(listener);
    }
    return this;
  },

  removeListener: function (type, listener) {
    if (listener instanceof Function) {
      // does not use listeners(), so no side effect of creating _ee_events[type]
      var events = this._ee_events;
      if (!events || !events.hasOwnProperty(type)) return this;
      var list = events[type];
      if (list.indexOf(listener) < 0) return this;
      list.splice(list.indexOf(listener), 1);
    }
    return this;
  },

  listeners: function(type) {
    var events = this._ee_events;
    if (!events) events = this._ee_events = {};
    if (!events.hasOwnProperty(type)) events[type] = [];
    return events[type];
  },

  xTikiReactor: function(newReactor) {
    if (arguments.length>0) this._ee_reactor = newReactor;
    return this._ee_reactor || exports.reactor;
  },
  
  // discover any registered listeners and add them to reactor queue
  emit: function(type, args) {
    var reactor   = this.xTikiReactor(),
        listeners = this.listeners(type),
        len       = listeners.length,
        idx;
    for(idx=0;idx<len;idx++) {
      reactor.schedule(this, listeners[idx], arguments, 1);
    }
    return this;
  }
  
});
exports.EventEmitter = EventEmitter;

var PENDING   = 'pending',
    CANCELLED = 'cancelled',
    SUCCESS   = 'success',
    ERROR     = 'error';
    
var Promise = tiki.extend(EventEmitter, {

  xTikiState: PENDING,

  _pr_clearTimeout: function() {
    if (this._timer) {
      this.xTikiReactor().clearTimeout(this._timer);
      this._timer = null;
    }
  },
  
  _pr_fireTimeout: function() {
    this._timer = null;
    if (!this.xTikiTimeoutPending) return; // done!
    self.emitError(new Error('timeout'));
  },
  
  _pr_timeoutComplete: function() {
    this.xTikiTimeoutPending = false;
    this._pr_clearTimeout();
  },
  
  timeout: function(timeout) {
    if (timeout === undefined) return this._timeoutDuration;
    
    var reactor    = this.xTikiReactor(),
        onComplete = this._pr_timeoutComplete;
        
    this._timeoutDuration = timeout;
    this._pr_clearTimeout();

    this.xTikiTimeoutPending = true;
    this.addCallback(onComplete)
        .addCancelback(onComplete)
        .addErrback(onComplete);
        
    this._timer = reactor.setTimeout(this._pr_fireTimeout, timeout, this);
    return this;
  },
  
  cancel: function() {
    if (this.xTikiState !== PENDING) return this; // nothing to do
    this.xTikiState = CANCELLED;

    // not technically needed because we use states to manage the promise but 
    // it is provided here for compatibility with node.js
    this.listeners('success').length = 0 ;
    this.listeners('error').length = 0;
    
    this.emitCancel();
  },
  
  emitCancel: function() {
    Array.prototype.unshift.call(arguments, 'cancel');
    this.emit.apply(this, arguments);
  },
  
  emitSuccess: function() {
    if (this.xTikiState !== PENDING) return this; // nothing to do
    this.xTikiState = SUCCESS;
    Array.prototype.unshift.call(arguments, 'success');
    this.emit.apply(this, arguments);
    return this ;
  },
  
  emitError: function() {
    if (this.xTikiState !== PENDING) return this; // nothing to do
    this.xTikiState = ERROR;
    Array.prototype.unshift.call(arguments, 'error');
    this.emit.apply(this, arguments);
    return this;
  },
  
  addCallback: function(listener) {
    this.addListener('success', listener) ;
    return this;
  },
  
  addErrback: function(listener) {
    this.addListener('error', listener);
    return this;
  },
  
  addCancelback: function(listener) {
    this.addListener('cancel', listener);
    return this ;
  }
  
});
exports.Promise = Promise;
