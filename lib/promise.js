// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================

"use exports Promise";

var utils = require('utils'),
    Retainable = require('mixins/retainable'),
    Promise;

var LOG_PROMISES = false;

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
var RESOLVED = 'resolved';

/**
  Status of promise when it is first created before any action has run.
  
  @property {String}
*/
var PENDING = 'pending';

/**
  Status of promise when it has been cancelled.
  
  @property {String}
*/  
var CANCELLED = 'cancelled' ;

/**
  Status of promise when it is busy running the action.
  
  @property {String}
*/
var BUSY = 'busy';

/**
  Status of promise when it has been resolved but is still waiting on 
  dependencies.
  
  @property {String}
*/
var BLOCKED = 'blocked';
  
// memory pool for promises...
var pool = [];
  
/**
  @class
  
  The promise object itself.  When you create a new promise, this is the 
  object that is returned.

  When you create a promise you can optionally include an id that will be 
  used to identify the promise in log output.
  
  @since Tiki 1.0
*/
Promise = utils.extend(Retainable, {
  
  /**
    Initializes the promise.
  */
  init: function(id) {
    this.inPool = false; // for debug
    this.id = id;

    // reset just in case this is coming from the pool
    this.status      = PENDING;
    this.outstandingDependencies = 0;
    this.hasAction = false;
    this.retain(); // do not delete until resolved or cancelled
    return this ;
  },
  
  /**
    Destroys the promise.  Called when the retain count hits zero.  This will
    return the promise to the promise pool.
  */
  destroy: function() {
    // reset retainable
    this.isDestroyed = false;
    this.retainCount = 1;
    this.inPool      = true;

    // reset state...
    this.target = this.method = this._actions = null;
    
    pool.push(this); // add back to pool
    return this ;
  },

  /**
    Promise status.  Must be one of RESOLVE, PENDING, CANCELLED, BUSY
    
    @property {String}
  */
  status: PENDING,
  
  /**
    Count of outstanding dependent promises.
    
    @property {Number}
  */
  outstandingDependencies: 0,

  /**
    Becomes true when a promise has an action it can fire.
    
    @property {Boolean}
  */
  hasAction: false,
  
  // ..........................................................
  // PUBLIC METHODS 
  // 
  
  /**
    Resolves the promise with the specified value.  If there are any 
    pending resolve actions, invokes them immediately.
    
    @param {Object} val resolved value
    @returns {Promise} receiver
  */
  resolve: function(val) {
    
    if (LOG_PROMISES) {
      console.log(this.id + ".resolve() dep=" + this.outstandingDependencies + ' status=' + this.status);
    }
    
    var st = this.status;
    if ((st===RESOLVED) || (st===CANCELLED)) return this; // don't go again
    
    this._value = val;

    if (this.outstandingDependencies>0) {
      this.status = BLOCKED;
    } else {
      this.status = RESOLVED;
      this.value  = val;
      this._notify(RESOLVED, val);
    }
    
    this.release(); // can now destroy
    
    return this ;
  },

  /**
    Cancels the promise with the specified reason.  If there are any 
    pending cancel actions, invokes them immediately.  This ignores any 
    dependencies.
    
    @param {Object} reason a reason for cancelation.  Will be passed to listeners.
    @returns {Promise} receiver
  */
  cancel: function(reason) {
    var st = this.status;
    if ((st===RESOLVED) || (st===CANCELLED)) return this; // nothing to do
    
    this.status = CANCELLED;
    this.value = reason;
    this._notify(CANCELLED, reason);
    this.release(); // can now destroy
    
    return this;
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
    
    // normalize arguments - allow you to pass w/o an up front target
    if (arguments.length<3 && ('function' === typeof target)) {
      cancelMethod = resolveMethod;
      resolveMethod = target;
      target = this;
    }
    
    if (resolveMethod) this._register(RESOLVED, target, resolveMethod);
    if (cancelMethod) this._register(CANCELLED, target, cancelMethod);

    return this ;
  },


  /**
    Looks for an "action" function and invokes it unless the promise is
    already resolved or cancelled
  
    @returns {Promise} receiver
  */
  run: function() {
    if (this.method && this.status===PENDING) {
      this.status = BUSY;
      this.method.call(this.target||this, this);
    }
    return this ;
  },

  /**
    If a promise has been resolved or cancelled, this will put it back to
    ready.
  
    @returns {Promise} receiver
  */
  reset: function() {
    var st = this.status;
    if ((st !== BUSY) || (st !== BLOCKED)) this.status = PENDING;
    this.value = null;
    this.retain(); // cannot delete again...
    return this;
  },

  /**
    configures the promise so you can run it.  This will only invoke your
    callback once

    @param {Function} method the method to invoke
    @returns {Promise} receiver
  */
  action: function(target, method) {

    // normalize input methods
    if (arguments.length===1) {
      method = target; target = this;
    }

    this.target    = target;
    this.method    = method;
    this.hasAction = true ;
    return this ;
  },

  /**
    Makes the receiver promise depend on the passed promise.  once you 
    resolve a promise, it will not actually resolve until all dependents 
    resolve as well.
    
    @param {Promise} pr promise this promise is dependent upon
    @returns {Promise} receiver
  */
  depends: function(pr) {
    this.outstandingDependencies++;
    if (LOG_PROMISES) console.log(this.id + '.depends('+pr.id+') dep=' + this.outstandingDependencies + ' status=' + this.status);
    pr.then(this, this._resolveDepends, this._cancelDepends);
    return this ;
  },

  // ..........................................................
  // PRIVATE METHODS
  // 

  /** @private
    Called by a dependent promise when it resolves.  Reduce the dependency
    count and, if needed, resolve this promise.
    
    @returns {Promise} receiver
  */
  _resolveDepends: function(ignore, pr) {
    this.outstandingDependencies--;
    if (LOG_PROMISES) console.log('  ' + this.id + '._resolveDepends('+pr.id+') dep=' + this.outstandingDependencies);
    if (this.outstandingDependencies<=0 && (this.status===BLOCKED)) {
      this.resolve(this.value);
    } 
    
    return this ;
  },

  /**
    Called by a dependent promise when the promise is cancelled.  Implicitly
    cancels this promise as well.
    
    @returns {Promise} receiver
  */
  _cancelDepends: function(reason, pr) {
    if (LOG_PROMISES) console.log('  ' + this.id + '._cancelDepends('+pr.id+') dep=' + this.outstandingDependencies);
    this.cancel(reason);
    return this;
  },

  /** @private
    Notify actions of a state change.  This will delete all registered 
    actions in the queue, even for other states.
    
    @param {String} state the state to notify
    @param {Object} arg an optional argument to pass
    @return {void}
  */
  _notify: function(status, arg) {
    var act = this._actions, len, i;
    act = act ? act[status] : null;
    len = act ? act.length : 0;

    this._actions = null; // clear queue
    for(i=0;i<len;i++) this._invoke(act[i].target, act[i].method, arg);
  },

  /** @private
    Invokes the passed target/method with the named argument.  Will convert
    the method if it is a string.
    
    @param {Object} target target to invoke
    @param {Function|String} method the method to invoke
    @param {Object} arg optional argument
    @returns {void}
  */
  _invoke: function(target, method, arg) {
    if (('string' === typeof method) && target) method = target[method];
    if (!target) target = this;
    method.call(target, arg, this);
  },
  
  /** 
    @private
    
    Registers the passed target/method against the named state.  If the 
    promise is already resolved or cancelled, then invoke immediately.
    
    @param {String} status the state to register
    @param {Object} target a target for the callback
    @param {String|Function} method the function to invoke
    @returns {void}
  */
  _register: function(status, target, method) {
    var cur = this.status, actions, f;
    
    if ((cur===RESOLVED)||(cur===CANCELLED)) {
      if (cur === status) this._invoke(target, method, this.value);
      // else ignore.
      
    // not resolved or cancelled; register in queue
    } else {
      actions = this._actions;
      if (!actions) actions = this._actions = {};
      f = actions[status];
      if (!f) f = actions[status] = [];
      f.push({ target: target, method: method });
    }
  },

  /** @private */
  toString: function() {
    return 'Promise<id=' + this.id + ' status=' + this.status + '>';
  }
  
}) ;

// returns a new promise, using the pool is possible
Promise.create = function(id) { 
  if (pool.length>0) return pool.pop().init(id);
  else return new Promise(id);
};
Promise.create.displayName = 'Promise.create';

// expose constants
Promise.RESOLVED = RESOLVED;
Promise.PENDING = PENDING;
Promise.CANCELLED = CANCELLED ;
Promise.BUSY = BUSY;
Promise.BLOCKED = BLOCKED;

utils.setupDisplayNames(Promise.prototype, 'Promise');

exports = module.exports = Promise;
exports.Promise = Promise;

