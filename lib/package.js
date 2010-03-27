// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

/**
  Package expects you to register the package with a config having the 
  following keys:
  
    {
      "id":   "canonicalId" - this is the id used to register modules
      "name": "name-of-package" (vs canonical id)
      "version": current version of package (if known)
      
      // these are dependencies you require to run.  If the package is 
      // async loaded, these will be the ones loaded
      "dependencies": {
         "package-name": "version"
      },
      
      // these map a specific package-name/version to a canonicalId that must
      // be registered for the package to be loaded.  You may include 
      // additional packages here that may be referenced but are not required
      // to run (for example - lazy loaded packages)
      //
      // This also forms the universe of packages this particular package can
      // reference.
      //
      "tiki:packages": {
        "package-name": [
          { "version": "1.0.0", "id": "canonicalId", "url": "url" }
        ]
      },

      // ids mapped to urls.  all of these scripts must be loaded for this 
      // package to be considered ready 
      "tiki:scripts": {
        "id": "url"
      },
      
      // stylesheets that must be loaded for this package to be considered
      // ready.  The id is used so that the URL can load from a relative path
      // that may move around and still be accurate.
      "tiki:stylesheets": {
        "id": "url",
        "id": "url"
      },
      
      // maps asset paths for non-JS and non-CSS assets to URLs.  Used to 
      // progrmatically load images, etc.
      "tiki:resources": {
        "asset/path": "url",
        "asset/path": "url"
      }
    }

  This registration ensures that the package and it's related assets are 
  loaded.
*/
     
var Package = function(id) {
  this.id = id;
};

Package.prototype.get = function(key) {
  return this.config[key];
};

Package.prototype.set = function(key, value) {
  this.config[key] = value;
  return this;
};

Package.prototype.requiredVersion = function(packageId) {
  
};

Package.prototype.exists = function(moduleId, done) {
  
};

Package.prototype.load = function(moduleId, done) {
  
};

exports.Package = Package;
