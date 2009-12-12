// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals utils plan */

"import package core_test";
"import utils as utils";

module("utils.guidFor()");

test("primitive types", function() {
  equals(utils.guidFor(undefined), '(undefined)', '1st try');
  equals(utils.guidFor(undefined), '(undefined)', '2nd try');

  equals(utils.guidFor(null), '(null)', '1st try');
  equals(utils.guidFor(null), '(null)', '2nd try');

  equals(utils.guidFor(true), '(true)', '1st try');
  equals(utils.guidFor(true), '(true)', '2nd try');

  equals(utils.guidFor(false), '(false)', '1st try');
  equals(utils.guidFor(false), '(false)', '2nd try');
  
  equals(utils.guidFor(Object), '(Object)', '1st try');
  equals(utils.guidFor(Object), '(Object)', '2nd try');

  equals(utils.guidFor(Array), '(Array)', '1st try');
  equals(utils.guidFor(Array), '(Array)', '2nd try');
});

test("numbers", function() {
  var loc = 3;
  while(--loc >= 0) {
    var ret = utils.guidFor(loc); 
    equals(ret, 'nu%@'.fmt(loc), 'test number: %@'.fmt(loc));
    equals(utils.guidFor(loc), ret, 'calling again should return same value');
  }
});

test("strings", function() {
  var items = 'foo bar baz'.w(), loc = items.length;
  while(--loc >= 0) {
    var str = items[loc];
    var ret = utils.guidFor(str); 
    equals(ret, 'st%@'.fmt(str), 'test string: %@'.fmt(str));
    equals(utils.guidFor(str), ret, 'calling again should return same value');
  }
});

test("objects", function() {
  var items = [{ id: "foo" }, { id: "bar" }, { id: "baz" } ], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = utils.guidFor(obj);
    equals(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equals(utils.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
});

test("functions", function() {
  var items = [function() {}, function() {}, function() {}], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = utils.guidFor(obj);
    equals(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equals(utils.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
});

plan.run();
