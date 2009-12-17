// ========================================================================
// utils.beget Tests
// ========================================================================
/*globals plan equal utils */

"import package core_test";
"import utils as utils";

module("utils exported types");

test("T_FOO types", function() {
  equal(!!utils.T_ERROR, true, 'should defined T_ERROR');
  equal(!!utils.T_OBJECT, true, 'should defined T_OBJECT');
  equal(!!utils.T_NULL, true, 'should defined T_NULL');
  equal(!!utils.T_CLASS, true, 'should defined T_CLASS');
  equal(!!utils.T_HASH, true, 'should defined T_HASH');
  equal(!!utils.T_FUNCTION, true, 'should defined T_FUNCTION');
  equal(!!utils.T_UNDEFINED, true, 'should defined T_UNDEFINED');
  equal(!!utils.T_NUMBER, true, 'should defined T_NUMBER');
  equal(!!utils.T_BOOL, true, 'should defined T_BOOL');
  equal(!!utils.T_ARRAY, true, 'should defined T_ARRAY');
  equal(!!utils.T_STRING, true, 'should defined T_STRING');
  equal(!!utils.T_BOOLEAN, true, 'should defined T_BOOLEAN');
});

test("YES and NO", function() {
  equal(utils.YES, true, 'should define utils.YES == true');
  equal(utils.NO, false, 'should defined utils.NO == false');
});

plan.run();