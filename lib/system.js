// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals env args stdin stdout stderr ENV ARGV system exports print platform global tiki */

"export env args stdin stdout stderr platform global";

/** @file

  Defines the standard system module as required by CommonJS.  Note that 
  stdin, stdout, and stderr are not natively supported so we implement a 
  basic fake interface.
  
*/

if (require.loader) {
  env = require.loader.ENV;
  args = require.loader.ARGV;
}

print = function(msg) { tiki.console.log(msg); };

var K = function() { return null; };

// stdin doesn't really work
stdin = { read: K, readLine: K };

// stdout and stderr write to console
stdout = stderr = {
  write: print,
  writeLine: print,
  print: print
};

platform = "tiki";

// this is a global object that can be shared by all modules.  For example,
// property binding searches begin here.
global = window;

// always unload global window to avoid memory leaks
tiki.unload(function() { global = exports.global = null; });
