// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Event event */

"import tiki:core as core";
"export Event Timer add remove send flush next once after begin end run";

// low-level event system.  Note that this does not actually hook into the 
// browser directly.  Rather it will load the browser/event module, which is
// expected to implement browser-specific code to listen for events and call
// send() when something interesting happens.
//
var now = 0; // this must be set at the start of each event loop

// ..........................................................
// EVENT
// 

/**
  A unified API for an Event.  This can be populated by standard browser
  code based on the platform.
  
  @constructor
  @param {Hash} opts properties to copy onto the final event
  @returns {Event} new instance
*/
Event = function(opts) {
  var key, ownProp = Object.prototype.hasOwnProperty ;
  if (opts) {
    for(key in opts) {
      if (!ownProp.call(opts, key)) continue;
      this[key] = opts[key];
    }
  }
  this.freeze();
  return this ;
};

Event.prototype = {

  /**
    Make duck-typing easy.
  
    @property {Boolean}
  */
  isEvent: true,
  
  /**
    Set to true when the event is frozen and cannot be modified (at least 
    in ES5).
    
    @property {Boolean}
  */
  isFrozen: false,

  /**
    Freezes the event, setting isFrozen to true.
    
    @returns {Event} receiver
  */
  freeze: function() {
    if (this.isFrozen) return this ;
    this.isFrozen = true;
    if (Object.freeze) Object.freeze(this);
    return this ;
  },
  
  /**
    Name of the event.
    
    @property {String}
  */
  name: null,
  
  /**
    Target of the event, if any.  Note that destroy() will clear this 
    property.
    
    @property {Object}
  */
  target: null  
  
};

// ..........................................................
// TIMERS
// 

Timer = function() {
  
};

Timer.prototype = {

  /**
    Cancels a timer
    
    @returns {Timer} receiver
  */
  cancel: function() {
          
  },
  
  /** 
    Fires a timer immediately.
  */
  fire: function() {
    
  }
};

var timerPool = []; // timer pool

// get a new timer and add it to the timeout schedule.  compute the fire
// time.
function _scheduleTimer(delay, target, method, params) {
  var ret = timerPool.pop() || new Timer(),
      fireTime = now + delay,
      cur, last;
  
  ret.delay  = delay;
  ret.target = target;
  ret.method = method;
  ret.params = params;
  ret.fireTime = fireTime;
  ret.isScheduled = true ;

  return ret ;
}

// when finished with a timer, return it to the timer pool
function _cleanupTimer(timer) {
  timer.delay = timer.target = timer.method = timer.params = null;
  timer.next = null;
  timer.isScheduled = false;
  timerPool.push(timer);
  return timer ;
}


// ..........................................................
// API
// 

/** @private - 
  listeners for various events - keyed by name, el.  Listeners are sorted
  by { target: { method: [ [params1], [params2], [params3] ] } }  
*/
var listeners = {};

/** @private - 
  direct links to listeners by target
*/
var targets = {} ;
var methods = {} ;

/**
  Adds an event listener, optionally on a named element or target object.
  Will invoke the passed target/method with any passed params when the 
  event occurs.
  
  To remove the listener, pass the same el, name, target and method.  Extra
  params are ignored.
  
  h2. Examples
  
  {{{
    event.add('foo', function() { console.log('foo called'); });
    event.add(el, 'click', function() { alert('clicked!'); });
    event.add('foo', MyObject, 'handler', anItem, anotherItem);
    event.add(el, 'click', MyObject, MyObject.clicked, anItem);
  }}}
  
  @param {Object} el target for the event
  @param {String} name name of the event.  can be made up
  @param {Object} target to invoke
  @param {Function|String} method method to call
  @param {...} params zero or more additional params, added after event
  @returns {Module} receiver
*/
add = function add(el, name, target, method, params) {
  var byName, byEl, byTarget, byMethod, p, guid;

  // normalize params
  if (core.typeOf(el) === core.T_STRING) {
    if (core.typeOf(name) === core.T_FUNCTION) {
      p = arguments.length>2 ? SC.A(arguments).slice(2) : null;
      method = name; name = el; el = target = null;
      
    } else {
      p = arguments.length>3 ? SC.A(arguments).slice(3) : null;
      method = target;  target = name; name = el; el = null;
    }
  } else if (core.typeOf(name) === core.T_FUNCTION) {
    p = arguments.length>3 ? SC.A(arguments).slice(3) : null;
    method = target; target = null;
  } else   p = arguments.length>3 ? SC.A(arguments).slice(4) : null;
  
  if (core.typeOf(method) === core.T_STRING) {
    if (!target) throw "method cannot be a string without a target";
    method = target[method];
  }
  
  // walk down the chain...
  guid = core.guidFor(el);
  byEl = listeners[guid];
  if (!byEl) byEl = listeners[guid] = {};
  
  byName = byEl[name];
  if (!byName) byName = byEl[name] = {};
  
  guid = core.guidFor(target);
  targets[guid] = target;
  byTarget = byName[guid];
  if (!byTarget) byTarget = byName[guid] = {};
  
  guid = core.guidFor(method);
  methods[guid] = method ;
  byMethod = byTarget[guid];
  if (!byMethod) byMethod = byTarget[guid] = [];
  
  if (p) p.unshift(null) ; //make room for ev
  byMethod.push(p); // adding a spot for params here will add listener
};

/**
  Removes an event listener.  Pass the same el, name, target and method.
  This will remove all listeners with this match, regardless of params.
  
  If you pass only an el target, or just a name, then all listeners will
  be removed.  If you pass a target with null el/name, then all listeners 
  for that target will be removed.
  
  h2. Examples

  {{{
    event.remove('foo');
    event.remove(el, 'foo');
    event.remove(null, null, target);
    event.remove(null, null, target, target.foo);
    event.remove(el, 'click', target);
  }}}
  
  @param {Object} el target for the event
  @param {String} name name of the event.  can be made up
  @param {Object} target to invoke
  @param {Function|String} method method to call
  @param {...} params zero or more additional params, added after event
  @returns {Module} receiver
*/
remove = function remove(el, name, target, method) {
  var byName, byEl, byTarget, t, p, guid;
  
  // normalize params
  if (core.typeOf(el) === core.T_STRING) {
    method = target; target = name; name = el;
  }
  
  if (core.typeOf(target) === core.T_FUNCTION) {
    method = target; target = null;
  }
  
  if (core.typeOf(method) === core.T_STRING) method = target[method];

  // now handle removal...
  // TODO: removal
};

var queue = [] ; // internal queue of events to send
var queueSwap = [];
var queuePool = [];
var flushing = false ;

/**
  Sends an event to any listeners.  Pass the optional target, name, and 
  an event object.
  
  @param {Object} el optional target for event
  @param {String} name name of event
  @param {Object} ev event itself
  @returns {Module} receiver
*/
send = function send(el, name, ev) {
  var item = queuePool.pop() || {};
  item.el = el; item.name = name; item.ev = ev;
  queue.push(item);
  return this ;
};

function _deliver(el, name, ev) {
  var tinfo, guid, target, method, minfo, mguid, params, idx, len, p;
  
  tinfo = listeners[core.guidFor(el)];
  if (tinfo) tinfo = cur[name];
  
  for(guid in tinfo) {
    if (!tinfo.hasOwnProperty(guid)) continue ;
    
    target = targets[guid]; // get target
    if (!targets) continue ;
    
    minfo = tinfo[guid];
    if (!minfo) continue;
    
    for(mguid in minfo) {
      if (!minfo.hasOwnProperty(mguid)) continue;
      
      method = methods[mguid];
      if (!method) continue ;
      
      params = minfo[mguid];
      len = params ? params.length : 0;
      for(idx=0;idx<len;idx++) {
        p = params[idx];
        if (p) p[0] = ev;
        method.apply(target, p);
        if (p) p[0] = null;
      }
    }
  }  
}

/**
  Immediately delivers any pending events and expired timers
  @returns {Boolean} true if events were flushed
*/
flush = function flush() {

  var idx, len = queue.length, q, item;
  if (flushing || len<=0) return false;
  flushing = true;
  
  q = queue;
  queue = queueSwap;
  queueSwap = q;
  
  for(idx=0;idx<len;idx++) {
    item = q[idx];
    _deliver(item.el, item.name, item.ev);
    item.el = item.name = item.ev = null;
    queuePool.push(item); // save for later to avoid memory alloc
  }
  
  q.length = 0; // truncate
  return true ;
};

/**
  Invokes the passed target/method/params the next run of the event loop.
  Basically whenever the current event finishes processing.  Returns the 
  timer used to handle this.  You can cancel the timer to reset.
  
  @param {Object} target target to invoke
  @param {Function|String} method method to call
  @param {...} params zero or more additional params
  @returns {Timer} timer
*/
next = function next(target, method, params) {
  
};

/**
  Invokes the passed target/method/params at the end of the current event
  loop.  This differs from next in that it will not give the event loop a
  chance to check for more browser events.
  
  @param {Object} target target to invoke
  @param {Function|String} method method to call
  @param {...} params zero or more additional params
  @returns {Timer} timer
*/
once = function once(target, method, params) {
  
};
  

/**
  Invoke the passed target/method and params after the specified period 
  has passed.  This will use a unified timer loop.  Returns the timer use
  to schedule.  Cancel timer to remove.
  
  @param {Number} period delay in milleseconds
  @param {Object} target target to invoke
  @param {Function|String} method method to call
  @param {...} params zero or more additional params
  @returns {Timer} timer
*/
after = function after(period, target, method, params) {
  
};

/**
  Begins an event loop.  Any events you schedule inside of this event loop
  will be flushed at the end of the event loop.  You can next event loops,
  but events will only flush at the end of the top level loop.

  @returns {Module} receiver
*/
begin = function begin() {
  
};

/**
  Ends an event loop.  Any events schedules during the loop may be invoked.

  @returns {Module} receiver
*/
end = function end() {
  
};

/**
  Runs a single event loop, simply processing any events in the queue. This
  is how you can make sure an event you just sent is delivered.

  @returns {Module} receiver
*/
run = function run() {
  return this.begin().end();
};
