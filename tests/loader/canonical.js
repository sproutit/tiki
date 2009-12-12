// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals core equal plan Loader setup teardown equal plan */

"import package core_test";

var loader ;

console.log('RUNNING!');

module("Loader.canonical");

setup(function() {
  loader = new Loader('test');
  loader.register('app', {});
  loader.module('app:core', function() {});
  loader.module('app:system', function() {});
  loader.module('app:index', function() {});
  
  loader.register('sproutcore/runtime', {});
  loader.module('sproutcore/runtime:index', function() {});
  
  loader.register('tiki/system', {});
  loader.module('tiki/system:index', function(){});
  loader.module('tiki/system:core', function() {});
  
  loader.register('no_package', {});
  loader.register('no_package:core', function() {});
});

teardown(function() {
  loader.destroy();
  loader = null ;
});

// ..........................................................
// BASIC TESTS
// 

test("fully qualified id - known IDs", function() {
  
  console.log('RUN');
  
  equal(loader.canonical('app:core'), 'app:core', 
    'canonical(app:code) should return same id');
    
  equal(loader.canonical('tiki/system:index', 'app:code'), 
    'tiki/system:index', 
    'canonical(tiki/system:index, app:code) should return same id');
});

test("tiki fallbacks", function() {
    equal(loader.canonical('system:index', 'app:code'), 
      'tiki/system:index',
      'canonical(system:index) should map to tiki/system package since no global system package exists');
      
    equal(loader.canonical('foo:index', 'app:code'), 
      'foo:index', 
      'canonical(foo:index) should NOT map to tiki/foo since there is no tiki/foo');
      
    loader.register('tiki/app', {});
    loader.module('tiki/app:core', function() {});

    equal(loader.canonical('app:code', 'sproutcore/runtime:index'),
      'app:code',
      'canonical(app:index) should map to app since it exists');
});

test("package ids", function() {
  equals(loader.canonical('sproutcore/runtime', 'app:core'), 
    'sproutcore/runtime:index',
    'canonical(sproutcore/runtime) should return package module');
    
  equals(loader.canonical('system', 'sproutcore/runtime'), 
    'tiki/system:index',
    'canonical(system, sproutcore/runtime) should return tiki/system package since system does not exist in runtime or as a package');
    
  equals(loader.canonical('system', 'app:core'), 'app:system',
    'canonical(system, app:core) should return system module since it exists in the app package');
    
  equals(loader.canonical('no_package', 'app:core'), 'no_package:index',
    'canonical(no_package, app:core) should return non-existant package module since nothing else exists and this may be loaded');
});


// ..........................................................
// ADD SPECIAL CASES HERE
// 

plan.run();
