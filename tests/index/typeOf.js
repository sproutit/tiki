// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals equal notEqual typeOf T_OBJECT T_FUNCTION T_UNDEFINED T_NULL T_BOOLEAN T_BOOL T_NUMBER T_STRING T_HASH T_CLASS T_ARRAY plan */

// NOTE: Expect 7 errors from JSLint. We are doing some bad things here on 
// purpose to test typeOf()

"import package core_test";
"import index";

module("typeOf");

// these work just like typeof
test("T_NULL", function() {
  equal(typeOf(null), T_NULL, 'null');
});

test("T_UNDEFINED", function() {
  equal(typeOf(undefined), T_UNDEFINED, 'undefined');
});

test("T_BOOL & T_BOOLEAN", function() {
  equal(typeOf(true), T_BOOLEAN, 'true');
  equal(typeOf(false), T_BOOLEAN, 'false');
  equal(T_BOOL, T_BOOLEAN, 'T_BOOL is alias for T_BOOLEAN');
});

test("T_NUMBER", function() {
  equal(typeOf(123), T_NUMBER, 'constant number');
  equal(typeOf(new Number(123)), T_NUMBER, 'created via constructor');
  equal(typeOf(NaN), T_NUMBER, 'NaN');
});

test("T_STRING", function() {
  equal(typeOf("foo"), T_STRING, "constant string");
  equal(typeOf(new String()), T_STRING, 'created via constructor');
});

test("T_HASH", function() {
  equal(typeOf({}), T_HASH, 'constant hash');
  equal(typeOf(new Object()), T_HASH, 'created via new Object()');
  
  var Subklass = function() { return this; };
  notEqual(typeOf(new Subklass()), T_HASH, 'using constructor other than object');
});

test("T_OBJECT", function() {

  // is an object if constructed from something other than object
  var Subklass = function() { return this; };
  equal(typeOf(new Subklass()), T_OBJECT, 'new Subklass()');
  
  // ANY object with isObject set to YES.
  equal(typeOf({ isObject: true }), T_OBJECT, '{ isObject: true }');
  
});

test("T_FUNCTION", function() {  
  equal(typeOf(function() {}), T_FUNCTION, 'constant');
  equal(typeOf(new Function()), T_FUNCTION, 'using constructor');
});

test("T_CLASS", function() {
  equal(typeOf({ isClass: true }), T_CLASS, 'anything marked isClass');
  
  var F = function() {};
  F.isClass = true;
  
  equal(typeOf(F), T_CLASS, 'function with isClass = true');
});

test("T_ARRAY", function() {
  equal(typeOf([]), T_ARRAY, 'real array');
  equal(typeOf(new Array()), T_ARRAY, 'created via constructor');
  equal(typeOf({ isArray: true, length: 2 }), T_ARRAY, 'array-like');
  equal(typeOf(arguments), T_ARRAY, 'arguments');
});

plan.run();
