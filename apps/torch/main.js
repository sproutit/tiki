// ==========================================================================
// Project:   Torch
// Copyright: ©2009 My Company, Inc.
// ==========================================================================
/*globals Torch */

"import core";
"export package main";

// This is the function that will start your app running.  The default
// implementation will load any fixtures you have created then instantiate
// your controllers and awake the elements on your page.
//
// As you develop your application you will probably want to override this.
// See comments for some pointers on what to do next.
//
Torch.main = function main() {
  require('sample_test').plan.run();
} ;

main = function main() { Torch.main(); }
