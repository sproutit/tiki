// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals utils plan equal notEqual */

"import package core_test";
"import utils as utils";

module("utils.guidFor()");

test("primitive types", function() {
  equal(utils.guidFor(undefined), '(undefined)', '1st try');
  equal(utils.guidFor(undefined), '(undefined)', '2nd try');

  equal(utils.guidFor(null), '(null)', '1st try');
  equal(utils.guidFor(null), '(null)', '2nd try');

  equal(utils.guidFor(true), '(true)', '1st try');
  equal(utils.guidFor(true), '(true)', '2nd try');
 
  equal(utils.guidFor(false), '(false)', '1st try');
  equal(utils.guidFor(false), '(false)', '2nd try');
  
  equal(utils.guidFor(Object), '(Object)', '1st try');
  equal(utils.guidFor(Object), '(Object)', '2nd try');

  equal(utils.guidFor(Array), '(Array)', '1st try');
  equal(utils.guidFor(Array), '(Array)', '2nd try');
});
 
test("numbers", function() {
  var loc = 3;
  while(--loc >= 0) {
    var ret = utils.guidFor(loc); 
    equal(ret, 'nu%@'.fmt(loc), 'test number: %@'.fmt(loc));
    equal(utils.guidFor(loc), ret, 'calling again should return same value');
  }
  
  equal(true, isNaN(parseInt(utils.guidFor(23), 0))) ;
});

test("strings", function() {
  var items = 'foo bar baz'.w(), loc = items.length;
  while(--loc >= 0) {
    var str = items[loc];
    var ret = utils.guidFor(str); 
    equal(ret, 'st%@'.fmt(str), 'test string: %@'.fmt(str));
    equal(utils.guidFor(str), ret, 'calling again should return same value');
  }
  
  equal(true, isNaN(parseInt(utils.guidFor("String"), 0))) ;
});

test("objects", function() {
  var items = [{ id: "foo" }, { id: "bar" }, { id: "baz" } ], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = utils.guidFor(obj);
    equal(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equal(utils.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
  
  var a = {}, b = {};
  notEqual(utils.guidFor(a), utils.guidFor(b), 'a/b should not have same guid');
  
  equal(true, isNaN(parseInt(utils.guidFor({}), 0))) ;
  
});

test("functions", function() {
  var items = [function() {}, function() {}, function() {}], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = utils.guidFor(obj);
    equal(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equal(utils.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
  
  
  equal(true, isNaN(parseInt(utils.guidFor(function() {}), 0))) ;
  
});

test("arrays", function() {
  
  var ary1 = [1], ary2 = [2], ary1copy = [1];
  equal(utils.guidFor(ary1), utils.guidFor(ary1), 'same instance - same guid');
  notEqual(utils.guidFor(ary1), utils.guidFor(ary2), 'difft instance - diff guid');
  notEqual(utils.guidFor(ary1copy), utils.guidFor(ary1), 'diff instance, same content, diff guid');
  
});

plan.run();
