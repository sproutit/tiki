// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

/*globals equal notEqual typeOf T_OBJECT T_FUNCTION T_UNDEFINED T_NULL T_BOOLEAN T_BOOL T_NUMBER T_STRING T_HASH T_CLASS T_ARRAY plan */

// NOTE: Expect 7 errors from JSLint. We are doing some bad things here on 
// purpose to test typeOf()

"import index";  // bring index symbols into main namespace

var Ct = require('core_test');

Ct.module("typeOf");

// these work just like typeof
Ct.test("T_NULL", function(t) {
  t.equal(typeOf(null), T_NULL, 'null');
});

Ct.test("T_UNDEFINED", function(t) {
  t.equal(typeOf(undefined), T_UNDEFINED, 'undefined');
});

Ct.test("T_BOOL & T_BOOLEAN", function(t) {
  t.equal(typeOf(true), T_BOOLEAN, 'true');
  t.equal(typeOf(false), T_BOOLEAN, 'false');
  t.equal(T_BOOL, T_BOOLEAN, 'T_BOOL is alias for T_BOOLEAN');
});

Ct.test("T_NUMBER", function(t) {
  t.equal(typeOf(123), T_NUMBER, 'constant number');
  t.equal(typeOf(new Number(123)), T_NUMBER, 'created via constructor');
  t.equal(typeOf(NaN), T_NUMBER, 'NaN');
});

Ct.test("T_STRING", function(t) {
  t.equal(typeOf("foo"), T_STRING, "constant string");
  t.equal(typeOf(new String()), T_STRING, 'created via constructor');
});

Ct.test("T_HASH", function(t) {
  t.equal(typeOf({}), T_HASH, 'constant hash');
  t.equal(typeOf(new Object()), T_HASH, 'created via new Object()');
  
  var Subklass = function() { return this; };
  t.notEqual(typeOf(new Subklass()), T_HASH, 'using constructor other than object');
});

Ct.test("T_OBJECT", function(t) {

  // is an object if constructed from something other than object
  var Subklass = function() { return this; };
  t.equal(typeOf(new Subklass()), T_OBJECT, 'new Subklass()');
  
  // ANY object with isObject set to YES.
  t.equal(typeOf({ isObject: true }), T_OBJECT, '{ isObject: true }');
  
});

Ct.test("T_FUNCTION", function(t) {  
  t.equal(typeOf(function() {}), T_FUNCTION, 'constant');
  t.equal(typeOf(new Function()), T_FUNCTION, 'using constructor');
});

Ct.test("T_CLASS", function(t) {
  t.equal(typeOf({ isClass: true }), T_CLASS, 'anything marked isClass');
  
  var F = function() {};
  F.isClass = true;
  
  t.equal(typeOf(F), T_CLASS, 'function with isClass = true');
});

Ct.test("T_ARRAY", function(t) {
  t.equal(typeOf([]), T_ARRAY, 'real array');
  t.equal(typeOf(new Array()), T_ARRAY, 'created via constructor');
  t.equal(typeOf({ isArray: true, length: 2 }), T_ARRAY, 'array-like');
  t.equal(typeOf(arguments), T_ARRAY, 'arguments');
});

Ct.run();
