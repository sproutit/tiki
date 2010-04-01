# Tiki Architecture

A Tiki runtime is made up of six main pieces:

## Module

A module is an object that describes a single unit of code you can use.  
Module objects have several properties include an id and "exports".  The 
exports property contains all of the functionality exported from the module.
When you invoke `require()` to load a module, this exports hash is the value
returned from the call.

## Factory

Module exports are built the first time you require the module by invoking a 
_factory function_.  This factory function is what you usually define when you
write a CommonJS module in the first place.  Factory functions are stored in
factory objects that know how to properly invoke the factory given the proper
context to begin with.

## Package

A package is a group of modules that together make up a single library.
Packages are named and versioned.  They can be installed and maintained using
package managers, making it easy to share code at this level.

Packages are usually stored on disk as a folder with a "packages.json" file
that describes the package metadata.  Individual CommonJS modules are stored
as files in the "lib" directory (though this can be configured).

In the browser, you usually load entire packages at once via a script tag,
rather than loading individual modules.

Tiki offers full support for packages including working with multiple versions
and freezing packages.  It can even automatically choose the correct 
version based on package dependencies.

The default Package class provided by Tiki implements some of the more common
API methods you may want to use.  However, in general, when configuring 
Tiki yourself you will often need to subclass Packages to specialize how 
they search for and load modules.

Tiki includes a built-in BrowserPackage class that works with the 
BrowserSource class to implement everything you need to work with packages in
the browser.

## Sandbox

A __Sandbox__ holds module instances.  Whenever a module is created, it 
belongs to a sandbox.  All modules in in the same sandbox share the same
module instances.  For example, if two modules `require('foo')`, they will
both get the exact same `foo` instance. 

Usually you will have only one Sandbox, though you may create multiple 
sandboxes in some cases where you are running untrusted code.  

For example, if you want to load plugins and keep them from futzing with your 
own module code, you could place them into their own sandbox.  When the plugin 
calls `require('foo')` it will receive a new copy of the `foo` module.  If it 
tries to alter that module somehow, the plugin cannot impact your own module 
code.

## Loader

A sandboxes have a loader, which is responsible for finding and returning 
packages and module factories when you request them.  A loader is what takes
a call like:

	`require('foo:bar');`
	
Determines exactly which version of the `foo` package you want to load and 
then finds the factory object for the `bar` module inside of it.

A sandbox can only work with one loader and it cannot change loaders during
operation.  However, you can have multiple sandboxes attached to the same
loader instance and you can have multiple loaders in a single application.

Like Sandboxes, you will usually only have one loader in your application.  
However, you might create multiple loaders if you want to load some modules
in a completely separate environment for some reason.

For example, if you need a module to retrieve a completely different version
of `foo` then you might use a different loader.

## Source

A source is used by the Loader to search for packages and modules to load.
Unlike other pieces of this system, Tiki does not provide a "Source" base-
class.  You just need to implement the source API described in this document.

Tiki, however, does include a default source for use in the web browser called
the BrowserSource.

A since loader may have one or more sources.  When it needs to load a module
or package, it will ask each source in turn to locate the module or package 
until the item it found.
