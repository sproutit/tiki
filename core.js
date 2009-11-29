// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals setupDisplayNames */

"export package setupDisplayNames";
"use factory_format function";

var TMP_ARY = [];

/**
  Iterate over a property, setting display names on functions as needed. 
*/
setupDisplayNames = function setupDisplayNames(obj, root) {
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