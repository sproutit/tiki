// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*globals setup */

var Ct = require('core_test');

var a, b, c ;

Ct.module("tiki.mixin()");

Ct.setup(function() {
  a = { foo: 'a', bar: 'a', baz: 'a' };
  b = { foo: 'b' };
  c = { bar: 'c' };
});

Ct.test("mixin(a,b) [passing one extra hash]", function(t) {
  tiki.mixin(a, b);
  t.equal(a.foo, b.foo, 'should copy b property onto a');
  t.equal(a.bar, 'a', 'should not overwrite properties not defined on b');
});

Ct.test("mixin(a,b,c) [passing multiple hashes]", function(t) {
  tiki.mixin(a, b, c);
  t.equal(a.foo, b.foo, 'should copy b property onto a');
  t.equal(a.bar, c.bar, 'should copy c property onto a also');
});

Ct.test("mixin(a, null, b) [passing null]", function(t) {
  tiki.mixin(a, null, b);
  t.equal(a.foo, b.foo, 'should copy b property onto a');
  t.equal(a.bar, 'a', 'should not overwrite properties not defined on b');
});

Ct.test("mixin(a) [passing no hashes]", function(t) {
  tiki.mixin(a);
  t.equal(a.foo, 'a', 'should not change anything');
});

// ..........................................................
// SPECIAL CASES
// 

Ct.run();