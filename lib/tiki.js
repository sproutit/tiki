// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================
/*jslint evil:true */

var sandbox = require('./sandbox'),
    loader  = require('./loader');
    
/**
  Tiki is the default source for a loader.
*/
var Tiki = function() {
  this.loader = loader.createLoader();
  this.loader.register(this); // add myself as source
  this.sandbox = sandbox.createSandbox(this.loader);
};

// ..........................................................
// LOADER SOURCE API
// 

Tiki.prototype.packageFor = function(packageId, vers, done) {
  
};

Tiki.prototype.packageList = function(done) {
  
};

// ..........................................................
// REGISTRATION API
// 

Tiki.prototype.main = function(moduleId, packageId, method) {

};

Tiki.prototype.define = function(packageId, desc) {
  
};

Tiki.prototype.script = function(scriptId) {
  
};

Tiki.prototype.stylesheet = function(stylesheetId) {
  
};

// ..........................................................
// DIAGNOSTIC TOOLS
// 

Tiki.prototype.ready = function(moduleId, vers) {
  
};

Tiki.prototype.inspect = function(moduleId, vers) {
  
};

exports.Tiki = Tiki;



