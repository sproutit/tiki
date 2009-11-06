// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================

"export package global";
"export reset";

// exports a global object representing the current global.  you can reset 
// the global by importing this module directly.

// if you have env.global, use that
reset = function() {
  global = require.env.global || {} ;
};

reset();
