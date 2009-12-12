// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals utils plan equal */

"import package core_test";
"import utils as utils";

var YES = utils.YES, NO = utils.NO ;

module("isArray");

test("basic types", function() {
  equal(utils.isArray([]), YES, 'isArray([])');
  equal(utils.isArray(null), NO, 'isArray(null)');
  equal(utils.isArray(undefined), NO, 'isArray(undefined)');
  equal(utils.isArray(23), NO, 'isArray(23)');
  equal(utils.isArray('str'), NO, 'isArray("str")');
  equal(utils.isArray({}), NO, 'isArray({})');
  equal(utils.isArray(function() {}), NO, 'isArray(Function)');
});

test("array-like objects", function() {
  equal(utils.isArray({ isArray: YES }), YES, 'isArray({ isArray: YES })');
  equal(utils.isArray(arguments), YES, 'isArray(arguments)');
});

plan.run();
 