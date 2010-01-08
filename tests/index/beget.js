// ========================================================================
// tiki.beget Tests
// ========================================================================
/*globals notEqual equal raises plan */

"import package core_test";

var objectA, objectB , arrayA, stringA; // global variables

module("Beget function Module");

test("basic object", function() {
  
  var obj = { foo: 'bar' }, str = "string", ary = [];
  
  var begotton = tiki.beget(obj);
  notEqual(begotton, obj, 'beget(obj) should be new instance');
  equal(begotton.foo, 'bar', 'should inherit property from parent');
  
  obj.foo = 'bar2'; 
  equal(begotton.foo, 'bar2', 'inherted foo property should change from parent');
});

test("non object types", function() {
  
  equal(tiki.beget(2), 2, 'beget(Number)');
  equal(tiki.beget('string'), 'string', 'beget(String)');
  equal(tiki.beget(true), true, 'beget(Boolean)');

  // array is intentionally untested.  We want beget() to be fast even if 
  // beget([]) is undefined results
  // tiki.beget([]);
});


plan.run();