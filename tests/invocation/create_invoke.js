// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

"import package core_test";

var Invocation = require('invocation');
var obj, inv;

// ..........................................................
// invoke with no arguments
// 

module("Invocation.create([target], func|methodName)");

setup(function() { 
  obj = {
    cnt: 0,
    handler: function() { this.cnt++; }
  } ;
  inv = null;
});

teardown(function() { 
  obj = null;
  inv.release();
});

test("invoke(func)", function() {
  var cnt = 0;
  inv = Invocation.create(function() { cnt++; });
  inv.invoke();
  equal(cnt, 1, 'should have invoked once');
});

test("invoke(target, func)", function() {
  inv = Invocation.create(obj, obj.handler);
  inv.invoke();
  equal(obj.cnt, 1, 'should have invoked once');
});

test("invoke(target, methodName)", function() {
  inv = Invocation.create(obj, obj.handler);
  inv.invoke();
  equal(obj.cnt, 1, 'should have invoked once');
});

// ..........................................................
// Invoke with arguments
// 

module('Invocation.create(target, method, args, [ignore, [extra]])');

setup(function() {
  obj = {
    cnt: 0,
    handler: function(amt, extra) { this.cnt += (amt+(extra||0)); }
  };
});

teardown(function() { 
  obj = null;
  inv.release();
});

test("invoke(target, func, args)", function() {
  inv = Invocation.create(obj, obj.handler, [10]);
  inv.invoke();
  equal(obj.cnt, 10, 'should have invoked once with argument');
});

test("invoke(target, func, args, ignore)", function() {
  inv = Invocation.create(obj, obj.handler, [10, 20], 1);
  inv.invoke();
  equal(obj.cnt, 20, 'should have invoked once with argument');
});

// ..........................................................
// Verify use of pool
// 

module('Invocation.create() should use pool');
setup(function() {
   obj = { handler: function() {} };
});

test("gets a new object if pool empty", function() {
  var i1 = Invocation.create(obj, obj.handler);
  var i2 = Invocation.create(obj, obj.handler);
  notEqual(i1, i2, 'new create should not be equal');
});

test("reuses from pool if possible", function() {
  
  var i1 = Invocation.create(obj, obj.handler);
  var i1_recycled = i1.recycled;
  i1.release(); // should return to pool
  equal(i1.isDestroyed, true, 'invocation should be destroyed');
  
  var i2 = Invocation.create(obj, obj.handler);
  equal(i1, i2, 'should return same instance from pool');
  equal(i2.recycled, i1_recycled+1, 'recycled cound should increment');
  equal(i2.retainCount, 1, 'retainCount should reset to 1');
});

plan.run();
