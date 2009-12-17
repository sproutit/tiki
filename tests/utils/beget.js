// ========================================================================
// utils.beget Tests
// ========================================================================
/*globals utils notEqual equal raises plan */

"import package core_test";
"import utils as utils";

var objectA, objectB , arrayA, stringA; // global variables

module("Beget function Module");

test("basic object", function() {
  
  var obj = { foo: 'bar' }, str = "string", ary = [];
  
  var begotton = utils.beget(obj);
  notEqual(begotton, obj, 'beget(obj) should be new instance');
  equal(begotton.foo, 'bar', 'should inherit property from parent');
  
  obj.foo = 'bar2'; 
  equal(begotton.foo, 'bar2', 'inherted foo property should change from parent');
});

test("non object types", function() {
  
  equal(utils.beget(2), 2, 'beget(Number)');
  equal(utils.beget('string'), 'string', 'beget(String)');
  equal(utils.beget(true), true, 'beget(Boolean)');

  // array is intentionally untested.  We want beget() to be fast even if 
  // beget([]) is undefined results
  // utils.beget([]);
});


plan.run();