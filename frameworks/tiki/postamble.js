// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals tiki */

// This postamble runs when the loader and supporting modules are all 
// registered, allowing the real loader to replace the bootstrap version.
// it is not wrapped as a module so that it can run immediately.
"use modules false";
"require system/loader";
"require system/sandbox";
"require system/promise";

// note that the loader.setup method is safe so that calling this more than
// once will only setup the default loader once.
tiki = tiki.require('system/loader', 'tiki').setup(tiki, window);
