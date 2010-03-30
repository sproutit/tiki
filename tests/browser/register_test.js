// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('tiki:tiki'),
    Ct   = require('core_test:sync');
    
Ct.module('Browser.register');

Ct.setup(function(t) {
  t.browser = tiki.Browser.start();
});

Ct.teardown(function(t) {
  delete t.browser;
});

Ct.test('basic package', function(t) {
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1"
  });

  t.equal(t.browser.loader.canonicalPackageId('foo'), '::foo/1.2.1');
  var pkg = t.browser.require.packageFor('foo');
  t.ok(pkg, 'should get a package');
  t.equal(pkg.get('name'), 'foo', 'pkg.name');
  t.equal(pkg.get('version'), '1.2.1', 'pkg.version');
});

Ct.test('adds :: to canonical packageId', function(t) {
  t.browser.register('foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1"
  });

  t.equal(t.browser.loader.canonicalPackageId('foo'), '::foo/1.2.1');
});

Ct.test('Non-existant package', function(t) {
  var pkg = t.browser.require.packageFor('fibber');
  t.equal(pkg, null, 'should not return the package');
  
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1"
  });

  pkg = t.browser.require.packageFor('foo');
  t.ok(pkg, 'should get a package');
  
});

Ct.test('registering same package more than once - no externals', function(t){

  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "iteration": 1
  });
  
  // once a real package is registered, we shouldn't override it because we 
  // might have already instantiated from it
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "iteration": 2
  });
  
  var pkg = t.browser.require.packageFor('foo');
  t.ok(pkg, 'should return package');
  t.equal(pkg.get('iteration'), 1, 'should return first iteration still');
  
});

Ct.test('registering multiple versions of a package', function(t) {

  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1"
  });
  
  // once a real package is registered, we shouldn't override it because we 
  // might have already instantiated from it
  t.browser.register('::foo/2.0.1', {
    "name": "foo",
    "version": "2.0.1"
  });
  
  var pkg = t.browser.require.packageFor('foo');
  t.ok(pkg, 'should return package');
  t.equal(pkg.get('version'), '2.0.1', 'should return latest');

  pkg = t.browser.require.packageFor('foo', '~1');
  t.ok(pkg, 'should return package');
  t.equal(pkg.get('version'), '1.2.1', 'should return latest');
  
});

Ct.test('tiki:external', function(t) {
  
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "tiki:external": true,
    "iteration": 1
  });
  
  // should not be able to get a pkg yet but we can find the canonicalId
  t.equal(t.browser.require.packageFor('foo'), null, 'no pkg found');
  t.equal(t.browser.loader.canonicalPackageId('foo'), '::foo/1.2.1', 'canonicalId');
  
  // registering again with another external should replace the old one but
  // still not be instantiatable
  t.browser.register('foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "tiki:external": true,
    "iteration": 2
  });
  
  t.equal(t.browser.require.packageFor('foo'), null, 'no pkg found');
  t.equal(t.browser.loader.canonicalPackageId('foo'), '::foo/1.2.1', 'canonicalId');
  t.equal(t.browser.packageInfoById['::foo/1.2.1'].iteration, 2, 'iter');
  
  // registering a real package should override external
  t.browser.register('foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "iteration": 3
  });
  t.ok(t.browser.require.packageFor('foo'), null, 'should get pkg');
  t.equal(t.browser.loader.canonicalPackageId('foo'), '::foo/1.2.1', 'canonicalId');
  t.equal(t.browser.packageInfoById['::foo/1.2.1'].iteration, 3, 'iter');

  // registering external after real one should NOT override
  t.browser.register('foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "tiki:external": true,
    "iteration": 4
  });
  t.equal(t.browser.packageInfoById['::foo/1.2.1'].iteration, 3, 'iter');
  
});

Ct.test('tiki:private', function(t) {

  var pkg, fooPkg;
  
  t.browser.register('::foo/private/1.2.1', {
    "name": "private",
    "version": "1.2.1",
    "tiki:private": true,
    "isReallyPrivate": true // just for testing
  });

  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    
    "tiki:nested": {
      "private": "::foo/private/1.2.1"
    }
  });
  
  // should not be able to lookup pkg generally
  pkg = t.browser.require.packageFor('private');
  t.equal(pkg, null, 'should not find private pkg');
  
  // should find non-private (with same version) if also added
  t.browser.register('::private/1.2.0', {
    "name": "private",
    "version": "1.2.0",
    "isReallyPrivate": false // just for testing 
  });
  
  pkg = t.browser.require.packageFor('private');
  t.ok(pkg, 'should get a pkg now');
  t.equal(pkg.get('isReallyPrivate'), false, 'pkg.isReallyPrivate');

  // let's pretend that later we load a new package.  
  t.browser.register('::private/1.3.0', {
    "name": "private",
    "version": "1.3.0" 
  });

  pkg = t.browser.require.packageFor('private', '1.2.5');
  t.ok(pkg, 'should get a pkg now');
  t.equal(pkg.get('version'), '1.3.0', 'pkg.version');

  
  // should find private version when using owner with nested...
  fooPkg = t.browser.require.packageFor('foo');
  t.ok(fooPkg, 'PRECOND - should get foo pkg');
  
  pkg = t.browser.sandbox.packageFor('private', fooPkg);
  t.ok(pkg, 'should get a pkg now');
  t.equal(pkg.get('isReallyPrivate'), true, 'pkg.isReallyPrivate');
  
  // passing an incompatible version should return null even if non-private
  // version is available 
  pkg = t.browser.require.packageFor('private', '~1.2.5');
  t.ok(pkg, 'Public search should return a pkg');

  t.throws(function() {
    pkg = t.browser.sandbox.packageFor('private', '~1.2.5', fooPkg);
  }, 'should throw an exception here since asking for an incompatible version probably means you screwed up your freezing');
  
});

Ct.test('tiki:resources', function(t) {
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    
    "tiki:base": "/bar/url",
    "tiki:resources": [
      "javascript.js",
      "styles21.css",
      { "name": "image.css", "type": "resource" },
      
      { "id": "fibber/mcgee", 
        "name": "fibber.gif", 
        "url": "http://cdn.sprout.io/fibber/mcgee"
      },
      
      { "id": "::foo/1.2.1:fibber/mcgee2",
        "name": "fibber.js",
        "type": "script",
        "url": "http://cdn.sprout.io/fibber/mcgee2"
      }
    ]
  });

  var normalized = [
    {
      "id": "::foo/1.2.1:javascript.js",
      "name": "javascript.js",
      "type": "script",
      "url":  "/bar/url/javascript.js"
    },
    
    {
      "id": "::foo/1.2.1:styles21.css",
      "name": "styles21.css",
      "type": "stylesheet",
      "url":  "/bar/url/styles21.css"
    },
    
    {
      "id": "::foo/1.2.1:image.css",
      "name": "image.css",
      "type": "resource",
      "url":  "/bar/url/image.css"
    },
    
    {
      "id": "::fibber/mcgee",
      "name": "fibber.gif",
      "type": "resource",
      "url": "http://cdn.sprout.io/fibber/mcgee"
    },
    
    {
      "id": "::foo/1.2.1:fibber/mcgee2",
      "name": "fibber.js",
      "type": "script",
      "url": "http://cdn.sprout.io/fibber/mcgee2"
    }
  ];
  
  var pkg = t.browser.require.packageFor('foo');
  t.deepEqual(pkg.get('tiki:resources'), normalized, 'resources');
  
});
Ct.run();


