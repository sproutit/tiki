// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('tiki:core'),
    Ct   = require('core_test'),

    mocks = require('../../mocks'),
    MockPackage = mocks.MockPackage, 
    MockSource = mocks.MockSource;
    
Ct.module('Loader#load');

Ct.setup(function(t, done) {
  
  t.fooPkg = new MockPackage('foo', '2.0.0');
  t.fooPkg.canNest = true;
  t.fooPkg.mockModules('main');
  
  t.nestedBazPkg = new MockPackage('baz', '3.0.0');
  t.fooPkg.add(t.nestedBazPkg);
  t.nestedBazPkg.mockModules('main');
  
  t.barPkgs = [
    new MockPackage('bar', '2.2.0'), // older compatible
    new MockPackage('bar', '2.2.23'), // newest compatible
    new MockPackage('bar', '3.0.0') // newer, incompatible
  ];
  
  t.barPkgs[1].mockModules('main');
  t.barPkgs[2].mockModules('main');
  
  t.bazPkgs = [
    new MockPackage('baz', '2.0.0'),
    new MockPackage('baz', '3.1.2')
  ];
  
  t.mockSource = new MockSource();
  t.mockSource.add(t.fooPkg).add(t.barPkgs).add(t.bazPkgs);

  t.loader = new tiki.Loader([t.mockSource]);
  done();
});

Ct.teardown(function(t, done) {
  var k = 'loader fooPkg barPkgs nestedBazPkg mockSource'.split(' '),
      loc = k.length;
  while(--loc>=0) delete t[k[loc]];
  done();
});

Ct.test('get factory for a resolved canonicalId, no workingPackage', 
function(t, done) {
  
  t.timeout(1000, done);
  t.expect(5);
  
  t.loader.canonical('bar:main', function(err, canonicalId) {
    t.equal(err, null, 'should not return an error');
    t.equal(canonicalId, '::bar/3.0.0:main', 'should return an id');
    
    t.loader.load(canonicalId, function(err, factory) {
      t.equal(err, null, 'should not return an error');
      t.ok(factory, 'should return a factory');
      t.equal(factory.mockId, canonicalId, 'should match canonicalId');
      done();
    });
  });
});


Ct.test('get factory for a resolved canonicalId, with workingPackage', 
function(t, done) {
  
  t.timeout(1000, done);
  t.expect(5);
  
  // should return the version of bar that is compatible with foo (defined
  // in mocks)
  t.loader.canonical('bar:main', t.fooPkg, function(err, canonicalId) {
    t.equal(err, null, 'should not return an error');
    t.equal(canonicalId, '::bar/2.2.23:main', 'should return an id');
    
    t.loader.load(canonicalId, t.fooPkg, function(err, factory) {
      t.equal(err, null, 'should not return an error');
      t.ok(factory, 'should return a factory');
      t.equal(factory.mockId, canonicalId, 'should match canonicalId');
      done();
    });
  });
});

Ct.test('get factory for a resolve canonicalId, nested in workingPackage',
function(t, done) {
  t.timeout(1000, done);
  t.expect(5);

  // note: since we are going through a working package, this should 
  // return the nested package version. 
  
  // important: a newer version of 'baz' exists in the parent source, but this
  // should still return the nested version first
  t.loader.canonical('baz:main', t.fooPkg, function(err, canonicalId) {
    t.equal(err, null, 'should not return an error');
    t.equal(canonicalId, '::baz/3.0.0:main', 'should return an id');
    
    t.loader.load(canonicalId, t.fooPkg, function(err, factory) {
      t.equal(err, null, 'should not return an error');
      t.ok(factory, 'should return a factory');
      t.equal(factory.mockId, canonicalId, 'should match canonicalId');
      done();
    });
  });
});


Ct.test('get factory for unresolved canonicalId', function(t, done) {

  t.timeout(1000, done);
  t.expect(3);

  // this shouldn't happen often - but let's say we knew the canonicalId
  // already.  We should just be able to lookup the package.
  var canonicalId = '::foo/2.0.0:main';
    
  t.loader.load(canonicalId, function(err, factory) {
    t.equal(err, null, 'should not return an error');
    t.ok(factory, 'should return a factory');
    t.equal(factory.mockId, canonicalId, 'should match canonicalId');
    done();
  });
  
});


// ..........................................................
// SPECIAL CASES
// 

Ct.test("loading a package later should cause it to find", function(t,done) {
  t.timeout(1000, done);
  t.expect(5);
  
  // first try to find a package that doesn't exist.  This should create
  // a cached action
  (function(next) {
    t.loader.load('::bar/4.1.2:biff', function(err, factory) {
      t.equal(err, null, 'error should be null');
      t.equal(factory, null, 'should be null too (not found)');
      next();
    });
    
  // now that we have tried and the package did not load, simulate loading
  // the package
  })(function() {
    // now simulate loading the package...
    var bar4 = new MockPackage('bar', '4.1.2');
    t.mockSource.add(bar4);
    bar4.mockModules('biff');

    // try again.
    t.loader.load('::bar/4.1.2:biff', function(err, factory) {
      t.equal(err, null, 'should not have error');
      t.ok(factory, 'should have a factory');
      t.equal(factory.mockId, '::bar/4.1.2:biff', 'should find a factory');
      done();
    });

  });
});

Ct.run();
