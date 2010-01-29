// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var Ct = require('core_test');

// Note: these tests verify that unload() and unload.fire() behave as 
// expected. they can't really verify the browser events however so there may 
// still be some bugs.  Hopefully this coverage will catch most things 
// however.


Ct.module("tiki.unload()");

// make unload look like it does on page load...
var resetUnload = function() {
  tiki.unload.isUnloading = false;
  tiki.unload.queue   = null;
  tiki.unload.cleanup = null; 
  tiki.unload.isScheduled = false;
};
Ct.setup(resetUnload);
Ct.teardown(resetUnload);

// ..........................................................
// BASIC TESTS
// 

Ct.test("basic calls to unload()", function(t) {
  var obj = {
    cnt: 0,
    handler: function(amt) { 
      if (amt === undefined) this.cnt++;
      else this.cnt += amt;
    }
  };

  var cleanupCount = 0;
  
  t.equal(tiki.unload.isUnloading, false, 'precond - tiki.ready.isUnloading should be false');
  t.equal(tiki.unload.cleanup, null, 'precond - should not yet have a cleanup function registered');

  tiki.unload(obj, 'handler'); // try passing a string...
  tiki.unload(obj, obj.handler); // try passing a function
  tiki.unload(obj, obj.handler, 10); // try passing an argument

  t.equal(tiki.typeOf(tiki.unload.cleanup), tiki.T_FUNCTION, 'tiki.unload.cleanup should now be a function');

  // now that cleanup is verified, swap it a custom cleanup that we can 
  // measure
  var oldcl = tiki.unload.cleanup;
  tiki.unload.cleanup = function() {
    cleanupCount++;
    oldcl.apply(tiki.unload, arguments);
  };
  
  t.equal(obj.cnt, 0, 'obj.cnt should remain 0 (meaning nothing fired)');

  tiki.unload.fire(); // simulate becoming ready
  t.equal(cleanupCount, 1, 'unload.cleanup() should be called once on first fire');
  
  t.equal(obj.cnt, 12, 'all handlers should fire when tiki.unload isUnloading. [obj.cnt should have update from all three handlers]');
  
  tiki.unload.fire(); // simulate a second unload for some reason
  t.equal(cleanupCount, 1, 'unload.cleanup() should only be called once');
  
  t.equal(obj.cnt, 12, 'handlers should not fire on 2nd call to fire() [obj.cnt should not change]');
  
  tiki.unload(obj, 'handler', 10);
  t.equal(obj.cnt, 22, 'handler should fire immediately (changing obj.cnt) since tiki.unload.isUnloading');

  oldcl = null;
  
});


// ..........................................................
// SPECIAL CASES  - add any edge cases here
// 


Ct.run();
