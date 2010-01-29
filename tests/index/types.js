// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

Ct.module("tiki exported types");

Ct.test("T_FOO types", function(t) {
  t.equal(!!tiki.T_ERROR, true, 'should defined T_ERROR');
  t.equal(!!tiki.T_OBJECT, true, 'should defined T_OBJECT');
  t.equal(!!tiki.T_NULL, true, 'should defined T_NULL');
  t.equal(!!tiki.T_CLASS, true, 'should defined T_CLASS');
  t.equal(!!tiki.T_HASH, true, 'should defined T_HASH');
  t.equal(!!tiki.T_FUNCTION, true, 'should defined T_FUNCTION');
  t.equal(!!tiki.T_UNDEFINED, true, 'should defined T_UNDEFINED');
  t.equal(!!tiki.T_NUMBER, true, 'should defined T_NUMBER');
  t.equal(!!tiki.T_BOOL, true, 'should defined T_BOOL');
  t.equal(!!tiki.T_ARRAY, true, 'should defined T_ARRAY');
  t.equal(!!tiki.T_STRING, true, 'should defined T_STRING');
  t.equal(!!tiki.T_BOOLEAN, true, 'should defined T_BOOLEAN');
});

Ct.test("YES and NO", function(t) {
  t.equal(tiki.YES, true, 'should define tiki.YES == true');
  t.equal(tiki.NO, false, 'should defined tiki.NO == false');
});

Ct.run();