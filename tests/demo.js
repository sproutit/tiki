
var pkg, done;

// API for a module

require('moduleId', 'packageId' || pkg); // require('packageId:moduleId');
// requires a packageId:moduleId

require.async('moduleId', ['packageId' || pkg], function(err, exports) {});

require.packageFor('packageId', ['vers'], done);

// returns the module object (vs the exports) for the named module.  This 
// may not actually build the exports for the module - just returning the 
// factory info
require.module('moduleId', ['packageId' || pkg], function() {});

// returns true if the passed moduleId is ready to be invoked.  True if 
// module, package and all dependencies are loaded
require.ready('moduleId', ['packageId' || pkg]);

// async loads a named module/packageId - optionally passing exports back in

// module global
module.pkg = {}; // returns the owner package
module.exports = {}; // exports for this module
module.id = 'foo'; // 
module.resource('foo'); // returns the URL or file path

// only defined in seed.  This will register the passed path as the
// mainPackage.

// ..........................................................
// SANDBOX
// 

// the sandbox that contains instantiated modules.
require.sandbox = 'sandbox';
var sandbox ;

// requires the named module, returning the exports.  passing a callbac at the
// end makes it async
sandbox.require('moduleId', [['packageId', 'vers'] || pkg, module], done);

// returns the module object for a given module vs the exports which is 
// what you get from require()
sandbox.module('moduleId', [['packageId', 'vers'] || pkg, module], done);

// returns true if the passed module is ready.  false otherwise
sandbox.ready('moduleId', [['packageId', 'vers'] || pkg, module], done);

// resets the sandbox.  any modules already instantiated will instantiate
// again
sandbox.clear();

// ..........................................................
// LOADER
// 

// the loader used by the sandbox to obtain factory functions.
var loader = sandbox.loader;

// returns a canonical ID that uniquely identifies the module that should 
// load.  you need to pass in a moduleId, optional packageId or pkg, optional
// vers.  Also pass in the current module object (or an object with an "id"
// and "ownerPackage" property.).  Passing done makes this run async
loader.canonical('moduleId', [['packageId', 'vers'] || pkg, module], done);

// loads the named module - returns a factory.  Invoke with the format:
//  module = factory.call(sandbox);

loader.load('moduleId', [['packageId', 'vers'] || pkg, module], done);

// loads the named package - if you do not pass a vers looks for compatible
// otherwise matches to version exactly.  If not invoked with done() then 
// runs sync.
loader.packageFor('packageId', ['vers', pkg], done);

// returns all packages visible within a given package context.
loader.packageList([pkg], done);

// returns all packages this package depends on directly or indirectly - 
// including specific versions
var expand;
loader.requiredPackages(pkg, [expand], done);

// clears any cached info for the named packageId.  This will cause a factory
// to be refetched the next time around
loader.clear('packageId', ['vers', pkg], done);

// returns an id uniquely identifying the package matching the specified 
// context
loader.canonicalPackageId('packageId', ['vers', pkg], done);

// ..........................................................
// SOURCE
// 

// OK - and a loader depends on one or more SOURCES to actually provide 
// info.  In seed sources include your main install locations, user-local
// and your workingPackage (i.e. the root package where you started from)
var source = loader.sources[0];

// returns a package instance matching the version number - optionally 
// returning null if no match is found
source.packageFor('packageId', ['vers'], done);

// returns the complete list of packages and versions known to the loader
source.packageList(done);

// ..........................................................
// PACKAGE
// 

// A package instance represents a package config and its modules.
pkg.get('name'); // gets a package config attribute
pkg.set('foo', 'bar'); // sets a package config attribute
pkg.id = 'foo' ; // package name

// returns the required version for the packageId - if any.  Otherwise returns
// null for no required version.
pkg.requiredVersion('packageId');

// returns true if the moduleId exists in the named package
// this will use any factory plugins to detect the module presence in seed
// in tiki this just looks to see if the module has been registered
pkg.exists('moduleId', done);

// returns a factory for the module.
pkg.load('moduleId', done);


// ..........................................................
// FACTORY
// 
// A factory knows how to create some exports.  It can also contain any 
// other pragmas as a helper

var factory = {};

// invoked to actually create the exports for a sandbox.  Should use the 
// sandbox to get the modules.  This method is responsible for generating the
// require() function passed to the factory itself.
var exports = factory.call(sandbox);

// other pragmas are written directly onto the factory function
factory.exports = ['foo', 'bar', 'etc'];

// ..........................................................
// index
// 

// This is the main entry point.  It shows up in the global namespace as 
// 'require'. - this maps to a default loader/sandbox.  In the browser, this
// is the default 'source' for the loader.
var tiki;

tiki.require = tiki; // does a require() using latest packages available
tiki.async = function() {}; // like require() but async

// set the main module/package and an optional method to invoke when the app
// is running
var method;
tiki.main('moduleId', ['packageId' || pkg, [method]]);

// defines a package (if you don't use ':') or module (if you do)
tiki.define('packageId', {  });

tiki.packageFor('packageId'); // returns the package if registered

// returns true if the passed moduleId/packageId is ready
tiki.ready('moduleId', ['packageId' || pkg, 'vers']);

// register a script when it loads
tiki.script('scriptId');

// register a stylesheet when it loads
tiki.stylesheet('stylesheetId');

