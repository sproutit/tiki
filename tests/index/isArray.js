// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals plan equal */

"import package core_test";

var YES = tiki.YES, NO = tiki.NO ;

module("isArray");

test("basic types", function() {
  equal(tiki.isArray([]), YES, 'isArray([])');
  equal(tiki.isArray(null), NO, 'isArray(null)');
  equal(tiki.isArray(undefined), NO, 'isArray(undefined)');
  equal(tiki.isArray(23), NO, 'isArray(23)');
  equal(tiki.isArray('str'), NO, 'isArray("str")');
  equal(tiki.isArray({}), NO, 'isArray({})');
  equal(tiki.isArray(function() {}), NO, 'isArray(Function)');
});

test("array-like objects", function() {
  equal(tiki.isArray({ isArray: YES }), YES, 'isArray({ isArray: YES })');
  equal(tiki.isArray(arguments), YES, 'isArray(arguments)');
});

plan.run();
 