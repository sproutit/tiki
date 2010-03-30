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
MockPackage.prototype.canonicalPackageId = function(packageId, vers) {
  var packageFunc = tiki.Package.prototype.canonicalPackageId;
  if (!this.canNest) return packageFunc.call(this, packageId, vers);

  // support nesting
  var sourceFunc  = MockSource.prototype.canonicalPackageId;
  var pkg = this;
  var ret = packageFunc.call(pkg, packageId, vers);
  if (!ret) ret = sourceFunc.call(pkg, packageId, vers);
  return ret ;
};

MockPackage.prototype.packageFor = function(packageId) {
  var packageFunc = tiki.Package.prototype.packageFor;
  if (!this.canNest) return packageFunc.call(this, packageId);

  // support nesting
  var sourceFunc  = MockSource.prototype.packageFor;
  var pkg = this;
  var ret = packageFunc.call(pkg, packageId);
  if (!ret) ret = sourceFunc.call(pkg, packageId);
  return ret;
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

MockPackage.prototype.exists = function(moduleId) {
  if (this._mockModules && (this.mods.indexOf(moduleId)>=0)) return true;
  return tiki.Package.prototype.exists.call(this, moduleId);
};

MockPackage.prototype.load = function(moduleId) {
  if (this._mockModules && (this.mods.indexOf(moduleId)>=0)) {
    var factories = this._mockedFactories;
    if (!factories) factories = this._mockedFactories = {};
    if (!factories[moduleId]) {
      factories[moduleId] = new tiki.Factory(moduleId, this, function(r, e){
        e.moduleId = moduleId;
      });
      
      factories[moduleId].mockId = this.id+':'+moduleId;
    }
    return factories[moduleId];
  }
  
  return tiki.Package.prototype.load.call(this, moduleId);
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
MockSource.prototype.canonicalPackageId = function(packageId, vers) {
  
  var findFor = function(packages) {
    var idx, len = packages.length, working, wvers, ret, rvers;
    for(idx=0;idx<len;idx++) {
      working = packages[idx];
      if (working.get('name') !== packageId) continue;

      wvers = working.get('version');
      if (tiki.semver.compatible(vers, wvers)) {
        if (!ret || (tiki.semver.compare(wvers, rvers)>0)) {
          ret = working;
          rvers = wvers;
        }
      }
    }

    return ret ? ret.id : null;
  };
  
  // lookup in loaded packages and those waiting for use with ensure tests.
  var ret = findFor(this.packages);
  if (!ret && this.mockEnsures) ret = findFor(this.mockEnsures);
  return ret ;
};

// Just lookup the package for the canonical packageId
MockSource.prototype.packageFor = function(packageId) {
  var loc = this.packages.length;
  while(--loc >= 0) {
    var ret = this.packages[loc];
    if (ret.id === packageId) return ret;
  }
  return null;
};

// ensure a given package is loaded.  if the package is already in list,
// look it up.  If mockEnsure() is set, then add to packages list and 
// return.
MockSource.prototype.ensurePackage = function(canonicalId, done) {
  
  var findFor = function(packages) {
    if (!packages) return null;
    var loc = packages.length;
    while(--loc >= 0) {
      if (packages[loc].id === canonicalId) return packages[loc];
    }
    return null;
  };
  
  var found;
  
  if (findFor(this.packages)) return done(); // found
  if (found = findFor(this.mockEnsures)) {
    this.add(found);
    found.didLoad = true;
    setTimeout(done, 100); // pause for effect
  } else {
    done(new tiki.Package.NotFound(canonicalId, 'MockSource'));
  }
};

MockSource.prototype.addMockEnsures = function(pkgs) {
  if (arguments.length === 0) return this;
  if (pkgs instanceof tiki.Package) {
    pkgs = Array.prototype.slice.call(arguments);
  }
  
  if (!this.mockEnsures) this.mockEnsures = [];
  
  var idx, len = pkgs.length;
  for(idx=0;idx<len;idx++) this.mockEnsures.push(pkgs[idx]);
  return this;
};

MockSource.prototype.toString = function() {
  return 'MockSource';
};

