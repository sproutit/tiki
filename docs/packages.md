# About Packages

A package is a collection of modules inside an isolated namespace.  Packages
can be tracked by version, and shared via distributed package managers like 
seed.  You can use packages in your own code it make it easier to share code
and to control which code is loaded at various times.

## Different Packages

*	__`mainPackage`__: This is the default package that should be used for 
	requires and other actions.  If you start seed from the command line, the
	mainPackage is usually an anonymous package that does not exist on disk.
	When you load an app in the browser, the mainPackage will be the current 
	target app.  Each sandbox can have a different mainPackage.

*	__`ownerPackage`__: This is the package the owns the current module.  

*	__`defaultPackage`__: This represents any packages exposed through the 
	underlying system API.  Usually you do not set this yourself.

*	__`workingPackage`__: This is the package that will be used to locate a 
	particular module.  Anytime you try to resolve a moduleId to a canonicalId
	you must provide a workingPackage.  When you require() from within a 
	module, the ownerPackage will be used.  When you require() from outside of
	a module, the mainPackage() will be used.
	
## How packageId's Are Resolved

The loader is responsible for converting a packageId into a canonical 
packageId that uniquely identifies the package.  This always happens through
the prism of a workingPackage which is used to determine which packages are 
compatible.

	loader.canonicalPackageId(packageId, vers, workingPackage, done);
	
This will attempt to find a canonical packageId for the passed packageId.
