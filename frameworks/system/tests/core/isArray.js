// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals test equal notEqual ok plan */
/*globals isArray */

"import core_test:package";
"import tiki:core";

module("isArray");

test("basic types", function() {
  equal(isArray([]), YES, 'isArray([])');
  equal(isArray(null), NO, 'isArray(null)');
  equal(isArray(undefined), NO, 'isArray(undefined)');
  equal(isArray(23), NO, 'isArray(23)');
  equal(isArray('str'), NO, 'isArray("str")');
  equal(isArray({}), NO, 'isArray({})');
  equal(isArray(function() {}), NO, 'isArray(Function)');
});

test("array-like objects", function() {
  equal(isArray({ isArray: YES }), YES, 'isArray({ isArray: YES })');
  equal(isArray(arguments), YES, 'isArray(arguments)');
});

plan.run();
 