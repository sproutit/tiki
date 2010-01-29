// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

var Invocation = require('invocation');
var obj, inv;

// ..........................................................
// invoke with no arguments
// 

Ct.module("Invocation.create([target], func|methodName)");

Ct.setup(function() { 
  obj = {
    cnt: 0,
    handler: function() { this.cnt++; }
  } ;
  inv = null;
});

Ct.teardown(function() { 
  obj = null;
  inv.release();
});

Ct.test("invoke(func)", function(t) {
  var cnt = 0;
  inv = Invocation.create(function() { cnt++; });
  inv.invoke();
  t.equal(cnt, 1, 'should have invoked once');
});

Ct.test("invoke(target, func)", function(t) {
  inv = Invocation.create(obj, obj.handler);
  inv.invoke();
  t.equal(obj.cnt, 1, 'should have invoked once');
});

Ct.test("invoke(target, methodName)", function(t) {
  inv = Invocation.create(obj, obj.handler);
  inv.invoke();
  t.equal(obj.cnt, 1, 'should have invoked once');
});

// ..........................................................
// Invoke with arguments
// 

Ct.module('Invocation.create(target, method, args, [ignore, [extra]])');

Ct.setup(function() {
  obj = {
    cnt: 0,
    handler: function(amt, extra) { this.cnt += (amt+(extra||0)); }
  };
});

Ct.teardown(function() { 
  obj = null;
  inv.release();
});

Ct.test("invoke(target, func, args)", function(t) {
  inv = Invocation.create(obj, obj.handler, [10]);
  inv.invoke();
  t.equal(obj.cnt, 10, 'should have invoked once with argument');
});

Ct.test("invoke(target, func, args, ignore)", function(t) {
  inv = Invocation.create(obj, obj.handler, [10, 20], 1);
  inv.invoke();
  t.equal(obj.cnt, 20, 'should have invoked once with argument');
});

// ..........................................................
// Verify use of pool
// 

Ct.module('Invocation.create() should use pool');
Ct.setup(function() {
   obj = { handler: function() {} };
});

Ct.test("gets a new object if pool empty", function(t) {
  var i1 = Invocation.create(obj, obj.handler);
  var i2 = Invocation.create(obj, obj.handler);
  t.notEqual(i1, i2, 'new create should not be equal');
});

Ct.test("reuses from pool if possible", function(t) {
  
  var i1 = Invocation.create(obj, obj.handler);
  var i1_recycled = i1.recycled;
  i1.release(); // should return to pool
  t.equal(i1.isDestroyed, true, 'invocation should be destroyed');
  
  var i2 = Invocation.create(obj, obj.handler);
  t.equal(i1, i2, 'should return same instance from pool');
  t.equal(i2.recycled, i1_recycled+1, 'recycled cound should increment');
  t.equal(i2.retainCount, 1, 'retainCount should reset to 1');
});

Ct.run();
