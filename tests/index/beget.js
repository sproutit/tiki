// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

var objectA, objectB , arrayA, stringA; // global variables

Ct.module("Beget function Module"); 

Ct.test("basic object", function(t) {
  
  var obj = { foo: 'bar' }, str = "string", ary = [];
  
  var begotton = tiki.beget(obj);
  t.notEqual(begotton, obj, 'beget(obj) should be new instance');
  t.equal(begotton.foo, 'bar', 'should inherit property from parent');
  
  obj.foo = 'bar2'; 
  t.equal(begotton.foo, 'bar2', 'inherted foo property should change from parent');
});

Ct.test("non object types", function(t) {
  
  t.equal(tiki.beget(2), 2, 'beget(Number)');
  t.equal(tiki.beget('string'), 'string', 'beget(String)');
  t.equal(tiki.beget(true), true, 'beget(Boolean)');

  // array is intentionally untested.  We want beget() to be fast even if 
  // beget([]) is undefined results
  // tiki.beget([]);
});


Ct.run();