// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('tiki:tiki');
var Ct = require('core_test:sync');

// ..........................................................
// requiredVersion()
// 

var pkg ;

Ct.module("Package#requiredVersion");
Ct.setup(function() {
  pkg = new tiki.Package('urn:mod:foo-1.2.0-3ef23ea4bce394ad0c', {
    "name": "foo",
    "version": "1.0.1",
    "dependencies": {
      "bar": "1.0.1",
      "baz": "=0.1.0"
    }
  });
});

Ct.teardown(function() {
  pkg = null;
});

Ct.test("Returns version listed in dependencies", function(t) {
  t.equal(pkg.requiredVersion("bar"), "1.0.1", "pkg.requiredVersion(bar)");
  t.equal(pkg.requiredVersion("baz"), "=0.1.0", "pkg.requiredVersion(bar)");
});

Ct.test("Returns null for package not in dependencies", function(t) {
  t.equal(pkg.requiredVersion("not-bar"), null, "pkg.requiredVersion(not-bar)");
});

// ..........................................................
// get()/set()
// 

Ct.module("Package#get() - Package#set()");
Ct.setup(function() {
  pkg = new tiki.Package('foo-1.0.1', {
    // no 'name' property
  })
})
Ct.run();
