// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

"use exports Promise";

var Retainable = require('retainable'),
    Invocation = require('invocation'),
    Promise;

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

// statuses
var READY            = 0x1000, // not resolved or cancelled
    PENDING          = 0x1001, // initiate state
    BLOCKED          = 0x3000, // has one or more outstanding dependencies
    BLOCKED_PENDING  = 0x3001, // outstanding, not resolved
    BLOCKED_RESOLVED = 0x3002, // outstanding, resolved
    RESOLVED         = 0x4002, // resolved
    CANCELLED        = 0x4004, // cancelled
    
    ACTION_PENDING   = 0x0100, // base state for NO_ACTION & HAS_ACTION
    NO_ACTION        = 0x0101, // initial state
    HAS_ACTION       = 0x0102, // has action
    ACTION_RUNNING   = 0x0200, // running action
    ACTION_COMPLETE  = 0x0300, // action finished
    
    RESOLVE_METHOD  = '__resolved',
    CANCEL_METHOD   = '__cancel',
    PROGRESS_METHOD = '__progress';

// memory pool for promises...
var pool = [];

var state_map = {
  0x1001: 'PENDING',
  0x3001: 'BLOCKED_PENDING',
  0x3002: 'BLOCKED_RESOLVED',
  0x4002: 'RESOLVED',
  0x4004: 'CANCELLED'
};

  
function logPromise(promise, state, otherPromise) {
  var str = tiki.guidFor(promise) + ':' + promise.id + "." + state + "() dep=" + promise.holds + ' status=' + state_map[promise._status] + ' handlers=' + (promise._handlers ? promise._handlers.length : 'null');
  
  if (otherPromise) str += ' pr=' + otherPromise.toString();
  console.log(str);
}

/**
  @class
  
  The promise object itself.  When you create a new promise, this is the 
  object that is returned.

  When you create a promise you can optionally include an id that will be 
  used to identify the promise in log output.
  
  @since Tiki 1.0
*/
Promise = tiki.extend(Retainable, {
  
  /**
    Initializes the promise.
  */
  init: function(id) {
    this.inPool = false; // for debug
    this.id = id;

    // reset just in case this is coming from the pool
    this._status      = PENDING;
    this._actionStatus = NO_ACTION;
    this.holds     = 0;
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
    The promise value once it is resolved or cancelled
  
    @property {Object}
  */
  value: null,

  /**
    Remains true until the promise is resolved or cancelled.
  */
  isPending: true,
  
  /**
    Becomes true when the promise is resolved
  */
  isResolved: false,
  
  /**
    Becomes true when the promise is cancelled
  */
  isCancelled: false,
  
  /**
    Becomes true if an action has been registered on this promise.  
  */
  hasAction: false,
  
  /** @private
    Promise status - used to control state machine
    
    @property {Number}
  */
  _status: PENDING,

  /** @private
    Promise action status - used to control action state machine
    
    @property {Number}
  */
  _actionStatus: NO_ACTION,
  
  // ..........................................................
  // PUBLIC METHODS 
  // 
  
  /**
    Resolves the promise, passing the specified value to any registered 
    handlers.  If there are any pending resolve actions, invokes them 
    immediately.
    
    @param {Object} val resolved value
    @returns {Promise} receiver
  */
  resolve: function(val) {
    
    if (Promise.LOG_PROMISES) logPromise(this, 'resolve');

    switch(this._status) {
      case PENDING:
        this.value = val;
        this._makeResolved();
        break;
      
      case BLOCKED_PENDING:
        this.value = val;
        this._status = BLOCKED_RESOLVED;
        break;
    }
    
    return this ;
  },

  // transition to the resolved state, triggered entered functions
  _makeResolved: function() {
    this.isPending = false;
    this.isResolved = true;
    this._status = RESOLVED;
    this._didResolve(); // for actions
    this._invoke(RESOLVE_METHOD, this.value, true);
    this.release();
  },
  
  /**
    Cancels the promise with the specified reason.  If there are any 
    pending cancel actions, invokes them immediately.  This ignores any 
    dependencies.
    
    @param {Object} reason 
      a reason for cancelation.  Will be passed to listeners.

    @returns {Promise} receiver
  */
  cancel: function(reason) {
    if (Promise.LOG_PROMISES) logPromise(this, 'cancel');
    switch(this._status) {
      case PENDING:
      case BLOCKED_PENDING:
        this.value = reason;
        this._makeCancelled();
    }
    return this;
  },

  // transition to cancelled state, trigger enter functions
  _makeCancelled: function() {
    this._status = CANCELLED;
    this.isPending = false;
    this.isCancelled = true;
    this._didCancel(); // for actions
    this._invoke(CANCEL_METHOD, this.value, true);
    this.release();
  },
  
  /**
    Notifies any listeners of progress on the promise.  If the promise is 
    already resolved or cancelled, this method will have no effect.
    
    @param {Object} status
      progress status passed to callback
    
    @returns {Promise} receiver
  */
  update: function(reason) {
    if (Promise.LOG_PROMISES) logPromise(this, 'update');
    switch(this._status) {
      case PENDING:
      case BLOCKED_PENDING:
        this._invoke(PROGRESS_METHOD, reason, false);
        break;
    }
    return this ;
  },
  
  /**
    Invokes the named target/method(s) when the promise is resolved or 
    cancelled.  If the promise is already resolved or cancelled, invokes
    the callback immediately.
    
    Returns a new promise that will resolve or cancel once the callback has
    executed.
    
    @param {Object} target 
      (Optional) target for callbacks
    @param {Function} resolveMethod 
      (Optional) method to invoke when resolved
    
    @param {Function} cancelMethod 
      (Optional) method to invoke if cancelled
    @param {Function} progressMethod 
      (Optional) method to invoke if cancelled
      
    @returns {Promise} promise for result
  */
  then: function(target, resolveMethod, cancelMethod, progressMethod) {

    // normalize arguments - allow you to pass w/o an up front target
    var targetType = typeof target, 
        val        = this.values,
        ret;
    
    if (arguments.length<4 && 
        (('function' === targetType) || ('string' === targetType))) {
      progressMethod = cancelMethod;
      cancelMethod = resolveMethod;
      resolveMethod = target;
      target = this;
    }

    ret = Promise.create();

    switch(this._status) {
      case RESOLVED:
        if (resolveMethod) {
          val = resolveMethod.call(target, this.value, this);
        }
        ret.resolve(val);
        break;
        
      case CANCELLED:
        if (cancelMethod) {
          val = cancelMethod.call(target, this.value, this);
        }
        ret.cancel(val);
        break;

      default: // READY states
        ret[RESOLVE_METHOD]  = resolveMethod;
        ret[CANCEL_METHOD]   = cancelMethod;
        ret[PROGRESS_METHOD] = progressMethod;
        ret.__target         = target;

        if (!this._handlers) this._handlers = [];
        this._handlers.push(ret);
    }
    
    return ret ;
  },

  /** @private
  
    Invokes registered callbacks matching methodName, passing the value.
    If flush is true, then the return value is used to resolve or cancel the
    associated promise and then the queue will be dumped at the end.
  */
  _invoke: function(methodName, value, flush) {
    var handlers = this._handlers,
        len      = handlers ? handlers.length : 0,
        idx, pr, method, res;
          
    if (len<=0) return this; // nothing to do
    
    for(idx=0;idx<len;idx++) {
      pr      = handlers[idx];
      method  = pr[methodName];
      res = method ? method.call(pr.__target, value, this) : null;
      if (flush) {
        if (methodName === CANCEL_METHOD) pr.cancel(res);
        else pr.resolve(res);
        pr.__resolve = pr.__cancel = pr.__progress = pr.__target = null;
      }
    }
    
    if (flush) this._handlers = null;
  },
  
  // ..........................................................
  // DEPENDENCIES
  // 
  
  /**
    Makes the receiver promise depend on the passed promise.  once you 
    resolve a promise, it will not actually resolve until all dependents 
    resolve as well.
    
    @param {Promise} pr promise this promise is dependent upon
    @returns {Promise} receiver
  */
  depends: function(pr) {
    
    if (Promise.LOG_PROMISES) logPromise(this, 'depends', pr);
    
    switch(this._status) {
      case PENDING:
        this._status = BLOCKED_PENDING;
        this.holds = 1;
        if (!this._depends) this._depends = {};
        this._depends[tiki.guidFor(pr)] = pr;
        
        pr.then(this, this._resolveHold, this._cancelHold);
        break;
        
      case BLOCKED_PENDING:
      case BLOCKED_RESOLVED:
        this.holds++ ;
        this._depends[tiki.guidFor(pr)] = pr;

        pr.then(this, this._resolveHold, this._cancelHold);
        break;
    }

    return this ;
  },
  
  _resolveHold: function(value, pr) {
    if (Promise.LOG_PROMISES) logPromise(this, 'resolveHold', pr);

    if (this._depends) delete this._depends[tiki.guidFor(pr)];

    switch(this._status) {
      case BLOCKED_PENDING:
        if (this.holds <= 1) {
          this._status = PENDING;
          this.holds  = null; 
        } else this.holds--;
        break;
        
      case BLOCKED_RESOLVED:
        if (this.holds <= 1) {
          this.holds = null;
          this._makeResolved();
        } else this.holds--;
        break;
    }
  },
  
  _cancelHold: function(value, pr) {
    if (Promise.LOG_PROMISES) logPromise(this, 'cancelHold', pr);
    if (this._depends) delete this._depends[tiki.guidFor(pr)];

    if (this._status & BLOCKED) {
      this.holds = null;
      this.value = new Error('hold cancelled');
      this._makeCancelled();
    }
  },
  
  
  // ..........................................................
  // ACTIONS
  // 
  
  /**
    configures the promise so you can run it.  This will only invoke your
    callback once

    @param {Function} method the method to invoke
    @returns {Promise} receiver
  */
  action: function(target, method) {

    if (this._actionStatus === NO_ACTION) {
      // normalize input methods
      if (arguments.length===1) {
        method = target; target = this;
      }

      this.hasAction    = true;
      this.actionTarget = target;
      this.actionMethod = method;
      this._actionStatus = HAS_ACTION;
    }

    return this ;
  },


  /**
    Looks for an "action" function and invokes it unless the promise is
    already resolved or cancelled
  
    @returns {Promise} receiver
  */
  run: function() {
    if (this._actionStatus === HAS_ACTION) {
      this._actionStatus = ACTION_RUNNING;
      this.actionMethod.call(this.actionTarget, this);
      this._actionStatus = ACTION_COMPLETE; // didFinish
    }
    return this ;
  },

  // invoked when the promise resolves.  Switch to ACTION_COMPLETE status to
  // prevent the action from being run again.
  _didResolve: function() {
    this._actionStatus = ACTION_COMPLETE ;
  },

  // invoked when the promise is cancelled.  Switch to ACTION_COMPLETE status
  // to prevent the action from being run.
  _didCancel: function() {
    this._actionStatus = ACTION_COMPLETE ;
  },

  /** @private */
  toString: function() {
    return 'Promise<guid=' + tiki.guidFor(this) + ' id=' + this.id + ' status=' +  state_map[this._status] + '>';
  }
  
}) ;

// returns a new promise, using the pool is possible
Promise.create = function(id) { 
  if (pool.length>0) return pool.pop().init(id);
  else return new Promise(id);
};
Promise.create.displayName = 'Promise.create';

Promise.LOG_PROMISES = false;

tiki.setupDisplayNames(Promise.prototype, 'Promise');

exports = module.exports = Promise;
exports.Promise = Promise;

