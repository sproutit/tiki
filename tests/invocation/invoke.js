// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

var Invocation = require('invocation');
var obj;

// ..........................................................
// invoke with no arguments
// 

Ct.module("Invocation.invoke([target], func|methodName)");

Ct.setup(function() { 
  obj = {
    cnt: 0,
    handler: function() { this.cnt++; }
  } ;
});

Ct.teardown(function() { 
  obj = null;
});

Ct.test("invoke(func)", function(t) {
  var cnt = 0;
  Invocation.invoke(function() { cnt++; });
  t.equal(cnt, 1, 'should have invoked once');
});

Ct.test("invoke(target, func)", function(t) {
  Invocation.invoke(obj, obj.handler);
  t.equal(obj.cnt, 1, 'should have invoked once');
});

Ct.test("invoke(target, methodName)", function(t) {
  Invocation.invoke(obj, obj.handler);
  t.equal(obj.cnt, 1, 'should have invoked once');
});

// ..........................................................
// Invoke with arguments
// 

Ct.module('Invocation.invoke(target, method, args, [ignore, [extra]])');

Ct.setup(function() {
  obj = {
    cnt: 0,
    handler: function(amt, extra) { this.cnt += (amt+(extra||0)); }
  };
});

Ct.teardown(function() { obj = null; });

Ct.test("invoke(target, func, args)", function(t) {
  Invocation.invoke(obj, obj.handler, [10]);
  t.equal(obj.cnt, 10, 'should have invoked once with argument');
});

Ct.test("invoke(target, func, args, ignore)", function(t) {
  Invocation.invoke(obj, obj.handler, [10, 20], 1);
  t.equal(obj.cnt, 20, 'should have invoked once with argument');
});

Ct.test("invoke(target, func, args, ignore, extra)", function(t) {
  Invocation.invoke(obj, obj.handler, [10, 20], 1, [30]);
  t.equal(obj.cnt, 50, 'should have invoked once with argument and extra');
});

Ct.run();
