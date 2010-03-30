// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*global process path sys t libDir */

var Factory = require('tiki:tiki').Factory;
var Ct = require('core_test:sync');

// ..........................................................
// Factory#call()
// 

// TODO: Test Factory#call()

// ..........................................................
// Factory.compile()
// 

Ct.module("Factory.compile");

Ct.test("should wrap in function(require, exports, module, __filename, __dirname)", function(t) {
  
  var code = 'return [require, exports, module]';
  
  var func = Factory.compile(code, 'foo');
  var ret = func('require', 'exports', 'module');
  t.deepEqual(ret, ['require', 'exports', 'module'], 'Passed arguments');
});

Ct.run();

