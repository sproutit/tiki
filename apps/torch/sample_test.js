// ==========================================================================
// Project:   Torch
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals plan module test ok equals notEquals deepEquals deepNotEquals */

"import core_test:package";

plan('foo');

module('bar');

test('baz', function() {
  equal(1,1,'baz is running!');
});

exports.plan = plan.end();
