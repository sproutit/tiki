// ==========================================================================
// Project:   SproutCore Costello - Property Observing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals ok AssertionError fmt beget equal notEqual deepEqual deepNotEqual */

"import core utils system/dump";
"export package AssertionError";
"export package ok equal equals notEqual deepEqual same deepNotEqual";

/**
  @class
  
  Error thrown by assertions that have failed.  For these assertions you may
  also set the CoreTest.throwsOnFailure property to false.
  
  When throwing an error, pass any properties you want copied onto the error.
  The message, actual, and expected are required to properly log the output.
  
  h2. Examples
  
  Throwing an error:
  
  {{{
    new AssertionError({ message: "foo", expected: "bar", actual: "baz" });
  }}}
  
  Optional (non-standard) method using parameters:
  
  {{{
    new AssertionError('actual', 'expected', 'message');
  }}}
  
  @since SproutCore 1.1
*/
AssertionError = function AssertionError(actual, expected, message) {
  if (arguments.length === 1) mixin(this, actual);
  else {
    this.actual   = actual;
    this.expected = expected;
    this.message  = message;
  }

  this.desc = this.message;

  var ret = ['AssertionError:'];
  if (this.message) ret.push(this.message);
  if ((this.actual!==undefined) || (this.expected!==undefined)) {
    var actual = CoreTest.dump(this.actual),
        exp    = CoreTest.dump(this.expected);
    ret.push(fmt('(actual = "%@" - expected = "%@")', actual, exp));
  }
  this.message = ret.join(' ');

  return this ;
};

AssertionError.prototype = beget(Error.prototype);
AssertionError.toString = function() {
  return this.message;
};

// ..........................................................
// PRIMITIVE ASSERTION API - Provides CommonJS Parity
// 
  
/**
  Asserts that the first passed value is true.
  
  @param {Boolean} pass true if assertion passed
  @param {String} message optional message
  @param {Object} actual optional actual value to display
  @param {Object} expected optional expected value to display
  @returns {void}
*/
ok = CoreTest.ok = function ok(pass, message, actual, expected) {
  var logger       = CoreTest.logger,
      shouldThrow  = CoreTest.throwsOnFailure,
      showVars     = arguments.length > 2,
      str;

  if (!logger) return this; // nothing to do

  if (showVars) {
    actual = CoreTest.dump(actual);
    expected = CoreTest.dump(expected);
  }
  
  if (pass) {
    str = showVars ? '%@ (actual = %@, expected = %@)' : '%@';
    logger.info(fmt(str, message, actual, expected));
    
  } else if (shouldThrow) {
    throw new AssertionError(actual, expected, message);
    
  } else {
    str = showVars ? '%@ (actual = %@, expected = %@)' : '%@';
    logger.error(fmt(str, message, actual, expected));
  }
  
  return pass;
};

/**
  Asserts that the actual value (first value) is identical to the expected 
  value using ===.
  
  @param {Object} actual actual value of test
  @param {Object} expected expected value of test
  @param {String} message optional message
  @returns {Boolean} YES if passed
*/
equal = CoreTest.equal = function equal(actual, expect, message) {
  message = fmt('%@ should be equal', message);
  return CoreTest.ok(actual === expect, message, actual, expect);
};
equals = equal ; // QUnit compatibility

/**
  Asserts that the actual value is NOT identical to the expected value using 
  ===.
  
  @param {Object} actual actual value of test
  @param {Object} expect expected value of test
  @param {String} message optional message
  @returns {Boolean} YES if passed
*/
notEqual = CoreTest.notEqual = function notEqual(actual, expect, message) {
  message = fmt('%@ should not be equal', message);
  return CoreTest.ok(actual !== expect, message, actual, expect);
};

/**
  Asserts the the actual value is the same as the expected value using a 
  deep comparison (CoreTest.equiv() if you must know).
  
  @param {Object} actual actual value of test
  @param {Object} expect expected value of test
  @param {String} msg optional message
  @returns {Boolean} YES if passed
*/
deepEqual = CoreTest.deepEqual = function deepEqual(actual, expect, msg) {
  message = fmt('%@ should be deepEqual', message);
  return CoreTest.ok(CoreTest.equiv(actual, expect), msg, actual, expect);
} ;
same = deepEqual; // QUnit compatibility 

/**
  Asserts the the actual value is NOT the same as the expected value using a 
  deep comparison (CoreTest.equiv() if you must know).
  
  @param {Object} actual actual value of test
  @param {Object} expect expected value of test
  @param {String} msg optional message
  @returns {Boolean} YES if passed
*/
deepNotEqual = function deepNotEqual(actual, expect, msg) {
  message = fmt('%@ should not be deepEqual', message);
  return CoreTest.ok(!CoreTest.equiv(actual,expect), msg, actual, expect);
} ;
CoreTest.deepNotEqual = deepNotEqual;



