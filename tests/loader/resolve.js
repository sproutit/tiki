// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*global MODULE */

"import loader as MODULE";

var Ct = require('core_test');
var loader ;

Ct.module("Loader.resolve");

Ct.setup(function() { 
  loader = new MODULE.Loader('test');
});

Ct.teardown(function() {
  loader.destroy();
  loader = null ;
});

// ..........................................................
// BASIC TESTS
// 

Ct.test("resolving a fully qualified id", function(t) {
  t.equal(loader.resolve('foo:bar'), 'foo:bar', 'resolve(foo:bar) should return same id');
  t.equal(loader.resolve('foo:bar', 'baz:biff'), 'foo:bar', 'resolve(foo:bar, baz:biff) should return same id');
});

Ct.test("resolving absolute module name", function(t) {
  t.equal(loader.resolve('foo'), 'foo', 
    'resolve(foo) [no baseId] should return foo');
  
  t.equal(loader.resolve('foo/bar', 'baz:biff/bar'), 'foo/bar', 
    'resolve(foo/bar, biff/bar) should remap to baz packageId');
});

Ct.test("resolving relative paths", function(t) {

  t.equal(loader.resolve('./foo/bar', 'baz:biff/bar'), 'baz:biff/foo/bar',
    'resolve(./foo/bar, baz:biff/bar) should start with biff');
    
  t.equal(loader.resolve('../foo/bar', 'baz:biff/bar'), 'baz:foo/bar',
    'resolve(../foo/bar, baz:biff/bar) should drop biff & bar');
    
  t.equal(loader.resolve('./foo/../bar', 'baz:biff/bar'), 'baz:biff/bar',
    'resolve(./foo/../bar) should drop foo from path');
  
  t.equal(loader.resolve('./foo/../bar/../baz/biff/../../bill', 'baz:biff/bar'),
    'baz:biff/bill', 'resolve(./foo/../bar/../baz/biff/../../bill)');
});  

Ct.test("invalid relative paths", function(t) {
  t.throws(function() { loader.resolve('./foo/bar'); }, 
    'trying to resolve a relative path without a baseId');

  t.throws(function() { loader.resolve('../../foo/bar', 'baz:biff/bar'); }, 'trying to go up beyond top level of package');
});


// ..........................................................
// ADD SPECIAL CASES HERE
// 

Ct.run();
