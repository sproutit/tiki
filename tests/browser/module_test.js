// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('../tiki'),
    Ct   = require('core_test:sync');
    
Ct.module('Browser.module');

Ct.setup(function(t) {
  t.browser = tiki.Browser.start();
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1"
  });
  
});

Ct.teardown(function(t) {
  delete t.browser;
});

Ct.test("finding a registered module", function(t) {

  t.browser.module('::foo/1.2.1:bar', function(r, e) { e.moduleId = 'bar'; });
  
  // also should normalize canonicalId
  t.browser.module('foo/1.2.1:baz', function(r, e) { e.moduleId = 'baz'; });
  
  var exp;
  
  exp = t.browser.require('foo:bar');
  t.ok(exp, 'should get exports');
  t.equal(exp.moduleId, 'bar', 'exp.moduleId');

  exp = t.browser.require('foo:baz');
  t.ok(exp, 'should get exports');
  t.equal(exp.moduleId, 'baz', 'exp.moduleId');
  
});

Ct.test("finding unknown module and module/pkg", function(t) {
  
  t.browser.module('::foo/1.2.1:bar', function() {});
  
  t.throws(function() {
    t.browser.require('bar');
  });
  
  t.throws(function() {
    t.browser.require('baz:bar');
  });
  
});

Ct.test('registering module for an unknown package', function(t) {
  t.browser.module('::fibber/1.2.1:mcgee', function(r,e) { e.moduleId='f';});
  
  t.throws(function() {
    t.browser.require('fibber:mcgee');
  });
  
});

Ct.run();
