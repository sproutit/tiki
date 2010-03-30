# Tiki Browser Support

Tiki comes with support for running in the web browser built in.  To run in
the browser, you just need to build and load the tiki.js script.  

Since the browser doesn't have access to the file system, all packages and 
modules must be registered with tiki before you can use them.  Usually the 
scripts loaded from the server will wrap your code in registration calls on 
tiki automatically.  You can also add them yourself.

# Tiki Registration API

Register packages using the tiki.register() method.  You must register all
packages before you reference them, even if you don't intend to load the 
modules until later.  You can register a package at any time, but tiki won't
know anything about the package until you register it.

	tiki.register('canonicalPackageId', { .. definition .. });

## About Canonical Package IDs
	
The first param is the canonical id for your package.  This ID must be 
unique among all the packages that you register.  Usually a canonicalId has 
the following format:

	'::[name]/[version|hashCode]'
	
Where the name is the package name, version is the package version.  If 
possibly, you should compute a unique hash code for the package based on the
package contents and use that instead of the package version since this will
ensure that the package is unique even if multiple packages with the same
version number are loaded.

## About Package Definitions

A package definition is essentially the same content you would include in a 
package.json file with a few special keys added as well.  Here is an example
definition we can dissect:

	{
		"name": "hello_world",
		"version": "1.0.0",
		
		"dependencies": {
			"tiki": "1.2.1",
			"core_test": "2.0.0",
			"private": "1.6.1"
		}
		
		"tiki:external": false,
		"tiki:private":  false,
		
		"tiki:nested": {
			"hello_world/private": "hello_world/private/eb3a2904dceb23af"
		},
		
		"tiki:base": "http://cdn.myapp.com/static/hello_world/en/1234",
		
		"tiki:resources": ["stylesheet.css", "javascript.js", "image/foo.jpg"]
	}
	
The definition above lists all of the keys that are used by the Tiki loader
to work with packages.  You may include any other keys that you may want to
use from within your module code as well, but Tiki will not do anything 
special with them.

Note that when you retrieve a package instance from within tiki, the package
will contain the config you specify here.

Also, Tiki will automatically add the "id" property to your definition when
processing the registration.  This property will contain the canonicalId of
the package.

### Standard Properties

Tiki understands the following properties:

*	__`name`__: Standardized name of the package
*	__`version`__:	Package version
*	__`dependencies`__: Hash of package names and versions required by this
	package.  The version number should be a semantic version and may be 
	prefixed with a '=' (which means exact match only) or '~' (compatible 
	match).

When you call require.ensure('moduleId') from within your code, Tiki will 
use the dependencies hash to ensure that all dependent packages are 
registered.

### Non-Standard Properties

Tiki understands several non-standard properties as well.  All non-standard
properties are prefixed with 'tiki:' to avoid interfering with other standard
properties:

*	__`tiki:external`__: If true, indicates that this package definition is 
	just an external reference. (See below)

*	__`tiki:private`__: If true, indicates the package is a private version
	owned by another package.  It will never be returned from general searches
	for the package.

*	__`tiki:nested`__: Hash of package names to canonicalIds for packages that
	are "nested" or "frozen" inside of this package.  Nested versions of a 
	package will override any globally installed ones.  Usually any packages
	listed in the nested hash should themselves have tiki:private set to true

*	__`tiki:base`__: The base URL to use when computing URLs for resources.
	This is optional unless you name resources without corresponding URLs.

*	__`tiki:resources`__: All resources known to the package including any 
	scripts, stylesheets or other images.  This array is used to discover 
	resources using the module.resource() method.  It is also used to load
	scripts and stylesheets as needed.

## About Resources

The `tii:resources` property should always point to an array of resource 
descriptors.  A resource descriptor has the following format:

	{
		"id": "::hello_world/1.0.0/3eb29abcd3fe20a:javascript.js",
		"name": "javascript.js",
		"type": "script",
		"url":  "/st/hello_world/en/3eb29abcd3fe20a/javascript.js"
	}
	
Here is what each property means:

*	__`id`__: Uniquely identifies the resource.  Usually the packageId + name
*	__`name`__: Package-specific name.  Used to match asset name when calling
	module.resource()
*	__`type`__: Determines how the asset is loaded.  Usually one of `script`,
	`stylesheet`, or `resource`.
*	__`url`__: URL used to fetch the resource on demand

You may have noticed that the example package definition above did not include
any of these keys.  This is because Tiki can automatically fill in some 
reasonable default for you so you can save network bandwidth.

Normally you need only provide the name of the resource, as a simple string,
along with setting the `tiki:base` property to point to the root URL where
all related assets can be found.  Tiki will generate the rest of the 
properties for you.

In fact, you can retrieve the normalized resources hash. Just call from 
within a module:

	module.ownerPackage.get('tiki:resources');
	

# Registering Modules

Once you have registered a package, you can register factory functions for 
the package as well:

	tiki.module('canonicalModuleId', function() { ... });
	
The first parameter should be a canonical moduleId of the format:

	`::canonicalPackageId:moduleId`
	
The `canonicalPackageId` should reflect the packageId you registered with 
tiki earlier.  This is how the module will be mapped to the package.

The second parameter should be either the module factory function itself or 
a string that will be wrapped and eval'd on demand.

Once a module has been registered in this way, you can require() it.

# Registering Scripts and Stylesheets

Whenever you attempt to load a package using ensure(), it will inspect the 
package's tiki:resources property and look for any scripts and stylesheets 
and load them.  To avoid loading the same resources more than once, it is 
especially important that when scripts load, they register themselves by 
calling:

	tiki.script('scriptId');
	
At the end.  The scriptId is usually of the format:

	`::canonicalPackageId:scriptName`
	
Where scriptName is the name you provided in the resources hash.  Note that 
the scriptId is distinct from the URL uses to load the resource.  This is 
because the same script "resource" may sometimes be served from multiple 
locations.  This helps to ensure the same resources are truly loaded only
once.
