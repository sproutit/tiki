# Integrating Tiki

Tiki comes with all the parts you need to build a CommonJS runtime.  You just
need to extend some basic components to supply the proper data source when 
needed.

> Please see the [Tiki Architecture](architecture.html) page for an overview
> of the Tiki components before continuing.

# The Basics

Usually when using Tiki you will just need to create a Sandbox and a Loader 
to get things going.  You won't need to modify these components at all to use
them.  

Likewise, when loading modules, you can usually just create Factory objects without change as well.  If your factory functions don't take the traditional
CommonJS arguments (i.e. require, exports, module), then you may need to 
override the Factory object to provide your own implementation of the call()
method.

Most of the work you put into using Tiki will invoke implementing the Source
protocol and extending the Package class to work with it.  Sources are used
by the loader to locate and load packages.  Packages are used to load module
factories.  Each of these classes requires that you implement a few common
methods for them to work.

Once you've implemented these classes, you can just assemble your three main
pieces: sandbox, loader, and source(s) and you should be good to go.

# Defining a Source

A source is used by the loader to find and load packages (which contain the
modules).  Unlike other classes in Tiki, Source is just an API; you implement
a source anyway you like as long as you support the methods described below.

Loaders can support one or more sources.  Each source can be implemented in 
an entirely different way.  One might load from the server, another might use
a database, and so on.

To implement a source, create an object that responds to the following three
methods:

__`canonicalPackageId(packageName, vers)`__:

This should return the canonical package id matching the passed package name
and optional version.  If your source does not contain a package by that name,
it should return null.

If your source contains multiple packages with the same name, it should return
the latest version that is compatible with the passed version string using the
semver standard.  (Tiki contains a full semver library you can use to do a
comparison).  If the vers parameter is null, just return the latest version
you have period.

Returning a value from this method indicates that you could, potentially,
load this package if needed at some point.  It does _not_ necessarily means 
that the package is available immediately.  For example, in the browser, a 
source may know how to retrieve a given package from the server but may not 
yet have the data locally.  In this case, it would still return a canonicalId.

The exact return value from this method is not important except that it must
begin with two colons ('::') and it _must_ be globally unique amongst all the 
packages that might be loaded.  

By convention, a canonical packageId is usually a combination of the packageId
and package version like so:

	`my_package/2.0.2`
	
If you want to be even more specific, you could generate a hash code based on
the package content:

	`my_package/1efa38bc29c92d28ae291bed`

This second approach would allow you to load multiple packages, even with the
same version.  Note that "private" or "nested" packages should not be returned
by this method, only top-level packages known to the source.

__`packageFor(canonicalId)`__

This should actually load and return a Package instance for the passed 
canonicalId.  The canonicalId will always be a value return by a previous
call to canonicalPackageId().

If the package is not available locally, you should return null.  For example,
if a package is stored on the local disk, this method would be expected to 
load it.  But if it is stored on a remote server and still needs to be 
downloaded, then this method should return null.

__`ensurePackage(canonicalId, done)`__

This method should determine if the package for the named canonicalId is available locally.  If not, it should asynchronously download the package and 
then invoke the passed callback when complete.  The canonicalId will always be 
a value returned by a previous call to canonicalPackageId().

If a package is already available locally, ensurePackage() should invoke the
callback immediately (or during the next turn of the event loop if preferred).

If an error occurs while processing, invoke the passed callback, passing an
error object as the first parameter.  If no errors occurs, then invoke the 
callback with no parameters.

On a successful callback, this method will almost always be followed by a call
to packageFor() to retrieve the actual package.


# Defining a Package

Packages are responsible for loading modules they contain.  They may also, 
optionally, load "nested" or "frozen" packages.  

To support just loading of modules, you must extend the tiki.Package class
and implement two methods like so:

	var tiki = require('tiki');
	var MyPackage = tiki.extend(tiki.Package);
	
	MyPackage.prototype.exists = function(moduleId) {
		//...
	};
	
	MyPackage.prototype.load = function(moduleId) {
		//...
	};
	
The two methods you need to implement are:

__`exists(moduleId)`__

This method should return true if the package contains the passed moduleId.
Return false otherwise.  Your package will only be asked to load a module if
it first returns true to this method.

__`load(moduleId)`__

This method should return a Factory instance for the passed moduleId.  Usually
this means loading the module from disk.

The loader will cache the results of this method; it is not necessary to do
any caching yourself in this method.

## Supporting Nested Packages

Nested packages provide a way for a package to ensure a particular version of 
a package is always used for its own modules no matter what.  If module in a
package tries to load one of its nested packages, the nested package will 
always be used, even if any version of the same package exists in other 
sources.

Supporting nested packages is optional.  To support them, you must implement
essentially the same three methods you implement for a Source:

__canonicalPackageId(packageName, vers)__

Return a canonical packageId for the package if you have a nested package
with the same name _and_ it is a compatible version with the passed vers
string.  If vers is null, return the latest version of the package that you
have.

Like sources, your returned value MUST be globally unique.  Since the same
package name and version may exist elsewhere, it is typical to prefix the 
package's canonicalId with your own.  For example, the `foo` package nested
inside of `bar` might have the id:

	`bar/1.2.1/foo/2.3.1`
	
__packageFor(canonicalId)__

Return the nested package instance for the canonicalId or null if the package
is not available locally.

__ensurePackage(canonicalId, done)__

Verifies that the package is available locally.  If not, it should attempt to
download it.  Invoke the passed callback immediately if package is available 
or whenever the download is complete.  Invoke callback with an error object if
there is an error.


