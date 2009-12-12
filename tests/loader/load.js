// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals core equal plan Loader setup teardown equal plan */

"import core_test tiki shouldThrow";

var loader, factoryFunc, factoryStr, packageFunc ;

module("Loader.canonical");

setup(function() {
  loader = new Loader('test');
  loader.register('app', {});
  
  factoryFunc = function() {};
  loader.module('app:func', factoryFunc);
  
  factoryStr = "return 'Hello World!';";
  loader.module('app:str', factoryStr);
  
  packageFunc = function() {};
  loader.module('app:index', packageFunc);
});

teardown(function() {
  loader.destroy();
  loader = null ;
});

// ..........................................................
// BASIC TESTS
// 

test("loading a basic factory", function() {
  var func = loader.load('app:func');
  equal(func, factoryFunc, 'load(app:func) should return factory function');
  
  var func2 = loader.load('app:func');
  equals(func2, func, 'each call should return same factory');
});

test("loading a string based factory", function() {
  var fn = loader.load('app:str');
  ok(typeof fn, 'function', 
    'returned value should be a factory function - actual: '+(typeof fn));
  equal(fn(), 'Hello World!', 'invoking function should execute string');
  
  var fn2 = loader.load('app:str');
  equals(fn2, fn, 'each call should return same factory');
});

test("loading an unknown module", function() {
  shouldThrow(function() {
    loader.load('unknown:module');
  }, true, 'load(unknown:module)');
});

test("loading a package name", function() {
  var fn = loader.load('app');
  equal(fn, packageFunc, 'should return factory for package');
});

// ..........................................................
// ADD SPECIAL CASES HERE
// 

plan.run();
