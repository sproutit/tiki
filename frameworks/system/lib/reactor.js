// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals reactor PLATFORM_PACKAGE schedule reactor cancel Invocation exports */

"import core lib/platform lib/invocation";
"export schedule cancel";
"export package reactor";

var platform = require(PLATFORM_PACKAGE);

// internal method fires and invocation and cleans up
function _invoke() {
  this.invoke();
  this._timer = this._repeats = null;
  this.release();
}

/**
  Schedules the passed invocation to execute after the specified amount of 
  time.  Returns an invocation object you can use to cancel.
*/
schedule = function(after, target, method, args) {
  if (!(target instanceof Invocation)) {
    target = Invocation.create(target, method, arguments, 3);
  } else target.retain();

  target._timer = platform.timer.schedule(after, target, _invoke);
  target._repeats = false;
  return target;
};

/**
  Cancels a scheduled invocation.
*/
cancel = function(inv) {
  if (inv._timer) platform.timer.cancel(inv._timer, inv._repeats);
  inv._timer = inv._repeats = null;
  return inv;
};


reactor = exports;

