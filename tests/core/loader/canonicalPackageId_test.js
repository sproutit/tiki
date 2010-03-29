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

// ..........................................................
// HELPERS
//


function testOK(desc, packageId, vers, pkgKey, expected, noCache, next) {
  desc = desc ? (desc+' ') : 'loader.canonicalPackageId';
  var title = desc+'('+packageId+','+vers+','+pkgKey+')';

  if ('function' === typeof noCache) {
    next = noCache;
    noCache = false;
  }

  if (!next) next = function(t, done) { return done() ; };
  
  Ct.test(title, function(t, done) {
    t.expect(noCache ? 2 : 4);
    t.timeout(1000, done);
    
    var pkg = pkgKey ? t[pkgKey] : null;
    t.loader.canonicalPackageId(packageId, vers, pkg, function(err, id) {
      t.equal(err, null, 'err must be null');
      t.equal(id, expected, 'returned canonicalId');
      
      // test again to verify cache unless noCache
      if (!noCache) {
        t.loader.canonicalPackageId(packageId, vers, pkg, function(err, id2) {
          t.equal(err, null, 'err must be null');
          t.equal(id2, id, 'returned same');
          return next(t, done);
        });
        
      } else return next(t, done);

    });
  });
}

function testError(desc, packageId, vers, pkg, expected, next) {
  var title = "error: "+desc;
  
  if ('function' === typeof expected) {
    next = expected;
    expected = null;
  }
  if (!next) next = function(t, done) { return done() ; };
  
  Ct.test(title, function(t, done) {
    t.expect(2);
    t.timeout(1000, done);
    t.loader.canonicalPackageId(packageId, vers, pkg, function(err, id) {
      if (expected !== undefined) {
        t.equal(err, expected, 'should have error');
      } else {
        t.ok(err, 'should have an error');
      }
      t.equal(id, null, 'should not return an id');
      next(t, done);
    });
  });
}

// ..........................................................
// with canonicalId
// 

Ct.module('Loader#canonicalPackageId(canonicalId)');

Ct.setup(function(t, done) {
  t.loader = new tiki.Loader();
  done();
});

// a canonicalId should just be returned...
var canonicalId = '::foo/1.2.0';
testOK('basic canonicalId', canonicalId, null, null, canonicalId);


// a canonical moduleId should return just the package bit
testOK('canonical moduleId',
  '::foo/1.2.0:bar', null, null, '::foo/1.2.0');
  
// ..........................................................
// registered packageId
// 

Ct.module('Loader#canonicalPackageId(registered/packageId)');

Ct.setup(function(t, done) {
  
  t.fooPkgs = [
    new MockPackage('foo', '1.0.100'),
    new MockPackage('foo', '1.2.0'), // compatible with 1.1
    new MockPackage('foo', '2.0.0')
  ];

  t.fooPkg = t.fooPkgs[2]; // get 2.0.0 vers
  
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
  t.mockSource.add(t.fooPkgs).add(t.barPkgs).add(t.bazPkgs);
  t.loader = new tiki.Loader([t.mockSource]);
  done();
});

Ct.teardown(function(t, done) {
  var k = 'fooPkgs fooPkg barPkgs mockSource loader'.split(' '), 
      loc = k.length;
  while(--loc>=0) delete t[k[loc]];
  done();
});

testOK('asking for known packageId and no workingPackage',
      'foo', null, null, '::foo/2.0.0');

testOK('asking for known packageId and a compatible version',
      'foo', '1.1', null, '::foo/1.2.0');

testOK('asking for known packageId and an exact version (in source)',
      'foo', '=1.0.100', null, '::foo/1.0.100');

testOK('asking for known packageId and an exact version (not in source)',
      'foo', '=1.0.101', null, null);

testOK('asking for known packageId through workingPackage dependency',
      'bar', null, 'fooPkg', '::bar/2.2.23');
      
testOK('asking for a unknown packageId with no workingPackage',
      'fibber', null, null, null);
      
testOK('asking for a unknown packageId with a workingPackage',
      'fibber', null, 'fooPkg', null);
      
testOK('asking for a packageId through workingPackage but not dependency',
      'baz', null, 'fooPkg', '::baz/3.1.2');
      
// ..........................................................
// SPECIAL CASES
// 

Ct.test("loading a package later should cause it to resolve", function(t,done) {
  t.timeout(1000, done);
  
  // first try to find a package that doesn't exist.  This should create
  // a cached action
  (function(next) {
    t.loader.canonicalPackageId('bar', '4.1', t.fooPkg, function(err, pkg) {
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
    t.loader.canonicalPackageId('bar', '4.1', t.fooPkg, function(err, pkg) {
      t.equal(err, null, 'should not have error');
      t.equal(pkg, '::bar/4.1.2', 'should find a package');
      done();
    });

  });
});
            
Ct.run();
















