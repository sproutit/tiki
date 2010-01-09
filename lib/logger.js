// ==========================================================================
// Project:   Tiki - CommonJS Runtime
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

"use exports Logger console";

var Logger;

/** 
  @file

  A logger implements the same interface as the browser-native Console but 
  it is chainable.  You can implement your own Logger and insert it into the
  console chain to capture output for your application.  Add it to your 
  sandbox if you prefer.

  @since Tiki 1.0
*/

var COLON = ': ', NEWLINE = "\n", TILDA = ' ~ ', TMP_ARY=[];

/**
  Logger class defines a standard logger.  If you attach a console, then the
  logger will record its own results AND forward any output to the console 
  itself.  
  
  A default logger is usually created and exported as "console" that will 
  attach to the platform console.  You can create a new logger if you want as 
  well.
  
  To override the logger, you should at least implement the add() method 
  to capture log output.  All higher-level methods boil down to this core
  method.

  Note that add() is not required to pass along methods to the next logger.
  This is handled by higher-level methods.
  
  @since Tiki 1.0
*/
Logger = tiki.extend(/** @scope Logger.prototype */ {

  /** @constructor
    Pass an optional next logger and an id for chaining purposes.

    @param {String} id a name for the logger
    @param {Logger} next the next logger if desired
    @returns {void}
  */
  init: function(id, next) {
    this.id = id ;
    this.next = next ;
  },

  // ..........................................................
  // CORE API
  // 
  
  /**
    Core method that captures log output.  You should never call this method
    in your own code but you might override it if you create your own 
    logger.
    
    @param {String} level the level of the message
    @param {String} message message to log
    @returns {void}
  */
  add: function(level, message) {
    var idx, line, buf = TMP_ARY;
    buf.length = 0;
    if (this.id) {
      buf.push(this.id);
      buf.push(TILDA);
    }

    buf.push(level); // first arg
    
    if (arguments.length>1) {
      buf.push(COLON);
      buf.push(message);
    }
    
    line = buf.join('');
    if (!this.lines) this.lines = [];
    this.lines.push(line);
    buf.length = 0 ; // reset
  },

  /**
    Emits the current log.  This may do nothing if you do not log to the 
    internal lines array.
    
    @param {Number} count 
      optional max number of lines to emit.  otherwise emits all

    @returns {String} 
  */
  tail: function(count) {
    var lines = this.lines,
        len   = lines ? lines.length : 0;
    if (len===0) return ''; // nothing to do
    if ((count === undefined) || (count>=len)) return lines.join(NEWLINE);
    else return lines.slice(len-count).join(NEWLINE);
  },
  
  /**
    Clears the log contents
    
    @returns {Logger} reciever
  */
  clear: function() {
    this.lines = null;
    return this ;
  },

  // ..........................................................
  // HIGH LEVEL API - Like Console
  // 

  _add: function(methodName, args, msg) {
    
    // log locally
    if (msg === undefined) {
      if (args.length < 1) msg = '';
      else if (args.length === 1) msg = args[0].toString();
      else msg = args.join(',');
    }  
    this.add(methodName, msg);

    // pass along
    var next = this.next;
    if (next && next[methodName]) next[methodName].apply(next, args);
  },
  
  /**
    Logs a debug statement.
    
    @param {String} msg one or more items to log
    @returns {void} 
  */
  debug: function(msg) {
    this._add('debug', arguments);
  },
  
  /**
    Logs an info statement.
    
    @param {String} msg one or more items to log
    @returns {void}
  */
  info: function(msg) {
    return this._add('info', arguments);
  },
  
  /**
    Logs a warning
    
    @param {String} msg one or more items to log
    @returns {void}
  */
  warn: function(msg) {
    return this._add('warn', arguments);
  },
  
  /**
    Logs an error.
    
    @param {String} msg one or mroe items to log
    @returns {void}
  */
  error: function(msg) {
    return this._add('error', arguments);
  },
  
  /**
    Begins a group stack.
  */
  group: function(groupName) {
    return this._add('group', null, groupName);
  },
  
  /**
    Ends a group stack
  */
  groupEnd: function(groupName) {
    return this._add('groupEnd', null, groupName);
  },
  
  toString: function() {
    var len = this._lines ? this._lines.length : 0;
    return "Logger<id=" + this.id + " size=" + len + ">";
  }
    
});

Logger.prototype.log = Logger.prototype.info;

exports = module.exports = Logger ;
exports.Logger = Logger;
exports.console = new Logger('default', console);

