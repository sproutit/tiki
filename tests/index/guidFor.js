// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

"import package core_test";

module("tiki.guidFor()");

test("primitive types", function() {
  equal(tiki.guidFor(undefined), '(undefined)', '1st try');
  equal(tiki.guidFor(undefined), '(undefined)', '2nd try');

  equal(tiki.guidFor(null), '(null)', '1st try');
  equal(tiki.guidFor(null), '(null)', '2nd try');

  equal(tiki.guidFor(true), '(true)', '1st try');
  equal(tiki.guidFor(true), '(true)', '2nd try');
 
  equal(tiki.guidFor(false), '(false)', '1st try');
  equal(tiki.guidFor(false), '(false)', '2nd try');
  
  equal(tiki.guidFor(Object), '(Object)', '1st try');
  equal(tiki.guidFor(Object), '(Object)', '2nd try');

  equal(tiki.guidFor(Array), '(Array)', '1st try');
  equal(tiki.guidFor(Array), '(Array)', '2nd try');
});
 
test("numbers", function() {
  var loc = 3;
  while(--loc >= 0) {
    var ret = tiki.guidFor(loc); 
    equal(ret, 'nu%@'.fmt(loc), 'test number: %@'.fmt(loc));
    equal(tiki.guidFor(loc), ret, 'calling again should return same value');
  }
  
  equal(true, isNaN(parseInt(tiki.guidFor(23), 0))) ;
});

test("strings", function() {
  var items = 'foo bar baz'.w(), loc = items.length;
  while(--loc >= 0) {
    var str = items[loc];
    var ret = tiki.guidFor(str); 
    equal(ret, 'st%@'.fmt(str), 'test string: %@'.fmt(str));
    equal(tiki.guidFor(str), ret, 'calling again should return same value');
  }
  
  equal(true, isNaN(parseInt(tiki.guidFor("String"), 0))) ;
});

test("objects", function() {
  var items = [{ id: "foo" }, { id: "bar" }, { id: "baz" } ], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = tiki.guidFor(obj);
    equal(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equal(tiki.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
  
  var a = {}, b = {};
  notEqual(tiki.guidFor(a), tiki.guidFor(b), 'a/b should not have same guid');
  
  equal(true, isNaN(parseInt(tiki.guidFor({}), 0))) ;
  
});

test("functions", function() {
  var items = [function() {}, function() {}, function() {}], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = tiki.guidFor(obj);
    equal(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equal(tiki.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
  
  
  equal(true, isNaN(parseInt(tiki.guidFor(function() {}), 0))) ;
  
});

test("arrays", function() {
  
  var ary1 = [1], ary2 = [2], ary1copy = [1];
  equal(tiki.guidFor(ary1), tiki.guidFor(ary1), 'same instance - same guid');
  notEqual(tiki.guidFor(ary1), tiki.guidFor(ary2), 'difft instance - diff guid');
  notEqual(tiki.guidFor(ary1copy), tiki.guidFor(ary1), 'diff instance, same content, diff guid');
  
});

plan.run();
