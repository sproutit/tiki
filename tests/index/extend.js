// ========================================================================
// tiki.extend Tests
// ========================================================================
/*globals notEqual equal raises plan setup teardown */

"import package core_test";

var a, b, c ;

module("tiki.extend()");

test("building a basic object", function() {
  
  var Const = tiki.extend({ foo: 'bar' });
  
  equal(typeof Const, tiki.T_FUNCTION, 'should return a constructor function');
  equal(Const.prototype.foo, 'bar', 'Const.prototype should contain passed props');
  
  var c = new Const();
  equal(c instanceof Const, true, 'c should be instanceof Const');
  
  equal(c.constructor, Const, 'instance.constructor should be Const');
});

test("init", function() {

  var ConstInit = tiki.extend({ 
    init: function(bar) { this.foo = bar; }
  });
  
  var ConstNoInit = tiki.extend({});
  
  var c = new ConstInit('blah');
  equals(c.foo, 'blah', 'should call init() if defined [init sets c.foo = blah]');
  
  c = new ConstNoInit();
  equals(c instanceof ConstNoInit, true, 'should not raise exception when no init is defined');
});

test("extending a constructor", function() {
  var ConstA = tiki.extend({ 
    init: function() { this.foo = 'ConstA'; },
    constA: 'constA'
  });
  
  var ConstB = tiki.extend(ConstA, {
    init: function() { this.foo = 'ConstB'; },
    constB: 'constB'
  });

  var c = new ConstB();
  equal(c instanceof ConstB, true, 'c should be instance of ConstB');
  equal(c instanceof ConstA, true, 'c should also be instance of ConstA');
  equal(c.constructor, ConstB, 'c.constructor should be ConstB');
  
  equal(c.constB, 'constB', 'should have property constB defined on constB');
  equal(c.constA, 'constA', 'should have property constA inherited from constA');
  
  equal(c.foo, 'ConstB', 'should overwrite init() from ConstB');
  
});

test("extending a native object", function() {

  var Const = tiki.extend(Date, { foo: 'foo' });
  var c = new Const();
  equal(c instanceof Const, true, 'c should be instanceof Const');
  equal(c instanceof Date, true, 'c should also be instance of Date');
  equal(c.getTime, Date.prototype.getTime, 'c.getTime should inherit from Date.prototype.getTime()');
  
});

plan.run();