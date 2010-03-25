// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================


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
