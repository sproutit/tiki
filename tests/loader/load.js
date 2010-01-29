// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');
var Loader = require('loader');

var loader, factoryFunc, factoryStr, packageFunc ;

Ct.module("Loader.load");

Ct.setup(function() {
  loader = new Loader('test');
  loader.register('app', {});
  
  factoryFunc = function() {};
  loader.module('app:func', factoryFunc);
  
  factoryStr = "return 'Hello World!';";
  loader.module('app:str', factoryStr);
  
  packageFunc = function() {};
  loader.module('app:index', packageFunc);
});

Ct.teardown(function() {
  loader.destroy();
  loader = null ;
});

// ..........................................................
// BASIC TESTS
// 

Ct.test("loading a basic factory", function(t) {
  var func = loader.load('app:func');
  t.equal(func, factoryFunc, 'load(app:func) should return factory function');
  
  var func2 = loader.load('app:func');
  t.equal(func2, func, 'each call should return same factory');
});

Ct.test("loading a string based factory", function(t) {
  var fn = loader.load('app:str');
  t.ok(typeof fn, 'function', 
    'returned value should be a factory function - actual: '+(typeof fn));
  t.equal(fn(), 'Hello World!', 'invoking function should execute string');
  
  var fn2 = loader.load('app:str');
  t.equal(fn2, fn, 'each call should return same factory');
});

Ct.test("loading an unknown module", function(t) {
  t.throws(function() {
    loader.load('unknown:module');
  }, 'load(unknown:module)');
});

Ct.test("loading a package name", function(t) {
  var fn = loader.load('app');
  t.equal(fn, packageFunc, 'should return factory for package');
});

// ..........................................................
// ADD SPECIAL CASES HERE
// 

Ct.run();
