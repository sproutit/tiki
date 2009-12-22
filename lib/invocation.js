// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Invocation utils Retainable */

"use exports Invocation";

var utils = require('utils'),
    Retainable = require('mixins/retainable'),
    Invocation;

var slice = Array.prototype.slice,
    pool  = [];
    
/**
  An Invocation captures a target, method and zero or more arguments to be 
  called at a later time.  Invocations are retainable so you can control when
  they are destroyed.
  
  Note that if you pass a string to the method param, this string will not 
  be resolved to a function until you actually invoke it.  This means you can
  potentially swap out the method between invocations.
  
  @since SproutCore 1.1
*/
Invocation = utils.extend(Retainable, /** @scope Invocation.prototype */{
  
  /**
    Initializes the invocation.  This is called when you first create the 
    invocation.
  */
  init: function(target, method, args, ignore) {
    if (args && (ignore !== undefined)) {
      if (args.length>ignore) args = slice.call(args, ignore);
      else args = null; // nothing to curry
    }
    
    this.inPool = false; // for debug
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
    this.isDestroyed = false;
    this.retainCount = 1;
    this.inPool      = true;
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
  
  @param {Object} target 
    object target to invoke.  will be "this"
    
  @param {Function|String} method 
    function or name of method to invoke.  If a method name is passed, it will
    resolve at the time of invoke.
    
  @param {Array} args
    optional.  array of zero or more arguments to include in invocation
    
  @param {Number} ignore
    optional.  number of items at beginning of args array to ignore.  This
    allows you to simply pass along an arguments array from a function without
    allocing more memory.
    
  @param {Array} extra
    optional. extra arguments to tack onto the end.
    
  @returns {Object} return value of invocation
*/
Invocation.invoke = function(target, method, args, ignore, extra) {

  // normalize method
  if (utils.typeOf(method) === utils.T_STRING) method = target[method];
  if (!method) throw("Invocation: method " + this.method + " not defined");
  
  // normalize arguments - also curry any extra arguments
  if ((ignore !== undefined) && args) {
    if (args.length>ignore) args = slice.call(args, ignore);
    else args = null;
  }
  if (extra && extra.length>0) args = args ? args.concat(extra) : extra;
  
  // and finally invoke - ise call if possible b/c it is faster
  return args ? method.apply(target, args) : method.call(target);
};

exports = module.exports = Invocation;
exports.Invocation = Invocation;

