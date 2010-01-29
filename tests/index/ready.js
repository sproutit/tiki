// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

// Note: these tests verify that ready() and ready.fire() behave as expected.
// they can't really verify the browser events however so there may still be
// some bugs.  Hopefully this coverage will catch most things however.


Ct.module("tiki.ready()");

// make ready look like it does on page load...
var resetReady = function() {
  tiki.ready.isReady = false;
  tiki.ready.queue   = null;
  tiki.ready.cleanup = null; 
};
Ct.setup(resetReady);
Ct.teardown(resetReady);

// ..........................................................
// BASIC TESTS
// 

Ct.test("basic calls to ready()", function(t) {
  var obj = {
    cnt: 0,
    handler: function(amt) { 
      if (amt === undefined) this.cnt++;
      else this.cnt += amt;
    }
  };
  
  var cleanupCount = 0;
  tiki.ready.cleanup = function() { cleanupCount++; };
   
  t.equal(tiki.ready.isReady, false, 'precond - tiki.ready.isReady should be false');

  tiki.ready(obj, 'handler'); // try passing a string...
  tiki.ready(obj, obj.handler); // try passing a function
  tiki.ready(obj, obj.handler, 10); // try passing an argument
  
  t.equal(obj.cnt, 0, 'obj.cnt should remain 0 (meaning nothing fired)');

  t.equal(cleanupCount, 0, 'ready.cleanup() should not be called before fire');
  tiki.ready.fire(); // simulate becoming ready
  t.equal(cleanupCount, 1, 'ready.cleanup() should be called once on first fire');
  t.equal(tiki.ready.isReady, true, 'ready.isReady should now be true');
  
  t.equal(obj.cnt, 12, 'all handlers should fire when tiki.ready becomes ready. [obj.cnt should have update from all three handlers]');
  
  tiki.ready.fire(); // simulate a second ready event [from onload]
  t.equal(cleanupCount, 1, 'ready.cleanup() should only be called once');
  
  t.equal(obj.cnt, 12, 'handlers should not fire on 2nd call to fire() [obj.cnt should not change]');
  
  tiki.ready(obj, 'handler', 10);
  t.equal(obj.cnt, 22, 'handler should fire immediately (changing obj.cnt) since tiki.ready.isReady');
  
});

Ct.test('ready.main()', function(t) {

  var obj = {
    readyCount: 0,
    mainCount: 0,
    
    readyHandler: function() {
      t.equal(this.mainCount, 0, 'main handler should not be invoked while ready is still running');
      this.readyCount++;
    },
    
    mainHandler: function(amt) {
      t.equal(this.readyCount, 1, 'ready handler should have been called before main');
      if (amt === undefined) this.mainCount++;
      else this.mainCount += amt;
    }
  };
  
  tiki.ready(obj, obj.readyHandler);
  tiki.ready.main(obj, 'mainHandler');
  tiki.ready.main(obj, obj.mainHandler);
  tiki.ready.main(obj, 'mainHandler', 10);

  t.equal(obj.readyCount, 0, 'ready handler should not fire yet');
  t.equal(obj.mainCount, 0, 'main handler should not fire yet');
  
  tiki.ready.fire();
  
  t.equal(obj.readyCount, 1, 'ready handler should have fired');
  t.equal(obj.mainCount, 12, 'all main handlers should have called');
});

// ..........................................................
// SPECIAL CASES  - add any edge cases here
// 


Ct.run();
