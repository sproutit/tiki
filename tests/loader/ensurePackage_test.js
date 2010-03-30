// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('tiki:tiki'),
    Ct   = require('core_test'),

    mocks = require('..//mocks'),
    MockPackage = mocks.MockPackage, 
    MockSource = mocks.MockSource;
    
Ct.module('Loader#ensurePackage');

Ct.setup(function(t, done) {
  
  t.fooPkg = new MockPackage('foo', '2.0.0');
  t.bazPkg = new MockPackage('baz', '1.0.0'); // has no dependencies
  
  // don't add to sources just yet - added by one unit test
  t.barPkg = new MockPackage('bar', '2.1.0');
  
  t.mockSource = new MockSource();
  t.mockSource.add(t.fooPkg).add(t.bazPkg);

  t.loader = new tiki.Loader([t.mockSource]);
  done();
});

Ct.teardown(function(t, done) {
  var k = 'loader fooPkg barPkg bazPkg mockSource'.split(' '),
      loc = k.length;
  while(--loc>=0) delete t[k[loc]];
  done();
});

Ct.test('on a totally unknown package', function(t, done) {
  t.timeout(1000, done);
  t.expect(1);

  t.loader.ensurePackage('::imaginary/1.2.1:main', function(err) {
    t.ok(err, 'should have an error');
    done();
  });
});

Ct.test('on a loaded package with no dependencies', function(t, done) {
  t.timeout(1000, done);
  t.expect(1);
  
  t.loader.ensurePackage('baz', '1.0.0', function(err) {
    t.equal(err, null, 'should not have an error');
    done();
  });
});

Ct.test('on a loaded package with loaded dependencies', function(t, done) {
  t.timeout(1000, done);
  t.expect(2);
  
  t.mockSource.add(t.barPkg); // already loaded
  t.barPkg.didLoad = false;
  
  t.loader.ensurePackage('foo', '2.0.0', function(err) {
    t.equal(err, null, 'should not have an error');
    t.equal(t.barPkg.didLoad, false, 'should not load barPkg');
    done();
  });
});

Ct.test('on a loaded package with missing dependencies', function(t, done) {
  t.timeout(1000, done);
  t.expect(2);
  
  t.mockSource.addMockEnsures(t.barPkg); // make loadable
  t.barPkg.didLoad = false;
  
  t.loader.ensurePackage('foo', '2.0.0', function(err) {
    t.equal(err, null, 'should not have an error');
    t.equal(t.barPkg.didLoad, true, 'should load barPkg');
    done();
  });
});

Ct.test('unloaded but known package', function(t, done) {

  t.timeout(1000, done);
  t.expect(2);
  
  t.mockSource.addMockEnsures(t.barPkg); // make loadable
  t.barPkg.didLoad = false;
  
  t.loader.ensurePackage('bar', function(err) {
    t.equal(err, null, 'should not have an error');
    t.equal(t.barPkg.didLoad, true, 'should load barPkg');
    done();
  });
});

Ct.run();
