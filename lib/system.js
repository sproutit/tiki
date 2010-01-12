// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
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
tiki.unload(function() { exports.global = {}; });

