// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*global process path sys t libDir */

var semver = require('tiki:semver');
var Ct = require('core_test:sync');

Ct.module('semver - basics');

Ct.test('semver.major()', function(t) {
  t.equal(semver.major('1.9.0'), 1);
  t.equal(semver.major('2.1.23beta'), 2);
  t.equal(semver.major('0002.2.0'), 2);
  t.equal(semver.major('2'), 2);

  t.equal(semver.major('~1.9.0'), 1);
  t.equal(semver.major('=1.9.0'), 1);
});

Ct.test('semver.minor()', function(t) {
  t.equal(semver.minor('1.9.0'), 9);
  t.equal(semver.minor('2.1.23beta'), 1);
  t.equal(semver.minor('0002.0020.0'), 20);
  t.equal(semver.minor('2'), 0);
  t.equal(semver.minor('2.2'), 2);

  t.equal(semver.minor('~1.9.0'), 9);
  t.equal(semver.minor('=1.9.0'), 9);
});

// needs === here to catch type diffs
Ct.test('semver.patch()', function(t) {
  t.equal(semver.patch('1.9.0'), 0);
  t.equal(semver.patch('2.1.23beta'), '23beta');
  t.equal(semver.patch('0002.0020.00023'), 23);
  t.equal(semver.patch('2'), 0);
  t.equal(semver.patch('2.2'), 0);
  t.equal(semver.patch('2.2.1'), 1);

  t.equal(semver.patch('~2.2.1'), 1);
  t.equal(semver.patch('=2.2.1'), 1);
});

Ct.test('semver.mode()', function(t) {
  t.equal(semver.mode('1.9.0'), semver.NORMAL, '1.9.0');
  t.equal(semver.mode('~1.9.0'), semver.NORMAL, '~1.9.0');
  t.equal(semver.mode('=1.9.0'), semver.STRICT, '=1.9.0');
});

Ct.module('semver - compatibility mode');

Ct.test('semver.compare()', function(t) {
  t.equal(semver.compare('1.9.0', '1.10.0'), -1);
  t.equal(semver.compare('1.11.0', '1.10.0'), 1);
  t.equal(semver.compare('2.0.1', '1.10.0'),  1);
  t.equal(semver.compare('2.0.1', '2.0.1'), 0);

  t.equal(semver.compare('1.0.0beta1', '1.0.0beta2'), -1);
  t.equal(semver.compare('1.0.0', '1.0.0beta2'), 1);

  t.equal(semver.compare('1.0.0beta10', '1.0.0beta2'), 1);
  t.equal(semver.compare('1.0.0beta20.1', '1.0.0beta20.2'), -1);
  t.equal(semver.compare('1.0.0beta20.1', '1.0.0'), -1);

  t.equal(semver.compare('1.0.0beta1.9', '1.0.0beta100'), -1);
});

Ct.test('semver.compatible()', function(t) {
  t.equal(semver.compatible('1.0.0', '1.0.0'), true);
  t.equal(semver.compatible('1.1.0', '1.0.0'), false);
  t.equal(semver.compatible('1.0.0', '1.0.0rc1'), false);
  t.equal(semver.compatible('1.0.0', '1.0.1000'), true);
  t.equal(semver.compatible('1.0.0', '1.5.2beta3'), true);
  t.equal(semver.compatible('1.0.0', '1.99.99'), true);
  t.equal(semver.compatible('1.0.0', '2.0.0'), false);
});


Ct.module('semver - strict mode');

// the ~ and = at the start should be ignored
Ct.test('semver.compare()', function(t) {
  t.equal(semver.compare('=1.9.0', '1.10.0'), -1);
  t.equal(semver.compare('1.11.0', '=1.10.0'), 1);
  t.equal(semver.compare('~2.0.1', '=1.10.0'),  1);
  t.equal(semver.compare('=2.0.1', '~2.0.1'), 0);

  t.equal(semver.compare('=1.0.0beta1', '=1.0.0beta2'), -1);
  t.equal(semver.compare('1.0.0', '=1.0.0beta2'), 1);

  t.equal(semver.compare('=1.0.0beta10', '1.0.0beta2'), 1);
  t.equal(semver.compare('1.0.0beta20.1', '=1.0.0beta20.2'), -1);
  t.equal(semver.compare('1.0.0beta20.1', '=1.0.0'), -1);

  t.equal(semver.compare('1.0.0beta1.9', '=1.0.0beta100'), -1);
});

Ct.test('semver.compatible()', function(t) {
  t.equal(semver.compatible('=1.0.0', '1.0.0'), true);
  t.equal(semver.compatible('=1.0.0', '1.0'), true);
  t.equal(semver.compatible('=1.0.1', '1.0'), false);
  t.equal(semver.compatible('=1.1.0', '1.0.0'), false);
  t.equal(semver.compatible('=1.0.0', '1.0.0rc1'), false);
  t.equal(semver.compatible('=1.0.0', '1.0.1000'), false);
  t.equal(semver.compatible('=1.0.0', '1.5.2beta3'), false);
  t.equal(semver.compatible('=1.0.0', '1.99.99'), false);
  t.equal(semver.compatible('=1.0.0', '2.0.0'), false);
});

Ct.run();
