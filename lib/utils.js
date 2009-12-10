// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals T_ERROR T_OBJECT T_NULL T_CLASS T_HASH T_FUNCTION T_NUMBER T_BOOL T_ARRAY T_UNDEFINED T_STRING YES NO T_BOOLEAN isArray typeOf $A generateGuid guidFor mixin setupDisplayNames beget extend */

"export T_ERROR T_OBJECT T_NULL T_CLASS T_HASH T_FUNCTION T_UNDEFINED T_NUMBER T_BOOL T_ARRAY T_STRING T_BOOLEAN YES NO";
"export isArray typeOf $A generateGuid guidFor mixin setupDisplayNames beget extend";

// define standard type constants
T_ERROR     = 'error';
T_OBJECT    = 'object';
T_NULL      = 'null';
T_CLASS     = 'class';
T_HASH      = 'hash';
T_FUNCTION  = 'function';
T_UNDEFINED = 'undefined';
T_NUMBER    = 'number';
T_BOOL      = 'boolean';
T_ARRAY     = 'array';
T_STRING    = 'string';
T_BOOLEAN   = 'boolean';

YES         = true;
NO          = false; 

var TMP_ARY = [];

// ..........................................................
// ARRAY UTILITIES
// 

/**
  Returns true if the passed item is an array.  Works regardless of source
  of array.
*/
isArray = function(obj) {
  if (obj && obj.isArray) return true; // fast path
  if (!obj) return false;
  if (T_UNDEFINED !== typeof obj.length) {
    if ((typeof obj !== T_FUNCTION) && (typeof obj !== T_STRING) && (obj.constructor !== String)) return true;
  }
  // TODO: add proper check that works across windows...
  return false ;  
};

Array.prototype.isArray = true ;
  
/**
  Converts the passed object to an Array.  If the object appears to be 
  array-like, a new array will be cloned from it.  Otherwise, a new array
  will be created with the item itself as the only item in the array.
  
  @param object {Object} any enumerable or array-like object.
  @returns {Array} Array of items
*/
$A = function A(obj) {
  // null or undefined -- fast path
  if ((obj === null) || (obj === undefined)) return [] ;
  
  // primitive -- fast path
  if (obj.slice instanceof Function) {
    // do we have a string?
    if (typeof(obj) === 'string') return [obj] ;
    else return obj.slice() ;
  }
  
  // enumerable -- fast path
  if (obj.toArray) return obj.toArray() ;
  
  // if not array-like, then just wrap in array.
  if (!isArray(obj)) return [obj];
  
  // when all else fails, do a manual convert...
  var ret = [], len = obj.length;
  while(--len >= 0) ret[len] = obj[len];
  return ret ;
};

// ..........................................................
// TYPE DETECTION & GUIDS
// 

/**
  Returns a consistant type for the passed item.

  Use this instead of the built-in typeOf() to get the type of an item. 
  It will return the same result across all browsers and includes a bit 
  more detail.  Here is what will be returned:

  | Return Value Constant | Meaning |
  | SC.T_STRING | String primitive |
  | SC.T_NUMBER | Number primitive |
  | SC.T_BOOLEAN | Boolean primitive |
  | SC.T_NULL | Null value |
  | SC.T_UNDEFINED | Undefined value |
  | SC.T_FUNCTION | A function |
  | SC.T_ARRAY | An instance of Array |
  | SC.T_CLASS | A SproutCore class (created using SC.Object.extend()) |
  | SC.T_OBJECT | A SproutCore object instance |
  | SC.T_HASH | A JavaScript object not inheriting from SC.Object |

  @param item {Object} the item to check
  @returns {String} the type
*/  
typeOf = function typeOf(item) {
  if (item === undefined) return T_UNDEFINED ;
  if (item === null) return T_NULL ; 
  
  var ret = typeof(item) ;
  if (ret == "object") {
    if (isArray(item)) ret = T_ARRAY ;
    else if (item instanceof Function) {
      ret = item.isClass ? T_CLASS : T_FUNCTION ;
    } else if ((item instanceof Error) || item.isError) ret = T_ERROR;
    else if (item.isObject) ret = T_OBJECT ;
    else if (item.isClass) ret = T_CLASS;
    else if (item.constructor === Object) ret = T_HASH;
    else if (item.constructor === Number) ret = T_NUMBER;
    else if (item.constructor === String) ret = T_STRING;
    else ret = T_OBJECT;

  } else if (ret === T_FUNCTION) ret = item.isClass ? T_CLASS : T_FUNCTION;
  
  return ret ;
};
  
var guidKey = "_sc_guid_" + new Date().getTime();
var _nextGUID = 0, _numberGuids = [], _stringGuids = [];

/**
  Generates a new guid, optionally saving the guid to the object that you
  pass in.  You will rarely need to use this method.  Instead you should
  call SC.guidFor(obj), which return an existing guid if available.

  @param {Object} obj the object to assign the guid to
  @returns {String} the guid
*/
generateGuid = function generateGuid(obj) { 
  var ret = ("sc" + (_nextGUID++)); 
  if (obj) obj[guidKey] = ret ;
  return ret ;
};

/**
  Returns a unique GUID for the object.  If the object does not yet have
  a guid, one will be assigned to it.  You can call this on any object,
  SC.Object-based or not, but be aware that it will add a _guid property.

  You can also use this method on DOM Element objects.

  @param obj {Object} any object, string, number, Element, or primitive
  @returns {String} the unique guid for this instance.
*/
guidFor = function guidFor(obj) {
  
  // special cases where we don't want to add a key to object
  if (obj === undefined) return "(undefined)" ;
  if (obj === null) return '(null)' ;
  if (obj === Object) return '(Object)';
  if (obj === Array) return '(Array)';
  
  if (obj[guidKey]) return obj[guidKey] ;

  switch(typeof obj) {
    case T_NUMBER:
      return (_numberGuids[obj] = _numberGuids[obj] || ("nu" + obj));
    case T_STRING:
      return (_stringGuids[obj] = _stringGuids[obj] || ("st" + obj));
    case T_BOOL:
      return obj ? "(true)" : "(false)" ;
    default:
      return generateGuid(obj);
  }
};

// ..........................................................
// OBJECT EXTENSION
// 

// primitive mixin
function _mixin(t, items, skip) {
  
  // copy reference to target object
  var len    = items.length,
      target = t || {},
      idx, options, key, src, copy;

  for (idx=skip; idx < len; idx++ ) {
    if (!(options = items[idx])) continue ;
    for(key in options) {
      if (!options.hasOwnProperty(key)) continue ;

      src  = target[key];
      copy = options[key] ;
      if (target===copy) continue ; // prevent never-ending loop
      if (copy !== undefined) target[key] = copy ;
    }
  }
  
  return target;
}

/**
  Copy the passed properties onto the first parameter.
  
  @param {Hash} t the target object to mixin to
  @param {Hash..} one or more hashes to mix in
  @returns {Hash} the first parameter
*/
mixin = function(t) {
  return _mixin(t, arguments, 1);
};

// used to beget new objects
var K_ = function() {},
    Kproto_ = K_.prototype;

/**
  Take the named object, beget a new instance using prototype inheritence
  then copy props onto it.
  
  @param {Hash} t the object to beget
  @param {Hash..} hashes optional zero or more hashes to copy props from
  @returns {Hash} the begotten object
*/
beget = function(t) {
  var ret ;
  
  K_.prototype = t ;
  ret = new K_();
  K_.prototype = Kproto_;
  
  return _mixin(ret, arguments, 1);
};

// default __init method.  calls init() if defined.  can be overloaded.
var __init = function(args) {
  var init;
  if (init = this.init) init.apply(this, args);  
};

// generate a new constructor function
function _const() {
  return function() {
    this.__init(arguments);
    return this;
  };
}

/**
  Accepts a constructor function and returns a new constructor the extends 
  the passed value.  The new constructor will pass any constructor methods 
  along to an init() method on the prototype, if it is defined.

  Any additional passed arguments will be copied onto the object.
  
  You can also just pass hashes and we'll make up a constructor for you.
  
  @param {Function} F the constructor function to extend
  @param {Hash..} hashes optional zero or more hashes to copy props from
  @returns {Function} the new subclass
*/
extend = function(F) {
  var Ret = _const(), prot;
   
  if (T_FUNCTION === F) {
    prot = Ret.prototype = beget(F.prototype);
    if (!prot.__init) prot.__init = __init; // needed for setup
    _mixin(prot, arguments, 1);

  // build a NEW object.
  } else {
    prot = Ret.prototype = _mixin({ __init: __init }, arguments, 0);
  }
  
  prot.constructor = Ret ;
  
  return Ret;
};

// ..........................................................
// DEBUG MARKING

// 
/**
  Iterate over a property, setting display names on functions as needed.
  Call this on your own exports to setup display names for debugging.
*/
setupDisplayNames = function(obj, root) {
  var a = TMP_ARY;
  a[0] = root;
  
  var k,v;
  for(k in obj) {
    if (!obj.hasOwnProperty(k)) continue ;
    v = obj[k];
    if ('function' === typeof v) {
      a[1] = k;
      v.displayName = a.join('.');
    }
  }
  
  a.length = 0;
  return obj;
};

setupDisplayNames(this, 'utils');

