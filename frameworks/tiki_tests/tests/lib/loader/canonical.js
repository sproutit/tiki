// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals core equal plan Loader setup teardown equal plan */

"import core_test tiki";

var loader ;

module("Loader.canonical");

setup(function() {
  loader = new Loader('test');
  loader.register('app', {});
  loader.module('app:core', function() {});
  loader.module('app:system', function() {});
  loader.module('app:package', function() {});
  
  loader.register('sproutcore/runtime', {});
  loader.module('sproutcore/runtime:package', function() {});
  
  loader.register('tiki/system', {});
  loader.module('tiki/system:package', function(){});
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
  
  equal(loader.canonical('app:core'), 'app:core', 
    'canonical(app:code) should return same id');
    
  equal(loader.canonical('tiki/system:package', 'app:code'), 
    'tiki/system:package', 
    'canonical(tiki/system:package, app:code) should return same id');
});

test("tiki fallbacks", function() {
    equal(loader.canonical('system:package', 'app:code'), 
      'tiki/system:package',
      'canonical(system:package) should map to tiki/system package since no global system package exists');
      
    equal(loader.canonical('foo:package', 'app:code'), 
      'foo:package', 
      'canonical(foo:package) should NOT map to tiki/foo since there is no tiki/foo');
      
    loader.register('tiki/app', {});
    loader.module('tiki/app:core', function() {});

    equal(loader.canonical('app:code', 'sproutcore/runtime:package'),
      'app:code',
      'canonical(app:package) should map to app since it exists');
});

test("package ids", function() {
  equals(loader.canonical('sproutcore/runtime', 'app:core'), 
    'sproutcore/runtime:package',
    'canonical(sproutcore/runtime) should return package module');
    
  equals(loader.canonical('system', 'sproutcore/runtime'), 
    'tiki/system:package',
    'canonical(system, sproutcore/runtime) should return tiki/system package since system does not exist in runtime or as a package');
    
  equals(loader.canonical('system', 'app:core'), 'app:system',
    'canonical(system, app:core) should return system module since it exists in the app package');
    
  equals(loader.canonical('no_package', 'app:core'), 'no_package:package',
    'canonical(no_package, app:core) should return non-existant package module since nothing else exists and this may be loaded');
});


// ..........................................................
// ADD SPECIAL CASES HERE
// 

plan.run();
