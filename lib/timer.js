// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================

var Invocation = require('invocation');

/**
  @file

  Schedules a timer to fire at a later time.  This is an implementation of the 
  timer API proposed by CommonJS.  In addition to accepting a function and
  delay, it can optionally accept a caller context and zero or more parameters
  as additional options.  This is more efficient than using Function.bind().

*/


var timeouts = {}; // cache of invocations...
var intervals = {}; // cache of invocations...

// removes an invocation from the local hash, cleaning it up as needed...
function cleanUpTimeout(inv) {
  if (!inv) return;
  delete timeouts[inv.timerKey];
  delete inv.timerKey;
  inv.release(); // return to pool  
}

// creates a callback to invoke and optionally cleanup the invocation
// this is separate to keep the closure scope clean
function createCallback(inv, cleanUp) {
  return function() {
    inv.invoke();
    if (cleanUp) cleanUpTimeout(inv);
  };
}

/**
  Adds a single timeout to fire after a specified period of time.  You can 
  pass an optional method, target, and additional params as needed.
  
  @param {Function} callback the callback to execute.  must be a function
  @param {Number} delay delay in milleseconds
  @param {Object} target optional scope target for callback
  @param {Object..} params optional additional parameters
  @returns {Object} a key representing the timeout
*/
exports.setTimeout = function(callback, delay, target, params) {
  var ret, inv; 

  if (arguments.length>2) {
    inv = Invocation.create(target, callback, arguments, 3);
    callback = createCallback(inv, true);
  }
  
  ret = setTimeout(callback, delay);
  if (inv) {
    inv.timerKey = ret;
    timeouts[ret] = inv;
  }
  
  return ret ;
};

/**
  Cancels a timeout if it has not already fired.
  
  @param {Object} timerKey the timer key
  @returns {void}
*/
exports.clearTimeout = function(timerKey) {
  cleanUpTimeout(timeouts[timerKey]);
  clearTimeout(timerKey);
};
  
/**
  Schedules a repeating interval timer.  This will fire repeatedly until you
  explicitly clear the interval.

  @param {Function} callback the callback to execute.  must be a function
  @param {Number} delay delay in milleseconds
  @param {Object} target optional scope target for callback
  @param {Object..} params optional additional parameters
  @returns {Object} a key representing the timeout
*/
exports.setInterval = function(callback, delay, target, params) {
  var ret, inv ;
  
  if (arguments.length > 2) {
    inv = Invocation.create(target, callback, arguments, 3);
    callback = createCallback(inv, false);
  }
  
  ret = setInterval(callback, delay);
  if (inv) intervals[ret] = inv;
  
  return ret ;
} ; 

/**
  Cancels an interval if it has not already fired.
  
  @param {Object} timerKey the timer key to cancel
  @returns {void}
*/
exports.clearInterval = function(timerKey) {
  var inv = intervals[timerKey];
  if (inv) {
    inv.release();
    delete intervals[timerKey];
  }
  clearInterval(timerKey);
};

