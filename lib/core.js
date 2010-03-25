// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var TMP_ARY = [];
var DONT_ENUMS = 'toString constructor valueOf toLocaleString isPrototypeOf hasOwnProperty'.split(' ');
var NEEDS_ENUM_FIX = false; // TODO: enable on IE

// TODO: Might delete
/**
  Invokes the callback for each property on the object.  This can handle 
  invalid properties on  IE
*/
exports.forEach = function(obj, callback) {
  var key, idx, proto;
  
  for(key in obj) {
    if (!obj.hasOwnProperty(key)) continue;
    callback(key, obj[key]);
  }

  if (NEEDS_ENUM_FIX) {
    idx = DONT_ENUMS.length;
    proto = Object.prototype;
    while(--idx>=0) {
      key = DONT_ENUMS[idx];
      if (obj[key] !== proto[key]) callback(key, obj[key]);
    }
  }
  
};

// TODO: Review for possible deletion
exports.mixin = function(dst) {
  var len = arguments.length, 
      idx, src, key, loc, proto;

  for(idx=1; idx<len; idx++) {
    src = arguments[idx];

    for(key in src) {
      if (!src.hasOwnProperty(key)) continue;
      dst[key] = src[key];
    }

    if (NEEDS_ENUM_FIX) {
      loc = DONT_ENUMS.length;
      proto = Object.prototype;
      while(--loc>=0) {
        key = DONT_ENUMS[loc];
        if (src[key] !== proto[key]) dst[key] = src[key];
      }
    }
  }

  return dst;
};

/**
  Tests whether the passed object is an array or not.
*/
if (Array.isArray) {
  exports.isArray = Array.isArray;
} else {
  exports.isArray = function(obj) {
    if ('object' !== typeof obj) return false;
    if (obj instanceof Array) return true;
    return obj.constructor && (obj.constructor.name==='Array');
  };
}

/**
  Invokes an async callback, returning the return value.  Since in the 
  browser we can't actually be async, this code just throws an error if you
  actually go async.
  
  @param func {Function}
    The function to invoke.  The function should accept a single param - the
    callback to invoke when finished.
    
  @returns {Object} return value from async operation
*/
exports.wait = function(func) {
  var finished = false, err, ret;
  func(function(e, v) {
    finished = true;
    err = e; ret = v;
  });
  
  if (!finished) err = new Error('Cannot run function async');
  if (err) throw err;
  return ret ;
};

function eachIter(func, done) {
  func(done);
}

/**
  Returns a continuable that will apply the mapper function to the passed 
  array, passing it to the callback when complete.
  
  The mapper function should have the form:
  
  {{{
    function fn(item, callback) { ... };
  }}}
  
*/
exports.comap = function(array, fn) {
  var len ;
  
  // if params are continuables, make into an array 
  if ('function' === typeof array) {
    array = Array.prototype.slice.call(arguments);
    fn = null;
  }
  
  // if no fn is passed, assume array has continuables
  if (!fn) fn = eachIter;
  
  len = array.length;
  return function(done) {
    var idx = -1,
        ret = [];
    
    var loop = function(err, val) {
      if (err) return done(err);
      if (idx>=0) ret[idx] = val; // skip first call
      idx++;
      if (idx>=len) return done(null, ret);
      fn(array[idx], loop);
    };
    
    loop();
  };
};

/**
  Iterate over a property, setting display names on functions as needed.
  Call this on your own exports to setup display names for debugging.
*/
var displayNames = function(obj, root) {
  var a = TMP_ARY;
  a[0] = root;
  
  var k,v;
  for(k in obj) {
    if (!obj.hasOwnProperty(k)) continue ;
    v = obj[k];
    if ('function' === typeof v) {
      a[1] = k;
      if (!v.displayName) {
        v.displayName = root ? a.join('.') : k;
        displayNames(v.prototype, v.displayName);
      }
      
    }
  }
  
  a.length = 0;
  return obj;
};
exports.displayNames = displayNames;

displayNames(exports);
