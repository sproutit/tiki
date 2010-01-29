// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

var a, b, c ;

Ct.module("tiki.extend()");

Ct.test("building a basic object", function(t) {
  
  var Const = tiki.extend({ foo: 'bar' });
  
  t.equal(typeof Const, tiki.T_FUNCTION, 'should return a constructor function');
  t.equal(Const.prototype.foo, 'bar', 'Const.prototype should contain passed props');
  
  var c = new Const();
  t.equal(c instanceof Const, true, 'c should be instanceof Const');
  
  t.equal(c.constructor, Const, 'instance.constructor should be Const');
});

Ct.test("init", function(t) {

  var ConstInit = tiki.extend({ 
    init: function(bar) { this.foo = bar; }
  });
  
  var ConstNoInit = tiki.extend({});
  
  var c = new ConstInit('blah');
  t.equal(c.foo, 'blah', 'should call init() if defined [init sets c.foo = blah]');
  
  c = new ConstNoInit();
  t.equal(c instanceof ConstNoInit, true, 'should not raise exception when no init is defined');
});

Ct.test("extending a constructor", function(t) {
  var ConstA = tiki.extend({ 
    init: function() { this.foo = 'ConstA'; },
    constA: 'constA'
  });
  
  var ConstB = tiki.extend(ConstA, {
    init: function() { this.foo = 'ConstB'; },
    constB: 'constB'
  });

  var c = new ConstB();
  t.equal(c instanceof ConstB, true, 'c should be instance of ConstB');
  t.equal(c instanceof ConstA, true, 'c should also be instance of ConstA');
  t.equal(c.constructor, ConstB, 'c.constructor should be ConstB');
  
  t.equal(c.constB, 'constB', 'should have property constB defined on constB');
  t.equal(c.constA, 'constA', 'should have property constA inherited from constA');
  
  t.equal(c.foo, 'ConstB', 'should overwrite init() from ConstB');
  
});

Ct.test("extending a native object", function(t) {

  var Const = tiki.extend(Date, { foo: 'foo' });
  var c = new Const();
  t.equal(c instanceof Const, true, 'c should be instanceof Const');
  t.equal(c instanceof Date, true, 'c should also be instance of Date');
  t.equal(c.getTime, Date.prototype.getTime, 'c.getTime should inherit from Date.prototype.getTime()');
  
});

Ct.run();