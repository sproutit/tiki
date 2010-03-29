// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('tiki:core');
var Ct = require('core_test:sync');

// equivalent of creating a require...
var brequire = new tiki.Browser();
brequire.setup();

// register a package - short form
brequire.register('sproutcore-datastore/1.2.0/1e3434be4a033941', {

  "name": "sproutcore-datastore",
  "version": "1.2.0",

  // means this info is just defined here so the loader knows how to 
  // load the package.  this is just a external reference.  The actual
  // modules will not be loaded.  If the same package is registers again and
  // external is false (or not found) them it will replace the current one
  "external": true,
  
  "dependencies": {
    "tiki": "pkg:tiki/1.0.0/1ea33fe4ab3495bd3",
    "core_test": "pkg:core_test/2.0.1/beaf1bcea3940583abce",
    "sproutcore-runtime": "pkg:sproutcore-runtime/1.5.1/cfe8a9384139ba82d"
  },
  
  "base": "http://cdn.sprout.io/st/datastore/en/1234",

  "resources": [
    { "id": "stylesheet.css", "type": "stylesheet" },
    { "id": "javascript.js",  "type": "script" },
    { "id": "images/foo.jpg", "type": "resource" }
  ]

});

// asset normalized to:

var asset = {
  "id": "rsrc:sproutcore-datastore/1.2.0/1e3434be4a033941:images/foo.jpg",
  "url": "http://cdn.sprout.io/st/datastore/en/1234/images/foo.jpg"
};

// module register:
brequire.define("sproutcore-datastore/1.2.0/1e343be4a0033931:models/record", function(r,x,y,z) {
  // ... code
});

// indicates that a script resource has loaded.
brequire.script("sproutcore-datastore/1.2.0/1e343be4a0033932:javascript.js");
brequire.stylesheet("sproutcore-datastore/1.2.0/1e343be4a0033932:stylesheet.css");


