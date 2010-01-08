// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================

"use exports env args print stdin stdout platform global";

/** @file

  Defines the standard system module as required by CommonJS.  Note that 
  stdin, stdout, and stderr are not natively supported so we implement a 
  basic fake interface.
  
*/

if (require.loader) {
  exports.env = require.loader.ENV;
  exports.args = require.loader.ARGV;
}

var print = function(msg) { tiki.console.log(msg); };
exports.print = print;

var K = function() { return null; };

// stdin doesn't really work
exports.stdin = { read: K, readLine: K };

// stdout and stderr write to console
exports.stdout = exports.stderr = {
  write: print,
  writeLine: print,
  print: print
};

exports.platform = "tiki";

// this is a global object that can be shared by all modules.  For example,
// property binding searches begin here.
exports.global = window;

// always unload global window to avoid memory leaks
// we just swap the reference to exports.global in case other unload code runs
// later and tries to reference the global.  that code may still fail but at
// least we give it a fighting chance.
//
function _cl() { exports.global = {}; }
if (window.addEventListener) window.addEventListener('unload', _cl, false);
else if (window.attachEvent) window.attachEvent('onunload', _cl);
// else we can't catch the unload event.  worst case we leak, but probably we // won't since IE is the mostly likely problem and the above code handles it

