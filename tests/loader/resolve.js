// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals core equal plan MODULE setup teardown equal plan raises */

"import package core_test";
"import loader as MODULE";

var loader ;

module("Loader.resolve");

setup(function() {
  loader = new MODULE.Loader('test');
});

teardown(function() {
  loader.destroy();
  loader = null ;
});

// ..........................................................
// BASIC TESTS
// 

test("resolving a fully qualified id", function() {
  equal(loader.resolve('foo:bar'), 'foo:bar', 'resolve(foo:bar) should return same id');
  equal(loader.resolve('foo:bar', 'baz:biff'), 'foo:bar', 'resolve(foo:bar, baz:biff) should return same id');
});

test("resolving absolute module name", function() {
  equal(loader.resolve('foo'), 'foo', 
    'resolve(foo) [no baseId] should return foo');
  
  equal(loader.resolve('foo/bar', 'baz:biff/bar'), 'foo/bar', 
    'resolve(foo/bar, biff/bar) should remap to baz packageId');
});

test("resolving relative paths", function() {

  equal(loader.resolve('./foo/bar', 'baz:biff/bar'), 'baz:biff/foo/bar',
    'resolve(./foo/bar, baz:biff/bar) should start with biff');
    
  equal(loader.resolve('../foo/bar', 'baz:biff/bar'), 'baz:foo/bar',
    'resolve(../foo/bar, baz:biff/bar) should drop biff & bar');
    
  equal(loader.resolve('./foo/../bar', 'baz:biff/bar'), 'baz:biff/bar',
    'resolve(./foo/../bar) should drop foo from path');
  
  equal(loader.resolve('./foo/../bar/../baz/biff/../../bill', 'baz:biff/bar'),
    'baz:biff/bill', 'resolve(./foo/../bar/../baz/biff/../../bill)');
});  

test("invalid relative paths", function() {
  raises(function() { loader.resolve('./foo/bar'); }, true, 
    'trying to resolve a relative path without a baseId');

  raises(function() { loader.resolve('../../foo/bar', 'baz:biff/bar'); },
    true, 'trying to go up beyond top level of package');
});


// ..........................................................
// ADD SPECIAL CASES HERE
// 

plan.run();
