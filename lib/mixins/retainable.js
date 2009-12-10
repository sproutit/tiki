// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Retainable */


"export package Retainable";

/**
  Makes an object retainable.  Retainable objects have a retain count you can
  increment and decrement.  When the retain count reaches zero, the object is
  destroyed (by calling destroy).  
  
  Use this mixin for objects that need to have their memory carefully 
  controlled (such as events).  This also allows you to write objects that
  are pooled.
  
  @since SproutCore 1.1
*/
Retainable = {
  
  /**
    Number of objects retaining this object.  When this reaches zero, the
    object will be destroyed.
  */
  retainCount: 1,
  
  /**
    Becomes true when the object is destroyed.
  */
  isDestroyed: false,
  
  /**
    Call to retain the object
    
    @returns {Object} receiver
  */
  retain: function() {
    this.retainCount++;
    return this ;
  },
  
  /** 
    Call to release the object.  May cause it to be destroyed.
    
    @returns {Object} receiver
  */
  release: function() {
    if (--this.retainCount <= 0) this.__destroy();
    return this;
  },
  
  __destroy: function() {
    if (!this.isDestroyed) {
      this.isDestroyed = true;
      if (this.destroy) this.destroy();
    }
  }
  
};


