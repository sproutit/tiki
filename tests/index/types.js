// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

"import package core_test";

module("tiki exported types");

test("T_FOO types", function() {
  equal(!!tiki.T_ERROR, true, 'should defined T_ERROR');
  equal(!!tiki.T_OBJECT, true, 'should defined T_OBJECT');
  equal(!!tiki.T_NULL, true, 'should defined T_NULL');
  equal(!!tiki.T_CLASS, true, 'should defined T_CLASS');
  equal(!!tiki.T_HASH, true, 'should defined T_HASH');
  equal(!!tiki.T_FUNCTION, true, 'should defined T_FUNCTION');
  equal(!!tiki.T_UNDEFINED, true, 'should defined T_UNDEFINED');
  equal(!!tiki.T_NUMBER, true, 'should defined T_NUMBER');
  equal(!!tiki.T_BOOL, true, 'should defined T_BOOL');
  equal(!!tiki.T_ARRAY, true, 'should defined T_ARRAY');
  equal(!!tiki.T_STRING, true, 'should defined T_STRING');
  equal(!!tiki.T_BOOLEAN, true, 'should defined T_BOOLEAN');
});

test("YES and NO", function() {
  equal(tiki.YES, true, 'should define tiki.YES == true');
  equal(tiki.NO, false, 'should defined tiki.NO == false');
});

plan.run();