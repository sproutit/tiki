// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*global process path sys t libDir */

var tiki = require('tiki:core');
var Ct = require('core_test:sync');

Ct.module('creating');

var mod, pkg;

Ct.setup(function() {
  pkg = new tiki.Package('packageId');
  mod = new tiki.Module('moduleId', pkg);
});

Ct.teardown(function() {
  pkg = mod = null;
});

Ct.test('Creating module', function(t) {
  t.strictEqual(mod.id, 'moduleId', 'module.id should equal instantiated');
  t.strictEqual(mod.ownerPackage, pkg, 'mod.ownerPackage should equal passed package');
});

Ct.test('resource() handler', function(t) {
  // monkey patch pkg to verify call
  var params = null;
  var done   = function() {};
  pkg.resource = function() {
    params = Array.prototype.slice.call(arguments);
  };
  
  mod.resource('resourceId', done);
  t.deepEqual(params, ['resourceId', 'moduleId', done], 'should invoke pkg.resource() with name params and moduleId');
  
});

Ct.run();

