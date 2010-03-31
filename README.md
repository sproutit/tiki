`===========================================================================
 Project:   Tiki - CommonJS Microkernel
 Copyright: ©2009-2010 Apple Inc.
 ===========================================================================`

Tiki is a package-aware CommonJS microkernel for both the browser and the 
command line.  

Tiki focuses on managing modules, grouped into independent packages and that's all.  It does not implement any more of the CommonJS API.  Instead, you can
select the packages you want to use to obtain exactly the kind of API you 
want to work with.  This makes it easier to compose just the kind of runtime
you wish when writing code while still remaining compatible with other 
JavaScript libraries.
 
# Tiki and Packages

Tiki differs from most CommonJS runtimes in that it is aware of _packages_.
A package is a bundle of one or more CommonJS modules along with any 
associated assets.  Packages are generally versioned and may contain other 
metadata in a `package.json` file that must be included at the top level of
a package.

Packages are easy to share between runtimes and through package managers 
because they use a common format to store code and metadata.

In Tiki, you load modules by specifically naming the package you expect the
module to be found in.  For example, if you wanted to load the "markdown" 
module from the "formatters" package you could do:

	var markdown = require('formatters:markdown');
	
You can also use the draft CommonJS standard:

	var markdown = require('markdown', 'formatters');
	
When you require a module from another package, Tiki will search your system 
for a matching package.  In the event it finds multiple versions of the same
package, Tiki will select the newest compatible package.  You can specify 
which package versions you are compatible with in your package.json file using
semantic versioning.

In addition to naming individual modules within a package, you can simply
request to load a package by name only:

	var formatters = require('formatters');
	
This will first look for a module named "formatters" in your own package. If
that is not found, it will look for a package named "formatters" and then 
attempt to load the "formatters:index" module or the "formatters:formatters"
module, depending.

Other than allowing you to namespace your module ids with packages, Tiki 
basically implements the semantics for modules defined in CommonJS Modules 
1.1.

# Using Tiki in the Browser

To use tiki in the browser, you just need to build the tiki.js JavaScript and 
then load it via a script tag like so:

	<script src="/path/to/tiki.js" type="text/javascript"></script>
	
Once tiki has loaded, you will have a new global object "tiki" that exposes
a registration API you will need to use to register packages as they load.
A number of tiki-aware build systems are in development that will 
automatically wrap JS in registration calls to tiki.

To get a module out of tiki, just use:

	var exports = tiki.require('packageId:moduleId');
	
This will find the `moduleId` module in the `packageId` package and return it.
Within tiki modules, you can just use the require() method provided to the
module to obtain other modules the same way.

# Using Tiki From the Command Line

Usually you won't use tiki directly from the command line.  Instead you should
use a system that integrates it such as the [seed package manager](http://seedjs.org).

All of tiki is contained in the lib/tiki.js file, however.  You can load this
file into just about any JS runtime to get all the tiki components.  Just 
assemble the pieces and you'll have a runtime up in no time.  See the docs for
more information.

	