// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Promise create RESOLVED PENDING CANCELLED BUSY */

"export package Promise";
"export create RESOLVED PENDING CANCELLED BUSY";

/**
  @file
  
  The promise module provides a generic way of handling asynchronous actions
  that must be defered until some conditions are met.
  
  h2. Examples
  
  Here is an example of how you might use a promise to return some data once
  it is fetched from a server:
  
  {{{
    "import tiki:system/promise as promise";

    // create a promise and call resolve() when the retrieval is complete 
    function retrieveUserInfo() {
      var pr = promise.create();
      SC.Request.getUrl('/user_info').notify(200, pr, pr.resolve);
      return pr ;
    }
    
    // other code can wait on the result like so:
    retrieveUserInfo().then(MyApp, MyApp.processUserInfo);
  }}}
  
  h2. Promise Dependencies
  
  In addition to this basic promise API, you can also make promises dependent
  on one another.  This allows you to create a simple dependency chain of 
  promises that must also resolve before a gating promise resolves.
  
  For example, if you want to know when a UserInfo promise and AccountData 
  promise is resolved, you can create another promise and make it depend on
  those two:
  
  {{{
    "import tiki:system/promise as promise";
    
    function makeReady() {
      var pr = promise.create();
      pr.depends(retrieveUserInfo());
      pr.depends(retrieveAccountData());
      return pr;
    };
    
    makeReady().then(MyApp, MyApp.start);
  }}}
  
  h2. Promise Actions
  
  Finally, promises can have actions associated with them.  When you call 
  run() on the promise, the action will execute as long as the promise is not
  yet resolved and the aciton has not executed before.
  
  Promise actions make it easy to implement a common design pattern where you
  need to perform some action of a promise has not resolved but you only 
  want it to trigger once.
  
  To setup an action, just call the action() method on the promise, passing 
  the method you want to run.  Later, when you are ready to trigger the action
  just call run() on the promise.  This is most useful when you have the run
  method call when another promise resolves.  
  
  For example, if you need the AccountData to load only after the UserInfo 
  runs, here is how you might do it:
  
  {{{
    "import tiki:system/promise as promise";
    "export retrieveUserInfo retrieveAccountData";
    
    var userPromise, accountPromise;
    
    retrieveUserInfo = function() {
      var pr = userPromise ;
      if (!pr) {
        pr = promise.create();
        pr.action(function() {
          SC.Request.getUrl('/user_info').notify(pr, pr.reoslve);
        });
        userPromise = pr;
      }
      pr.run();
      return pr ;
    };
    
    retrieveAccountData = function() {
      var pr = accountPromise;
      if (!pr) {
        pr = promise.create();
        pr.action(funciton() {
          SC.Request.getUrl('/account_data').notify(pr, pr.resolve);
        });

        // run this promise action only when userInfo is retrieved
        retrieveUserInfo().then(pr, pr.run);
        accountPromise = pr;
      }
      return pr;
    }
    
  }}}
*/

/**
  Status of promise when it has been resolved.
  
  @property {String}
*/
RESOLVED = 'resolved';

/**
  Status of promise when it is first created before any action has run.
  
  @property {String}
*/
PENDING = 'pending';

/**
  Status of promise when it has been cancelled.
  
  @property {String}
*/  
CANCELLED = 'cancelled' ;

/**
  Stauts of promise when it is busy running the action.
  
  @property {String}
*/
BUSY = 'busy';
  
  
/**
  @class
  
  The promise object itself.  When you create a new promise, this is the 
  object that is returned.

  When you create a promise you can optionally include an id that will be 
  used to identify the promise in log output.
  
  @since Tiki 1.0
*/
var Promise = function(id) {
  this.id = id;
  return this ;
} ;

Promise.prototype = {
  
  /**
    Promise status
  */
  status: PENDING,
  
  _notify: function(key, value) {
    var actions = this[key],
        len = actions ? actions.length : 0, 
        idx;

    this[key] = null ; // clear them
    for(idx=0;idx<len;idx++) {
      actions[idx].method.call(actions[idx].target, value);
    }
  },

  _register: function(key, target, method) {
    if (method) {
      var actions = this[key];
      if (!actions) actions = this[key] = [];
      actions.push({ target: target, method: method });        
    }
  },

  /**
    Resolves the promise with the specified value.  If there are any 
    pending resolve actions, invokes them immediately.
    
    @param {Object} val resolved value
    @returns {Promise} receiver
  */
  resolve: function(val) {
    this._value = val;

    if (this.dependCount>0) {
      this.canResolve = true;
    } else {
      this.status = RESOLVED;
      this._notify('_resolveActions', val);
    }
    return this ;
  },

  /**
    Cancels the promise with the specified reason.  If there are any 
    pending cancel actions, invokes them immediately.
  */
  cancel: function(reason) {
    this.status = CANCELLED;
    this._value = reason;
    this._notify('_cancelActions', reason);
    return this;
  },

  /**
    Looks for an "action" function and invokes it unless the promise is
    already resolved or cancelled
  
    @returns {Promise} receiver
  */
  run: function() {
    if (this.method && this.status===PENDING) {
      this.status = BUSY;
      this.method(this);
    }
    return this ;
  },

  /**
    If a promise has been resolved or cancelled, this will put it back to
    ready.
  
    @returns {Promise} receiver
  */
  reset: function() {
    if (this.status !== BUSY) this.status = PENDING;
    this._value = null;
    return this;
  },

  /**
    configures the promise so you can run it.  This will only invoke your
    callback once

    @param {Function} method the method to invoke
    @returns {Promise} receiver
  */
  action: function(method) {
    if (!this.method) this.method = method ;
    this.hasAction = true ;
    return this ;
  },

  hasAction: false,
  
  dependCount: 0,

  _resolveDepends: function() {
    this.dependCount--;
    if (this.dependCount<=0 && this.canResolve) this.resolve(this._value);
    return this ;
  },

  _cancelDepends: function(reason) {
    this.cancel(reason);
    return this;
  },

  /**
    Makes the receiver promise depend on the passed promise.  once you 
    resolve a promise, it will not actually resolve until all dependents 
    resolve as well.
    
    @param {Promise} pr promise this promise is dependent upon
    @returns {Promise} receiver
  */
  depends: function(pr) {
    this.dependCount++;
    pr.then(this, this._resolveDepends, this._cancelDepends);
    return this ;
  },

  /**
    Invokes the named target/method(s) when the promise is resolved or 
    cancelled.  If the promise is already resolved or cancelled, invokes
    the callback immediately.
    
    @param {Object} target target for callbacks
    @param {Function} resolveMethod method to invoke when resolved
    @param {Function} cancelMethod method to invoke if cancelled
    @returns {Promise} receiver
  */
  then: function(target, resolveMethod, cancelMethod) {
    var actions;
    
    // normalize arguments
    if (arguments.length<3 && ('function' === typeof target)) {
      cancelMethod = resolveMethod;
      resolveMethod = target;
      target = this;
    }
    
    switch(this.status) {
      case RESOLVED:
        if (resolveMethod) resolveMethod.call(target, this._value, this);
        break;

      case CANCELLED: 
        if (cancelMethod) cancelMethod.call(target, this._value, this);
        break;

      default:
        this._register('_resolveActions', target, resolveMethod);
        this._register('_cancelActions', target, cancelMethod);
    }
    return this ;
  },

  /** @private */
  toString: function() {
    return 'Promise<id=' + this.id + ' status=' + this.status + '>';
  }    
};

create = function create(id) { return new Promise(id); };

