// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*globals tiki ENV ARGS */

// This postamble runs when the loader and supporting modules are all 
// registered, allowing the real loader to replace the bootstrap version.
// it is not wrapped as a module so that it can run immediately.
"use modules false";
"use loader false";

// note that the loader.start method is safe so that calling this more than
// once will only setup the default loader once.
tiki = tiki.start();
tiki.replay(); // replay queue