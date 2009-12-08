// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals env args stdin stdout stderr ENV ARGV system exports print */

"export env args stdin stdout stderr";
"export package system ENV ARGV print";

/** @file

  Defines the standard system module as required by CommonJS.  Note that 
  stdin, stdout, and stderr are not natively supported so we implement a 
  basic fake interface.
  
*/

ENV = env = require.loader.ENV;
ARGV = args = require.loader.ARGV;
print = function() { 
  console.log.apply(console, arguments); 
};


// stdin doesn't really work
stdin = {
  read: function() { return null; },
  readLine: function() { return null; }
};

// stdout and stderr write to console
stdout = stderr = {
  write: print,
  writeLine: print,
  print: print
};

system = exports; // always include this in global exports


