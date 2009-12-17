// ==========================================================================
// Project:   Tiki
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals exports add remove ready unload NATIVE_EVENTS tiki */

"export add remove ready unload NATIVE_EVENTS";

/**
  @file
  
  Implements a low-level interface for registering interest in native events
  delivered by the web browser.  If you are implementing this API for a non-
  browser environment, add() and remove() may do nothing.
  
  ready() and unload() should still invoke the passed callback when the 
  JS environment is ready for the app to run and just before the app exits,
  respectively.

  ready() and unload() should both expect to be called exactly once (by the
  system event module).  They may throw an error if called more than once.
*/


var readyCalled  = false, 
    unloadCalled = false,
    browser      = tiki.browser,
    isReady      = false,
    isUnloaded   = false,
    ecache       = {};
    

// returns a handler function for the onready event depending on the browser.    
function readyHandler(callback) {
  var ret ;
  
  // opera - wait until all the stylesheets are made visible
  if (browser.opera) {
    ret = function() {
      if (isReady) return;
      
      for (var i = 0; i < document.styleSheets.length; i++) {
        if (document.styleSheets[i].disabled) {
          setTimeout(ret, 0);
          return;
        }
      }
      
      // and execute any waiting functions
      isReady = true;
      callback();
    };
    
  // msie - wait until the doScroll event stops complaining..
  } else if (browser.msie) {
    ret = function() {
      if (isReady) return;
      try {
        // If IE is used, use the trick by Diego Perini
        // http://javascript.nwbox.com/IEContentLoaded/
        document.documentElement.doScroll("left");
      } catch( error ) {
        setTimeout(ret, 0);
        return;
      }

      // and execute any waiting functions
      isReady = true;
      callback();
    };
    
  // everyone else - just call
  } else {
    ret = function() {
      if (isReady) return ;
      isReady = true;
      callback();
    };
  }
  
  return ret ;
  
}

/** 
  Invoke the  callback when the browser is ready to handle app code. 
  Throws an exception if it is called more than once.  Uses a built-in 
  listener.
  
  @param {Function} callback
  @returns {void}
*/
ready = function(callback) {
  if (readyCalled) throw("Cannot call platform.ready() more than once");
  readyCalled = true;
  
  var handler = readyHandler(callback);
  
  // Mozilla, Opera (see further below for it) and webkit nightlies 
  // currently support this event.  Use the handy event callback
  if (document.addEventListener) {
    document.addEventListener( "DOMContentLoaded", handler, false );
  
  // If IE is used and is not in a frame
  // Continually check to see if the document is ready
  } else if (browser.msie && (window === top)) handler();

  // A fallback to window.onload, that will always work
  add(window, 'load', handler);
};


function unloadHandler(callback) {
  return function() {
    if (isUnloaded) return ;
    isUnloaded = true;
    callback();
  }; 
}

/**
  Invoke the callback just before the browser unloads the page.  Throws an 
  error if called more than once.
  
  @param {Function} callback
  @returns {void}
*/
unload = function(callback) {
  if (unloadCalled) throw("Cannot call platform.unload() more than once");
  unloadCalled = true;
  add(window, 'unload', unloadHandler(callback));
};

// ..........................................................
// EVENT LISTENERS
// 

/**
  Names of event types natively supported by this library.  Platforms without
  native event support can return an empty hash.
*/
NATIVE_EVENTS = {};

// TODO: make this correct per-browser
// TODO: add touch events
var names = 'mousedown mouseup click dblclick mouseover mouseout selectstart keypress keydown keyup blur focus deactivate change select submit contextmenu dragstart error hashchange help load losecapture readystatechange resize scroll unload'.split(' '), loc = names.length;
while(--loc>=0) NATIVE_EVENTS[names[loc]] = names[loc];


// convert 'foo' => 'onfoo' using cache to avoid malloc
function onStr(str) {
    var ret = ecache[str];
    if (!ret) ret = ecache[str] = ('on' + str); // avoid mallocs
    return ret ;
}

/**
  Adds a listener for the event.  No need to do any special buffering; just
  add the listener in a platform-specific way.
  
  @param {Object} elem the target element if any.  otherwise use document
  @param {String} eventType click, mousedown, etc
  @param {Function} callback function to invoke
  @returns {void}
*/
add = function(elem, eventType, callback) {
  if (!NATIVE_EVENTS[eventType]) return ; // ignore for native events
  if (!elem) elem = require.env.document;
  if (elem.addEventListener) elem.addEventListener(eventType, callback, false);
  else if (elem.attachEvent) elem.attachEvent(onStr(eventType), callback);      
  else throw("cannot add listener to element: " + elem);
};

/**
  Removes a listener for the event.  No need to do any special buffering; just
  remove the listener in a platform-specific way
  
  @param {Object} elem the target element if any. otherwise use document
  @param {String} eventType click, mousedown, etc
  @param {Function} func function to invoke
  @returns {void}
*/
remove = function(elem, eventType, func) {
  if (!NATIVE_EVENTS[eventType]) return ;
  if (!elem) elem = require.env.document;
  if (elem.removeEventListener) elem.removeEventListener(eventType, func, false);
  else if (elem.detachEvent) elem.detachEvent(onStr(eventType), func);
  else throw("cannot remove listener from element: " + elem);
};

// make this API visible as the events property on package
event = exports;
