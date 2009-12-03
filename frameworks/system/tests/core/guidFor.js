// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================

"import core_test:index";
"import core as core";

module("core.guidFor()");

test("primitive types", function() {
  equals(core.guidFor(undefined), '(undefined)', '1st try');
  equals(core.guidFor(undefined), '(undefined)', '2nd try');

  equals(core.guidFor(null), '(null)', '1st try');
  equals(core.guidFor(null), '(null)', '2nd try');

  equals(core.guidFor(true), '(true)', '1st try');
  equals(core.guidFor(true), '(true)', '2nd try');

  equals(core.guidFor(false), '(false)', '1st try');
  equals(core.guidFor(false), '(false)', '2nd try');
  
  equals(core.guidFor(Object), '(Object)', '1st try');
  equals(core.guidFor(Object), '(Object)', '2nd try');

  equals(core.guidFor(Array), '(Array)', '1st try');
  equals(core.guidFor(Array), '(Array)', '2nd try');
});

test("numbers", function() {
  var loc = 3;
  while(--loc >= 0) {
    var ret = core.guidFor(loc); 
    equals(ret, 'nu%@'.fmt(loc), 'test number: %@'.fmt(loc));
    equals(core.guidFor(loc), ret, 'calling again should return same value');
  }
});

test("strings", function() {
  var items = 'foo bar baz'.w(), loc = items.length;
  while(--loc >= 0) {
    var str = items[loc];
    var ret = core.guidFor(str); 
    equals(ret, 'st%@'.fmt(str), 'test string: %@'.fmt(str));
    equals(core.guidFor(str), ret, 'calling again should return same value');
  }
});

test("objects", function() {
  var items = [{ id: "foo" }, { id: "bar" }, { id: "baz" } ], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = core.guidFor(obj);
    equals(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equals(core.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
});

test("functions", function() {
  var items = [function() {}, function() {}, function() {}], 
      loc   = items.length,
      seen  = [];
  while(--loc >= 0) {
    var obj = items[loc];
    var ret = core.guidFor(obj);
    equals(seen.indexOf(ret), -1, 'seen.indexOf(%@) should be < 0 [i.e. not found]'.fmt(ret));
    equals(core.guidFor(obj), ret, 'calling again should return same value');
    seen.push(ret);
  }
});

plan.run();
