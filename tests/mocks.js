// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

/**
  @file
  
  Create mock packages and sources for use when testing the loader and other
  specific tiki parts.
*/

var tiki = require('tiki:core'),
    MockPackage, MockSource;

// ..........................................................
// HELPERS
//

// fake package 'foo'.  Has modules 'bar' and 'bar/baz'
MockPackage = tiki.Package.extend();
exports.MockPackage = MockPackage;

MockPackage.prototype.init = function(name, version) {
  var pkgId = name+'/'+version;
  var deps = (name === 'foo') ? { 'bar': '2.0.1' } : {};
  
  this.packages = [];
  tiki.Package.prototype.init.call(this, pkgId, {
    name: name,
    version: version,
    dependencies: deps
  });
  return this;
};

// NESTING
MockPackage.prototype.canNest = false;

// for nested packages
MockPackage.prototype.add = function(pkg) {
  this.packages.push(pkg);
};

// use default impl.  if that doesn't work, borrow MockSource impl
MockPackage.prototype.canonicalPackageId = function(packageId, vers, done) {
  var packageFunc = tiki.Package.prototype.canonicalPackageId;
  if (!this.canNest) return packageFunc.call(this, packageId, vers, done);

  // support nesting
  var sourceFunc  = MockSource.prototype.canonicalPackageId;
  var pkg = this;
  packageFunc.call(pkg, packageId, vers, function(err, ret) {
    if (err || ret) return done(err, ret);
    sourceFunc.call(pkg, packageId, vers, done);
  });
};

MockPackage.prototype.packageFor = function(packageId, loadIfNeeded, done) {
  var packageFunc = tiki.Package.prototype.packageFor;
  if (!this.canNest) return packageFunc.call(this, packageId, loadIfNeeded, done);

  // support nesting
  var sourceFunc  = MockSource.prototype.packageFor;
  var pkg = this;
  packageFunc.call(pkg, packageId, loadIfNeeded, function(err, ret) {
    if (err || ret) return done(err, ret);
    sourceFunc.call(pkg, packageId, loadIfNeeded, done);
  });
};

// MODULES
MockPackage.prototype.mockModules = function(moduleId) {
  var mods = Array.prototype.slice.call(arguments), 
      loc  = mods.length;

  this._mockModules = true;
  if (!this.mods) this.mods=[];
  while(--loc >= 0) this.mods.push(mods[loc]);
  return this;
};

MockPackage.prototype.exists = function(moduleId, done) {
  if (this._mockModules && (this.mods.indexOf(moduleId)>=0)) {
    return done(null, true);
  }
  tiki.Package.prototype.exists.call(this, moduleId, done);
};

MockPackage.prototype.load = function(moduleId, done) {
  if (this._mockModules && (this.mods.indexOf(moduleId)>=0)) {
    var factories = this._mockedFactories;
    if (!factories) factories = this._mockedFactories = {};
    if (!factories[moduleId]) {
      factories[moduleId] = new tiki.Factory(moduleId, this, function(){});
      factories[moduleId].mockId = this.id+':'+moduleId;
    }
    return done(null, factories[moduleId]);
  }
  tiki.Package.prototype.load.call(this, moduleId, done);
};

// source just searches any passed packages
MockSource = tiki.extend(Object);
exports.MockSource = MockSource;


MockSource.prototype.init = function() {
  this.packages = Array.prototype.slice.call(arguments);
};

MockSource.prototype.add = function(pkgs) {
  if (arguments.length === 0) return this;
  if (pkgs instanceof tiki.Package) {
    pkgs = Array.prototype.slice.call(arguments);
  }
  
  var idx, len = pkgs.length;
  for(idx=0;idx<len;idx++) this.packages.push(pkgs[idx]);
  return this;
};

// simple implementation required by canonical().  Just find the latest pkg
// with the same name and compatible version.
MockSource.prototype.canonicalPackageId = function(packageId, vers, done) {
  var idx, len = this.packages.length, working, wvers, ret, rvers;
  for(idx=0;idx<len;idx++) {
    working = this.packages[idx];
    if (working.get('name') !== packageId) continue;
    
    wvers = working.get('version');
    if (tiki.semver.compatible(vers, wvers)) {
      if (!ret || (tiki.semver.compare(wvers, rvers)>0)) {
        ret = working;
        rvers = wvers;
      }
    }
  }
  
  if (ret) return done(null, ret.id);
  return done();
};

// Just lookup the package for the canonical packageId
MockSource.prototype.packageFor = function(packageId, fetchIfNeeded, done) {
  var loc = this.packages.length;
  while(--loc >= 0) {
    var ret = this.packages[loc];
    if (ret.id === packageId) return done(null, ret);
  }
  return done(); // not found
};
