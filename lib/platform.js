// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================

"export package PLATFORM_PACKAGE PLATFORM platform";
"use factory_format function";

/**
  @file

  The platform framework implements low-level modules for the current target
  platform.  To access a platform-specific module, use the require method 
  exported by this package like so:
  
  {{{
    mod = require('platform:package').platform('module');
  }}}
  
*/

/**
  Name of the package for the current platform.  Computed from the current
  global env hash passed in to tiki.setup().  You must include either a 
  platform name or a platformPackage property that describes the package 
  exactly.
  
  @property {String}
*/
var PlATFORM_PACKAGE = null;

/**
  Name of the current platform.
  
  @property {String}
*/
var PLATFORM = 'unknown';

// compute the default platform package name
var env;

if (env = require.env) {
  PLATFORM = env.platform;
  if (!(PLATFORM_PACKAGE = env.platformPackage)) {
    if (env.platform) PLATFORM_PACKAGE = 'platform/' + env.platform;
  }
}

var cache = {}, TMP_ARY = [PLATFORM_PACKAGE];

/**
  Returns the corresponding module in the current platform package.
  
  @param {String} moduleName the name of the package
  @returns {Obejct} exports for the named module or null
*/
platform = function(moduleName) {
  if (!PLATFORM_PACKAGE) return null; // no platform available

  var ret = cache[moduleName];
  if (!ret) {
    TMP_ARY[1] = moduleName;
    ret = TMP_ARY.join((moduleName.indexOf(':')>=0) ? '/' : ':');
    cache[moduleName] = ret ;
    TMP_ARY[1] = null;
  }
  
  return require(ret);
};
