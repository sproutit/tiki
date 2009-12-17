// ========================================================================
// utils.mixin Tests
// ========================================================================
/*globals utils notEqual equal raises plan setup teardown */

"import package core_test";
"import utils as utils";

var a, b, c ;

module("utils.mixin()");

setup(function() {
  a = { foo: 'a', bar: 'a', baz: 'a' };
  b = { foo: 'b' };
  c = { bar: 'c' };
});

test("mixin(a,b) [passing one extra hash]", function() {
  utils.mixin(a, b);
  equal(a.foo, b.foo, 'should copy b property onto a');
  equal(a.bar, 'a', 'should not overwrite properties not defined on b');
});

test("mixin(a,b,c) [passing multiple hashes]", function() {
  utils.mixin(a, b, c);
  equal(a.foo, b.foo, 'should copy b property onto a');
  equal(a.bar, c.bar, 'should copy c property onto a also');
});

test("mixin(a, null, b) [passing null]", function() {
  utils.mixin(a, null, b);
  equal(a.foo, b.foo, 'should copy b property onto a');
  equal(a.bar, 'a', 'should not overwrite properties not defined on b');
});

test("mixin(a) [passing no hashes]", function() {
  utils.mixin(a);
  equal(a.foo, 'a', 'should not change anything');
});

// ..........................................................
// SPECIAL CASES
// 

plan.run();