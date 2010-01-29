// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

var YES = tiki.YES, NO = tiki.NO ;

Ct.module("isArray");

Ct.test("basic types", function(t) {
  t.equal(tiki.isArray([]), YES, 'isArray([])');
  t.equal(tiki.isArray(null), NO, 'isArray(null)');
  t.equal(tiki.isArray(undefined), NO, 'isArray(undefined)');
  t.equal(tiki.isArray(23), NO, 'isArray(23)');
  t.equal(tiki.isArray('str'), NO, 'isArray("str")');
  t.equal(tiki.isArray({}), NO, 'isArray({})');
  t.equal(tiki.isArray(function() {}), NO, 'isArray(Function)');
});

Ct.test("array-like objects", function(t) {
  t.equal(tiki.isArray({ isArray: YES }), YES, 'isArray({ isArray: YES })');
  t.equal(tiki.isArray(arguments), YES, 'isArray(arguments)');
});

Ct.run();
 