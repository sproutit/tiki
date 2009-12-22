// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Reactor utils Invocation tiki */

"import utils as utils";
"import invocation";
"export Reactor";

/**
  @file
  
  The reactor module implements a common API for building event driven 
  application in a cross platform way.  Use this module anytime you want to
  handle event listeners and timers in a memory efficient way.  
  
  One major benefit of using the reactor is that it will ensure all of your
  callbacks execute the proper order.
*/


/**
  Implements a generic reactor.  One reactor is initialized for each worker 
  in your application.  The primary thread will also listen for native 
  browser events as well.
*/
Reactor = utils.extend({
  
  /** 
    Adds an event listener for the named type and an optional source.  If you
    pass null for the source, then the listener will fire for all events of 
    the named type. 
    
    If you pass in a platform native event (such as mousedown) a DOMelement
    or document, then this will also handling listening for the event in the 
    DOM itself as well.
    
    @param {String} eventName 
      the event name to listen to
    
    @param {Object} source 
      an optional source to filter on.  pass null to listen for all events
      
    @param {Object} target 
      an optional target 
      
    @param {Function|String} methodName 
      method name or function to invoke
      
    @param {...Object} args 
      zero or more additional params to martial
      
    @returns {Object} a reference for removeListener(). 
  */
  addListener: function(eventName, source, target, methodName, args) {
    var inv = Invocation.create(target, methodName, arguments, 4),
        ref = this._ref(inv),
        sourceGuid = utils.guidFor(source),
        listeners = this._listeners, sources, invs;
        
    // add to listeners table...
    if (!listeners) listeners = this._listeners = {};
    sources = listeners[eventName];
    if (!sources) sources = listeners[eventName] = {};
    invs = sources[sourceGuid];
    if (!invs) invs = sources[sourceGuid] = { __count: 0 };
    invs[utils.guidFor(inv)] = inv;
    invs.__count++; 
    
    // save some stuff on the inv for later
    inv.reactorSource = sourceGuid;
    inv.reactorEventName  = eventName;
    
    // invoke platform specific listener as well...
    if (invs.__count === 1) {
      tiki.platform('event').addListener(eventName, source, this, '_trigger');
    }
    
    return ref ;
  },
  
  /**
    Removes a previously registered event listener.  You must pass in the 
    referene returned by addListener().  If the reference is no longer active
    this will have no effect.
    
    @param {Object} ref a listener reference
    @returns {void}
  */
  removeListener: function(ref) {
    var inv = this._ref(ref), 
        listeners, sources, invs, source, sourceGuid, eventName, evt;
        
    if (!inv) return; // nothing to do

    source = inv.reactorSource;
    sourceGuid = utils.guidFor(source);
    eventName = inv.reactorEventName;

    listeners = this._listeners;
    sources = listeners ? listeners[inv.eventName] : null;
    invs = sources ? sources[inv.sourceGuid] : null;
    
    if (invs) {
      delete invs[utils.guidFor(inv)]; // clean up!
      if (invs.__count<=0) {
        evt = tiki.platform('event');
        evt.removeListener(eventName, source, this, '_trigger');
      }
    }
    
    // cleanup inv and release
    this._clearRef(inv);
    delete inv.reactorSource;
    delete inv.reactorEventName;
    inv.release(); // return to the pool.
  },
  
  /**
    Adds a one shot timer to fire after the specified delay.  Note that this
    is not a real-time timer.  You are gauranteed that the timer will not fire
    before the delay has elapsed and that it will fire eventually, but there 
    is no guarantee as to how long after delay it will fire.
    
    @param {Number} delay 
      delay in milliseconds before timer will fire.
  
    @param {Object} target 
      an optional target 
    
    @param {Function|String} methodName 
      method name or function to invoke
    
    @param {...Object} args 
      zero or more additional params to martial
    
    @returns {Object} an retainable reference for removeTimeout(). 
  */
  addTimeout: function(delay, target, methodName, args) {
    
  },

  /**
    Removes a previously registered timeout.  If the timeout has already 
    expired, this method may return null.
    
    @param {Object} ref a listener reference
    @returns {void}
  */
  removeTimeout: function(ref) {
    
  },

  /**
    Adds a repeating timer to fire periodically until it is cancelled.  Note 
    that this is not a real-time timer.  You are gauranteed that the timer 
    will not fire before the delay has elapsed and that it will fire 
    eventually, but there is no guarantee as to how long after delay it will 
    fire.
    
    @param {Number} delay 
      delay in milliseconds before timer will fire.
  
    @param {Object} target 
      an optional target 
    
    @param {Function|String} methodName 
      method name or function to invoke
    
    @param {...Object} args 
      zero or more additional params to martial
    
    @returns {Object} an retainable reference for removeInterval(). 
  */
  addInterval: function(delay, target, methodName, args) {
    
  },

  /**
    Removes a previously registered interval. If the interval has already 
    been cancelled this will have no effect
    
    @param {Object} ref a timer reference
    @returns {void}
  */
  removeInterval: function(ref) {
    
  },

  /**
    Adds an event to the queue to be processed.  This event will be processed
    BEFORE any additional native events are processed.
    
    @param {String} eventName 
      the event name
    
    @param {Object} source
      an optional source or null if no source
      
    @param {...Object} args 
      zero or more additional arguments to pass to the caller.  Usually you 
      will pass an event object here.
      
    @returns {void}
  */
  emit: function(eventName, source, args) {
    
  },
  
  /**
    Adds an invocation to execute next in the queue before any additional
    events are processed.  This is a way to make place the queue into a 
    stable state.
    
    @param {Object} target 
      an optional target 
    
    @param {Function|String} methodName 
      method name or function to invoke
    
    @param {...Object} args 
      zero or more additional params to martial
    
    @returns {Object} an  reference for removeNext().  
  */
  next: function(target, methodName, args) {
    
  },
  
  /**
    Remove the referenced item from the queue of actions to execute next.
    
    @param {Object} ref
    @returns {void}
  */
  cancel: function(ref) {
    
  },
  
  // ..........................................................
  // PRIVATE METHODS
  // 
  
  /** @private
    Sends an event to listeners of the event.
    
    eventName: the event name
    source: the source (optional)
    args: any additional arguments to include.
  */
  _send: function(eventName, source, args) {
    var listeners = this._listeners, invs;
    if (!listeners) return;
    if (source) this._invoke(listeners[utils.guidFor(source)], args);
    this._invoke(listeners[utils.guidFor(null)], args);
  },
  
  _invoke: function(invs, args) {
    if (!invs) return;
    for(var key in invs) {
      if (!invs.hasOwnProperty(key)) continue;
      invs[key].invoke(args);
    }
  },
  
  /** @private
    Converts an invocation to a reference or visa versa.  
  */
  _ref: function(inv) {
    var refs = this._refs, idx = this._refidx ;
    if (!refs) { 
      refs = this._refs = [];
      idx = this._refidx = 0 ;
    }
    
    if (inv instanceof Invocation) {
      if (inv.reactorRef) return inv.reactorRef;
      
      // find the next free loc
      while(refs[idx]) {
        idx++;
        if (idx > 10000000) idx = 0 ; // start over
      }
      
      refs[idx] = inv;
      inv.reactorRef = idx;
      
      return idx;
      
    } else return refs[inv];
    
  },
  
  /** @private
  
    Clears the invocation from the reference hash
  */
  _clearRef: function(inv) {
    var refs = this._refs, idx = inv.reactorRef;
    if (refs && idx) {
      refs[idx] = undefined;
      delete inv.reactorRef;
    }
    return inv;
  }
  
});



