// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Invocation */

"import core";
"import mixins/retainable";
"export package Invocation";

/**
  An Invocation captures a target, method and zero or more arguments to be 
  called at a later time.  Invocations are retainable so you can control when
  they are destroyed.
  
  Note that if you pass a string to the method param, this string will not 
  be resolved to a function until you actually invoke it.  This means you can
  potentially swap out the method between invocations.
  
  @since SproutCore 1.1
*/
Invocation = function Invocation(target, method, args) {
  return this.init(target, method, args);
};

mixin(Invocation.prototype, Retainable, {
  
  constructor: Invocation,
  
  /**
    Initializes the invocation.  This is called when you first create the 
    invocation.
  */
  init: function(target, method, args, ignore) {
    if (args && (ignore !== undefined)) {
      if (args.length>ignore) args = Array.prototype.slice.call(args, ignore);
      else args = null; // nothing to curry
    }
    
    this.inPool = NO; // for debug
    this.target = target;
    this.method = method;
    this.args   = args;
    return this ;
  },
  
  /**
    Destroys the invocation.  Called when the retain count hits zero.  This
    will return the invocation to the pool.
  */
  destroy: function() {
    // reset retainable
    this.isDestroyed = NO;
    this.retainCount = 1;
    this.inPool      = YES;
    this.target = this.method = this.args = null;
    pool.push(this); // add back to pool
    
    return this ;
  },
  
  /**
    Invokes the method.  Any passed arguments will be curried onto existing
    arguments.
    
    @returns {Object} return value of invoked method.
  */
  invoke: function() {
    return Invocation.invoke(this.target, this.method, this.args, undefined, arguments);
  }
  
});

var pool = [];

/**
  Creates a new invocation.  This method will use a memory pool if possible to
  avoid allocing memory.
  
  @param {Object} target target to invoke
  @param {Function|String} method function or name of method to invoke
  @param {Array} args zero or more arguments.  optional
  @param {Number} ignore if passed, ignores this many items from the args
  @returns {Invocation} new instance
*/
Invocation.create = function(target, method, args, ignore) {
  if (pool.length>0) return pool.pop().init(target,method,args,ignore);
  else return new Invocation(target, method, args, ignore);
};

/**
  Invokes the passed target, method, and arguments.  This is an optimized 
  version that may not actually create an invocation.
*/
/**
  Invokes the invocation.  Return value of invocation is returned.  Any 
  additional arguments will be curried onto the end of any existing args.
*/
Invocation.invoke = function(target, method, args, ignore, extra) {

  // normalize method
  if (typeOf(method) === T_STRING) method = target[method];
  if (!method) throw("Invocation: method " + this.method + " not defined");
  
  // normalize arguments - also curry any extra arguments
  if ((ignore !== undefined) && args) {
    if (args.length>ignore) args = Array.prototype.slice.call(args, ignore);
    else args = null;
  }
  if (extra && extra.length>0) args = args ? args.concat(extra) : extra;
  
  // and finally invoke
  return args ? method.apply(target, args) : method.call(target);
};

