// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

"import package core_test";

var Invocation = require('invocation');
var obj;

// ..........................................................
// invoke with no arguments
// 

module("Invocation.invoke([target], func|methodName)");

setup(function() { 
  obj = {
    cnt: 0,
    handler: function() { this.cnt++; }
  } ;
});

teardown(function() { 
  obj = null;
});

test("invoke(func)", function() {
  var cnt = 0;
  Invocation.invoke(function() { cnt++; });
  equal(cnt, 1, 'should have invoked once');
});

test("invoke(target, func)", function() {
  Invocation.invoke(obj, obj.handler);
  equal(obj.cnt, 1, 'should have invoked once');
});

test("invoke(target, methodName)", function() {
  Invocation.invoke(obj, obj.handler);
  equal(obj.cnt, 1, 'should have invoked once');
});

// ..........................................................
// Invoke with arguments
// 

module('Invocation.invoke(target, method, args, [ignore, [extra]])');

setup(function() {
  obj = {
    cnt: 0,
    handler: function(amt, extra) { this.cnt += (amt+(extra||0)); }
  };
});

teardown(function() { obj = null; });

test("invoke(target, func, args)", function() {
  Invocation.invoke(obj, obj.handler, [10]);
  equal(obj.cnt, 10, 'should have invoked once with argument');
});

test("invoke(target, func, args, ignore)", function() {
  Invocation.invoke(obj, obj.handler, [10, 20], 1);
  equal(obj.cnt, 20, 'should have invoked once with argument');
});

test("invoke(target, func, args, ignore, extra)", function() {
  Invocation.invoke(obj, obj.handler, [10, 20], 1, [30]);
  equal(obj.cnt, 50, 'should have invoked once with argument and extra');
});

plan.run();
