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
    
Ct.module('Loader#ready');

Ct.setup(function(t, done) {
  
  t.fooPkg = new MockPackage('foo', '2.0.0');
  t.fooPkg.mockModules('main');
  
  t.bazPkg = new MockPackage('baz', '1.0.0');
  t.bazPkg.mockModules('main');
  
  // don't add to sources just yet - added by one unit test
  t.barPkg = new MockPackage('bar', '2.1.0');
  t.barPkg.mockModules('main');
  
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

Ct.test('ready() on package not loaded', function(t, done) {
  t.loader.ready('::imaginary/1.2.1:main', function(err, isReady) {
    t.equal(err, null, 'should not have error');
    t.equal(isReady, false, 'isReady');
    done();
  });
});

Ct.test('ready() on package with unloaded dependencies', function(t, done) {
  t.loader.ready('::foo/2.0.0:main', function(err, isReady) {
    t.equal(err, null, 'should not have error');
    t.equal(isReady, false, 'isReady (missing bar)');
    done();
  });
});

Ct.test('ready() on package with loaded dependencies', function(t, done) {
  t.mockSource.add(t.barPkg);
  t.loader.ready('::foo/2.0.0:main', function(err, isReady) {
    t.equal(err, null, 'should not have error');
    t.equal(isReady, true, 'isReady');
    done();
  });
});


Ct.test('ready() on package with dependencies loading later', function(t, done) {

  t.loader.ready('::foo/2.0.0:main', function(err, isReady) {
    t.equal(err, null, 'should not have error');
    t.equal(isReady, false, 'isReady (missing bar)');

    t.mockSource.add(t.barPkg);
    t.loader.ready('::foo/2.0.0:main', function(err, isReady) {
      t.equal(err, null, 'should not have error');
      t.equal(isReady, true, 'isReady');
      done();
    });

  });

});

Ct.test('ready() on package with no dependencies', function(t, done) {
  t.loader.ready('::baz/1.0.0:main', function(err, isReady) {
    t.equal(err, null, 'should not have error');
    t.equal(isReady, true, 'isReady');
    done();
  });
});

Ct.test('ready() on loaded package but non-existant module', function(t, done) {
  t.loader.ready('::baz/1.0.0:imaginary', function(err, isReady) {
    t.equal(err, null, 'should not have error');
    t.equal(isReady, false, 'not ready b/c module does not exist');
    done();
  });
});

Ct.run();