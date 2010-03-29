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
    
Ct.module('Loader#packageFor');

Ct.setup(function(t, done) {
  
  t.fooPkg = new MockPackage('foo', '2.0.0');
  t.fooPkg.canNest = true;
  
  t.nestedBazPkg = new MockPackage('baz', '3.0.0');
  t.fooPkg.add(t.nestedBazPkg);
  
  t.barPkgs = [
    new MockPackage('bar', '2.2.0'), // older compatible
    new MockPackage('bar', '2.2.23'), // newest compatible
    new MockPackage('bar', '3.0.0') // newer, incompatible
  ];
  
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

Ct.test('get package for a resolved canonicalId, no workingPackage', 
function(t, done) {
  
  t.timeout(1000, done);
  t.expect(5);
  
  t.loader.canonicalPackageId('bar', null, function(err, canonicalId) {
    t.equal(err, null, 'should not return an error');
    t.equal(canonicalId, '::bar/3.0.0', 'should return an id');
    
    t.loader.packageFor(canonicalId, function(err, pkg) {
      t.equal(err, null, 'should not return an error');
      t.ok(pkg, 'should return a package');
      t.equal(pkg.id, canonicalId, 'should match canonicalId');
      done();
    });
  });
});


Ct.test('get package for a resolved canonicalId, with workingPackage', 
function(t, done) {
  
  t.timeout(1000, done);
  t.expect(5);
  
  // should return the version of bar that is compatible with foo (defined
  // in mocks)
  t.loader.canonicalPackageId('bar', t.fooPkg, function(err, canonicalId) {
    t.equal(err, null, 'should not return an error');
    t.equal(canonicalId, '::bar/2.2.23', 'should return an id');
    
    t.loader.packageFor(canonicalId, t.fooPkg, function(err, pkg) {
      t.equal(err, null, 'should not return an error');
      t.ok(pkg, 'should return a package');
      t.equal(pkg.id, canonicalId, 'should match canonicalId');
      done();
    });
  });
});


Ct.test('get package for a resolved canonical moduleId', 
function(t, done) {
  
  t.timeout(1000, done);
  t.expect(5);
  
  t.loader.canonical('bar:foo', null, function(err, canonicalId) {
    t.equal(err, null, 'should not return an error');
    t.equal(canonicalId, '::bar/3.0.0:foo', 'should return an id');
    
    t.loader.packageFor(canonicalId, function(err, pkg) {
      t.equal(err, null, 'should not return an error');
      t.ok(pkg, 'should return a package');
      t.equal(pkg.id, '::bar/3.0.0', 'should match canonicalId');
      done();
    });
  });
});


Ct.test('get package for a resolve canonicalId, nested in workingPackage',
function(t, done) {
  t.timeout(1000, done);
  t.expect(5);

  // note: since we are going through a working package, this should 
  // return the nested package version. 
  
  // important: a newer version of 'baz' exists in the parent source, but this
  // should still return the nested version first
  t.loader.canonicalPackageId('baz', null, t.fooPkg, function(err, canonicalId) {
    t.equal(err, null, 'should not return an error');
    t.equal(canonicalId, '::baz/3.0.0', 'should return an id');
    
    t.loader.packageFor(canonicalId, t.fooPkg, function(err, pkg) {
      t.equal(err, null, 'should not return an error');
      t.ok(pkg, 'should return a package');
      t.equal(pkg.id, canonicalId, 'should match canonicalId');
      done();
    });
  });
  
});

Ct.test('get package for unresolved canonicalId', function(t, done) {

  t.timeout(1000, done);
  t.expect(3);

  // this shouldn't happen often - but let's say we knew the canonicalId
  // already.  We should just be able to lookup the package.
  var canonicalId = '::foo/2.0.0';
    
  t.loader.packageFor(canonicalId, t.fooPkg, function(err, pkg) {
    t.equal(err, null, 'should not return an error');
    t.ok(pkg, 'should return a package');
    t.equal(pkg.id, canonicalId, 'should match canonicalId');
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
    t.loader.packageFor('::bar/4.1.2', function(err, pkg) {
      t.equal(err, null, 'error should be null');
      t.equal(pkg, null, 'pkg should be null too (not found)');
      next();
    });
    
  // now that we have tried and the package did not load, simulate loading
  // the package
  })(function() {
    // now simulate loading the package...
    var bar4 = new MockPackage('bar', '4.1.2');
    t.mockSource.add(bar4);

    // try again.
    t.loader.packageFor('::bar/4.1.2', function(err, pkg) {
      t.equal(err, null, 'should not have error');
      t.ok(pkg, 'should have a package');
      t.equal(pkg.id, '::bar/4.1.2', 'should find a package');
      done();
    });

  });
});

Ct.run();
