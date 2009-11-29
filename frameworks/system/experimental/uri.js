// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals URI create resolve relative */

"import package tiki";
"export URI resolve relative";

/**
  @file
  
  This module handles standard URIs.  You can parse a URI, decode it, encode
  it, convert it to relative, and absolue URIs.  This module is used by the
  loader to convert any URI you name in a package into a standardize URL.
  
  You can also use the constructor/destructor here to pool objects.
*/



URI = function(str) { return this.init(str); };

var pool = [];

URI.create = function create(str) {
  var ret = pool.pop();
  return ret ? ret.init(str) : (new URI(str));
};

URL.prototype.destroy = function destroy() {
  this.isDestroyed = true;
  pool.push(this);
  return this;
};

// return new absolute URI relative to the passed base URI
URI.prototype.resolve = function(baseUri) {
};

// return new URI relative to this one
URI.prototype.relative = function(baseUri) {
};


// returns a new uri with the passed string
create = URI.create;

// resolves the passed URI relatives to the other URI
resolve = function resolve(uri, baseUri) {
  if (!uri) return null;

  var tmpUri, tmpBase ;
  if (!(uri instanceof URI)) {
    tmpUri = URI.create(uri);
  }
  
  if (!(uri instanceof URI)) uri = URI.create(uri);
  if (baseUri && !(baseUri instanceof URI)) baseUri = URI.create(baseUri);
  
  var ret = uri.resolve(baseUri)
};

// converts the passed URI to relative the other URI
relative = function relative(url, baseUri) {
  if (!uri) return null;
  
};



