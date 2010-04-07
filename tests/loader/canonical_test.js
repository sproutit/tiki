// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('../tiki'),
    Ct   = require('core_test'),

    mocks = require('..//mocks'),
    MockPackage = mocks.MockPackage, 
    MockSource = mocks.MockSource;

// ..........................................................
// HELPERS
//


function testOK(desc, moduleId, curModuleId, pkgKey, expected, noCache) {
  desc = desc ? (desc+' ') : 'loader.canonical';
  var title = desc+'('+moduleId+','+curModuleId+','+pkgKey+')';

  Ct.test(title, function(t, done) {
    var pkg, id, id2; 
    
    t.expect(noCache ? 1 : 2);
    
    pkg = pkgKey ? t[pkgKey] : null;
    
    id = t.loader.canonical(moduleId, curModuleId, pkg);
    t.equal(id, expected, 'returned canonicalId');
      
    // test again to verify cache unless noCache
    if (!noCache) {
      id2 = t.loader.canonical(moduleId, curModuleId, pkg);
      t.equal(id2, id, 'returned same');
    }
    done();
  });
}

function testError(desc, moduleId, curModuleId, pkg, expected) {
  var title = "error: "+desc;
  Ct.test(title, function(t, done) {
    t.expect(1);
    t.throws(function() {
      var id = t.loader.canonical(moduleId, curModuleId, pkg);
    }, expected, 'should have error');
    done();
  });
}

// ..........................................................
// with canonicalId
// 

Ct.module('Loader#canonical(canonicalId)');

Ct.setup(function(t, done) {
  t.loader = new tiki.Loader();
  done();
});

var canonicalId = '::foo/1.2.0:bar';
testOK('basic canonicalId', canonicalId, null, null, canonicalId);

// ..........................................................
// with relative Id
// 

Ct.module('Loader#canonical(./relative/moduleId)');
Ct.setup(function(t, done) {
  t.loader = new tiki.Loader();
  t.fooPkg = new MockPackage('foo', '1.2.0');
  done();
});

Ct.teardown(function(t, done) {
  t.loader = t.fooPkg = null;
  done();
});

testOK('simple relative path',
        './foo/bar', 'biff/bar', 'fooPkg', '::foo/1.2.0:biff/foo/bar');

testOK('relative path using .. operator at start',
        '../foo/bar', 'biff/bar', 'fooPkg', '::foo/1.2.0:foo/bar');

testOK('relative path with .. operator in middle',
        './foo/../bar', 'biff/bar', 'fooPkg', '::foo/1.2.0:biff/bar');

testOK('complex relative path',
        './foo/../bar/../baz/biff/../../bill', 'biff/bar', 'fooPkg', 
        '::foo/1.2.0:biff/bill');

testError('trying to resolve a relative path without a baseId', 
          './foo/bar', null, 'fooPkg');

testError('trying to go up beyond the top level of the package',
          '../../foo/bar', 'biff/bar', 'fooPkg');

testError('including packageId in the current moduleId',
          './foo/bar', '::foo/1.2.0:biff/bar', 'fooPkg');

// ..........................................................
// With absolute path
// 

Ct.module('Loader#canonical(/Absolute/path.js)');
Ct.setup(function(t, done) {
  t.loader = new tiki.Loader();
  t.fooPkg = new MockPackage('foo', '1.2.1');
  done();
});


Ct.teardown(function(t, done) {
  t.loader = t.fooPkg = null;
  done();
});

testOK('absolute path should always return with anonymous',
        '/Users/charles/Source/example.js', 'main', 'fooPkg',
        '::(anonymous):/Users/charles/Source/example.js');

testError('absolute path should fail if you embed a packageId',
        'bar:/Users/charles/Source/example.js', 'main', 'fooPkg');
                
// ..........................................................
// with embedded packageId
// 
Ct.module("Loader#canonical(with/embedded:packageId)");
Ct.setup(function(t, done) {
  t.fooPkg = new MockPackage('foo', '1.2.0');
  t.fooPkg.add(new MockPackage('biff', 'inside-foo'));
  t.fooPkg.canNest = true; // use nesting for this test.
  
  t.barPkgs = [
    new MockPackage('bar', '2.2.0'), // older compatible
    new MockPackage('bar', '2.2.23'), // newest compatible
    new MockPackage('bar', '3.0.0') // newer, incompatible
  ];
  
  t.bazPkgs = [
    new MockPackage('baz', '1.0.17'),
    new MockPackage('baz', '10.1.2unstable1')
  ];
  t.barPkg = new MockPackage('bar', '2.2.23');
  t.barOlderPkg = new MockPackage('bar', '2.2.0');
  t.barNewerPkg = new MockPackage('bar', '3.0.0');
  t.mockSource = new MockSource();
  t.mockSource.add(t.fooPkg).add(t.barPkgs).add(t.bazPkgs);
  
  // for nesting test
  t.mockSource.add(new MockPackage('biff', 'outside-foo'));
  
  t.loader = new tiki.Loader([t.mockSource]);
  done();
});

Ct.teardown(function(t,done) {
  t.fooPkg = t.barPkgs = t.bazPkgs = t.mockSource = t.loader = null;
  done();
});

testOK('packageId for known dependency should return latest compatible',
       'bar:foo', 'biff/baz', 'fooPkg', '::bar/2.2.23:foo');

testOK('testing cache - should be same as previous',
        'bar:foo', 'biff/baz', 'fooPkg', '::bar/2.2.23:foo');

testOK('packageId for unknown dependency should return latest found',
      'baz:bar/biff', 'biff/baz', 'fooPkg', '::baz/10.1.2unstable1:bar/biff');
      
testOK('packageId for package nested inside of working should return nested',
      'biff:mac-tools', 'biff/baz', 'fooPkg', '::biff/inside-foo:mac-tools');
      
// ..........................................................
// absolute moduleId with no embedded packageId
// 

Ct.module('Loader#canonical(moduleId/with/no/packageId)');
Ct.setup(function(t, done) {

  t.fooPkg = new MockPackage('foo', '1.2.0');
  t.fooPkg.mockModules('foo-only', 'utils');

  t.defaultPackage = new MockPackage('(default)', '1.0.0');
  t.defaultPackage.mockModules('utils', 'fs');
  
  t.barPkg = new MockPackage('bar', '2.2.23');
  t.barPkg.mockModules('index', 'bar'); // note: should find index not bar

  t.bazPkg = new MockPackage('baz', '10.1.2');
  t.bazPkg.mockModules('baz'); // note: do not mock 'index' here
  
  t.mockSource = new MockSource();
  t.mockSource.add(t.fooPkg).add(t.barPkg).add(t.bazPkg);
  
  t.loader = new tiki.Loader([t.mockSource]);
  t.loader.defaultPackage = t.defaultPackage;
  
  done();
});

Ct.teardown(function(t, done) {
  var k ='fooPkg defaultPackage barPkg bazPkg mockSource loader'.split(' '),
      loc = k.length;
  while(--loc>=0) delete t[k[loc]];
  done();
});

testOK('moduleId in workingPackage that exists nowhere else', 
    'foo-only', 'main', 'fooPkg', '::foo/1.2.0:foo-only');
    
testOK('moduleId in workingPackage that also exists in default package',
    'utils', 'main', 'fooPkg', '::foo/1.2.0:utils');

testOK('moduleId in default package only',
    'fs/foo', 'main', 'fooPkg', '::(default)/1.0.0:fs/foo');
    
testOK('moduleId that maps to a packageId:index',
    'bar', 'main', 'fooPkg', '::bar/2.2.23:index');
    
testOK('moduleId that maps to a packageId:packageId',
    'baz', 'main', 'fooPkg', '::baz/10.1.2:baz');
    
// ..........................................................
// SPECIAL CASES
// 

Ct.module('special cases');

Ct.test("loading a package later should cause it to find", function(t,done) {

  t.mockSource = new MockSource();
  t.loader = new tiki.Loader([t.mockSource]);
  
  var anon = t.loader.anonymousPackage, id1, id2;
  
  t.expect(2);

  // first try to find a package that doesn't exist.  This should create
  // a cached action
  id1 = t.loader.canonical('bar:foo', anon);
  t.equal(id1, null, 'id should be null (not found)');

  // now simulate loading the package...
  var bar4 = new MockPackage('bar', '4.1.2');
  t.mockSource.add(bar4);

  // try again.
  id2 = t.loader.canonical('bar:foo', anon);
  t.equal(id2, '::bar/4.1.2:foo', 'should find a canonicalId');

  done();
});

Ct.test('explicitly named default module', function(t, done) {
  
  var mockSource = new MockSource();
  var loader = new tiki.Loader([t.mockSource]);
  
  var defaultPackage = new MockPackage('(default)', '1.0.0');
  defaultPackage.mockModules('utils', 'fs');
  loader.defaultPackage = defaultPackage;
  
  t.equal(loader.canonical('default:utils'), '::(default)/1.0.0:utils');
  done();
});


Ct.run();

