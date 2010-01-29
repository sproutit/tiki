// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

Ct.module("tiki.guidFor()");

Ct.test("primitive types", function(t) {
  t.equal(tiki.guidFor(undefined), '(undefined)', '1st try');
  t.equal(tiki.guidFor(undefined), '(undefined)', '2nd try');

  t.equal(tiki.guidFor(null), '(null)', '1st try');
  t.equal(tiki.guidFor(null), '(null)', '2nd try');

  t.equal(tiki.guidFor(true), '(true)', '1st try');
  t.equal(tiki.guidFor(true), '(true)', '2nd try');
 
  t.equal(tiki.guidFor(false), '(false)', '1st try');
  t.equal(tiki.guidFor(false), '(false)', '2nd try');
  
  t.equal(tiki.guidFor(Object), '(Object)', '1st try');
  t.equal(tiki.guidFor(Object), '(Object)', '2nd try');

  t.equal(tiki.guidFor(Array), '(Array)', '1st try');
  t.equal(tiki.guidFor(Array), '(Array)', '2nd try');
});
 
Ct.test("numbers", function(t) {
  var loc = 3;
  while(--loc >= 0) {
    var ret = tiki.guidFor(loc); 
    t.equal(ret, 'nu%@'.fmt(loc), 'test number: %@'.fmt(loc));
    t.equal(tiki.guidFor(loc), ret, 'calling again should return same value');
  }
  
  t.equal(true, isNaN(parseInt(tiki.guidFor(23), 0))) ;
});

Ct.test("strings", function(t) {
  var items = 'foo bar baz'.w(), loc = items.length;
  while(--loc >= 0) {
    var str = items[loc];
    var ret = tiki.guidFor(str); 
    t.equal(ret, 'st%@'.fmt(str), 'test string: %@'.fmt(str));
    t.equal(tiki.guidFor(str), ret, 'calling again should return same value');
  }
  
  t.equal(true, isNaN(parseInt(tiki.guidFor("String"), 0))) ;
});

Ct.test("objects", function(t) {
  var items = [{ id: "foo" }, { id: "bar" }, { id: "baz" } ], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = tiki.guidFor(obj);
    t.equal(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    t.equal(tiki.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
  
  var a = {}, b = {};
  t.notEqual(tiki.guidFor(a), tiki.guidFor(b), 'a/b should not have same guid');
  
  t.equal(true, isNaN(parseInt(tiki.guidFor({}), 0))) ;
  
});

Ct.test("functions", function(t) {
  var items = [function() {}, function() {}, function() {}], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = tiki.guidFor(obj);
    t.equal(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    t.equal(tiki.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
  
  
  t.equal(true, isNaN(parseInt(tiki.guidFor(function() {}), 0))) ;
  
});

Ct.test("arrays", function(t) {
  
  var ary1 = [1], ary2 = [2], ary1copy = [1];
  t.equal(tiki.guidFor(ary1), tiki.guidFor(ary1), 'same instance - same guid');
  t.notEqual(tiki.guidFor(ary1), tiki.guidFor(ary2), 'difft instance - diff guid');
  t.notEqual(tiki.guidFor(ary1copy), tiki.guidFor(ary1), 'diff instance, same content, diff guid');
  
});

Ct.run();
