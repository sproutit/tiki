// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals browser userAgent info exports */

"export browser userAgent";
"export package info";

/**
  @file

  Export constants in this module that describe the capabilities of the target
  platform.  The most important property you can define here is HTML
*/


// ..........................................................
// BROWSER DESCRIPTION
// 

userAgent = navigator.userAgent.toLowerCase();

var version = (userAgent.match( /.+(?:rv|it|ra|ie)[\/: ]([\d.]+)/ ) || [])[1];

browser = {
  
  /** The current browser version */
  version: version,
  
  /** non-zero if webkit-based browser */
  safari: (/webkit/).test( userAgent ) ? version : 0,
  
  /** non-zero if this is an opera-based browser */
  opera: (/opera/).test( userAgent ) ? version : 0,
  
  /** non-zero if this is IE */
  msie: (/msie/).test( userAgent ) && !(/opera/).test( userAgent ) ? version : 0,
  
  /** non-zero if this is a miozilla based browser */
  mozilla: (/mozilla/).test( userAgent ) && !(/(compatible|webkit)/).test( userAgent ) ? version : 0,
  
  /** non-zero if this is mobile safari */
  mobileSafari: (/apple.*mobile.*safari/).test(userAgent) ? version : 0,
  
  /** non-zero if we are on windows */
  windows: !!(/(windows)/).test(userAgent),
  
  /** non-zero if we are on a mac */
  mac: !!((/(macintosh)/).test(userAgent) || (/(mac os x)/).test(userAgent)),
  
  language: (navigator.language || navigator.browserLanguage).split('-', 1)[0]
};

browser.isOpera = !!browser.opera;
browser.isIe = browser.msie;
browser.isIE = browser.msie;
browser.isSafari = browser.safari;
browser.isMobileSafari = browser.mobileSafari;
browser.isMozilla = browser.mozilla;
browser.isWindows = browser.windows;
browser.isMac = browser.mac;

/**
  The current browser name.  This is useful for switch statements. 
*/
browser.current = 
  browser.msie ? 'msie' : 
  browser.mozilla ? 'mozilla' : 
  browser.safari ? 'safari' : 
  browser.opera ? 'opera' : 'unknown' ;


// make this module visible as "info"
info = exports ;
