// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');
var Loader = require('loader');
var loader ;

Ct.module("Loader.canonical");

Ct.setup(function() {
  
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

Ct.teardown(function() {
  loader.destroy();
  loader = null ;
}); 

// ..........................................................
// BASIC TESTS
// 

Ct.test("fully qualified id - known IDs", function(t) {
    
  t.equal(loader.canonical('app:core'), 'app:core', 
    'canonical(app:code) should return same id');
    
  t.equal(loader.canonical('tiki/system:index', 'app:code'), 
    'tiki/system:index', 
    'canonical(tiki/system:index, app:code) should return same id');
});

Ct.test("tiki fallbacks", function(t) {
    t.equal(loader.canonical('system:index', 'app:code'), 
      'tiki/system:index',
      'canonical(system:index) should map to tiki/system package since no global system package exists');
      
    t.equal(loader.canonical('foo:index', 'app:code'), 
      'foo:index', 
      'canonical(foo:index) should NOT map to tiki/foo since there is no tiki/foo');
      
    loader.register('tiki/app', {});
    loader.module('tiki/app:core', function() {});

    t.equal(loader.canonical('app:code', 'sproutcore/runtime:index'),
      'app:code',
      'canonical(app:index) should map to app since it exists');
});

Ct.test("package ids", function(t) {
  t.equal(loader.canonical('sproutcore/runtime', 'app:core'), 
    'sproutcore/runtime:index',
    'canonical(sproutcore/runtime) should return package module');
    
  t.equal(loader.canonical('system', 'sproutcore/runtime'), 
    'tiki/system:index',
    'canonical(system, sproutcore/runtime) should return tiki/system package since system does not exist in runtime or as a package');
    
  t.equal(loader.canonical('system', 'app:core'), 'app:system',
    'canonical(system, app:core) should return system module since it exists in the app package');
    
  t.equal(loader.canonical('no_package', 'app:core'), 'no_package:index',
    'canonical(no_package, app:core) should return non-existant package module since nothing else exists and this may be loaded');
});


// ..........................................................
// ADD SPECIAL CASES HERE
// 

Ct.run();
