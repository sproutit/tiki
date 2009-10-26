// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals schedule repeat cancel */

"export schedule repeat cancel";

/**
  @file

  The timer is part of the platform kernel that must be implemented for 
  tiki to run.  It provides three simple methods: schedule(), repeat() and
  cancel().
  
  h3. schedule()
  
  This method should invoke the passed callback/target after a set period of
  time.  The return object should be a handle that can be passed to cancel to
  abort the timer later.  The returned value is opaque; i.e. it's is 
  implementation dependent.
  
  h3. repeat()
  
  This method should invoke the passed callback/target repeatedly until it is
  cancelled.  The return object should be a handle that can be passed to
  cancel() to abort the timer later.  The returned value is opaque.
  
  h3. cancel()
  
  This method should cancel the passed timer object.  The timer should not 
  fire again.
  
  The browser implementation is based on setTimeout() and setInterval().  It 
  is not necessary to use any kind of invoke queue as that is handled by 
  higher levels of the library.
*/

/**
  Invoke the passed callback/target after the specified period of time.
  
  @param {Number} delay delay in milleseconds
  @param {Function} callback the method to invoke
  @param {Object} target optional context to use for this
  @returns {Object} the timer object
*/
schedule = function schedule(after, callback, target) {
  var ret, func;
  func = target ? function() { callback.call(target, ret); } : callback; 
  ret = setTimeout(after, func);
  callback = null; // cleanup memory
  return ret ;
};

/**
  Repeatedly invoke the passed callback/target each period of time until
  the timer is invalidated.
  
  @param {Number} period delay between invocations in milleseconds
  @param {Function} callback the method to invoke
  @param {Object} target optional context to use for this
  @returns {Object} the timer object
*/
repeat = function repeat(after, callback, target) {
  var ret, func;
  func = target ? function() { callback.call(target, ret); } : callback; 
  ret = setInterval(after, func); 
  callback = null; // cleanup memory
  return ret ;
};

/**
  Cancels the passed timer.  It will no longer be invoked.

  @param {Object} the timer object
  @returns {void}
*/
cancel: function cancel(timer) {
  clearTimeout(timer);
  clearInterval(timer);
};

