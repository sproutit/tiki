// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals env args stdin stdout stderr ENV ARGV system exports print platform global */

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

var K = function() { return null; };

if (typeof console !== 'undefined') print = console.log;
if (!print) print = K;


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
global = {};

