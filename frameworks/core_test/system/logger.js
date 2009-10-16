// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals CoreTest BrowserLogger */

"import core utils";
"export package BrowserLogger";

/**
  The BrowserLogger can be used to log test output to the main web page.  
*/
BrowserLogger = function BrowserLogger() {
  return this ;
}

BrowserLogger.prototype = {
  constructor: BrowserLogger
};
