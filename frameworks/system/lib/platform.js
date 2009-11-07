// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================

"export package PLATFORM PLATFORM_PACKAGE info env";
"use factory_format function";

/**
  @file

  The platform framework implements low-level modules for the current target
  platform.  To access a platform-specific module, use the require method 
  exported by this package like so:
  
  {{{
    sys = require('system');
    mod = require('module', sys.PLATFORM_PACKAGE);
  }}}
  
*/

/**
  Name of the package for the current platform.  Computed from the current
  global env hash passed in to tiki.setup().  You must include either a 
  platform name or a platformPackage property that describes the package 
  exactly.
  
  @property {String}
*/
PLATFORM_PACKAGE = null;

/**
  Name of the current platform.
  
  @property {String}
*/
PLATFORM = platform = 'unknown';

// compute the default platform package name
var env;

if (env = require.env) {
  platform = PLATFORM = env.PLATFORM || env.platform;
  PLATFORM_PACKAGE = env.PLATFORM_PACKAGE || env.platformPackage;
  if (!PLATFORM_PACKAGE && platform) {
    PLATFORM_PACKAGE = 'platform/' + platform;
  }
}

// get the info for the current platform
info = require('info', PLATFORM_PACKAGE);

env = require.env;
