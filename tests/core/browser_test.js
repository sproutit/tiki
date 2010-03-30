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
  "tiki:external": true,
  
  // means this package was a nested package inside of another package.  
  // therefore generic searches should ignore it.  Only those packages that 
  // specific have this as a dependency will be able to find it
  "tiki:private": false,
  
  "dependencies": {
    "tiki": "1.0.0",
    "core_test": "~2.0.1",
    "sproutcore-runtime": "=1.5.1"
  },
  
  // canonicalIds for nested packages.  nested packages are seen by this
  // package only
  "tiki:nested": {
    "sproutcore-runtime": "sproutcore-runtime/1.5.1/19348be93ca93f3e"
  },
  
  "tiki:base": "http://cdn.sprout.io/st/datastore/en/1234",

  "tiki:resources": ["stylesheet.css", "javascript.js", "images/foo.jpg"],
  
  "tiki:resources": [
    {
      "id":   "stylesheet", 
      "type": "stylesheet", 
      "ext":  ".css",
      "url":  "http://cdn.sprout.io/st/datastore/en/1234/stylesheet.css" 
    },
    
    { 
      "id":    "::sproutcore-datastore/1.2.0/1e3434be4a033941:javascript",  
      "name":  "javascript.js",
      "type":  "script",
      "url":   "http://cdn.sprout.io/st/datastore/en/1234/javascript.js" 
    },
    
    // this shortcut:
    "images/foo.png",
    
    // expands do:
    { 
      "id":   "images/foo", 
      "type": "resource", // assume resource unless ends in .css or .js 
      "ext":  ".jpg",
      "url":  "http://cdn.sprout.io/st/datastore/1234/images/foo.jpg"
    }
    
  ]

});

// asset normalized to:

var asset = {
  "id": "rsrc:sproutcore-datastore/1.2.0/1e3434be4a033941:images/foo.jpg",
  "url": "http://cdn.sprout.io/st/datastore/en/1234/images/foo.jpg"
};

// module register:
brequire.module("sproutcore-datastore/1.2.0/1e343be4a0033931:models/record", function(r,x,y,z) {
  // ... code
});

// indicates that a script resource has loaded.
brequire.script("sproutcore-datastore/1.2.0/1e343be4a0033932:javascript.js");
brequire.stylesheet("sproutcore-datastore/1.2.0/1e343be4a0033932:stylesheet.css");


