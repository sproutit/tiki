// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals Logger console core */

"import tiki:package as tiki";
"import core as core";
"export package Logger console";

/** 
  @file

  Module defines generic functions that can be used to log output into a 
  string or file.
  
  The Logger class defined in this module implements the generic Logger API,
  which includes warn(), info(), error(), debug() and log().  
  
  The console object logs this to a system-provided console (on browsers this
  is equivalent to the system-provided console).

  @since Tiki 1.0
*/

// get the platform console
var pconsole = tiki.platform('console').console;

/**
  Logger class defines a standard logger.  If you attach a console, then the
  logger will record its own results AND forward any output to the console 
  itself.  
  
  A default logger is usually created and exported as "console" that will 
  attach to the platform console.  You can create a new logger if you want as 
  well.

  @since Tiki 1.0
*/
Logger = function Logger(id, console) {
  this.id = id ;
  this.console = console;
  return this ;
};

var COLON = ': ', NEWLINE = "\n", TILDA = ' ~ ';

Logger.prototype = {
  
  /**
    Emits count number of lines (or 100 lines if not specified) as a single
    string.
    
    @property {Number} count number of lines to display. optional
    @returns {String} logged output
  */
  tail: function(count) {
    var lines = this._lines,
        len   = lines ? lines.length : 0,
        idx, ret;

    if (len===0) return '';

    if (count === undefined) count = 100;
    ret = [];
    for(idx = Math.max(0, len - count); idx < len; idx++) {
      
      if (this.id) {
        ret.push(this.id);
        ret.push(TILDA);
      }
      if (lines[idx].kind) {
        ret.push(lines[idx].kind);
        ret.push(COLON);
      }
      ret.push(lines[idx].message);
      ret.push(NEWLINE);      
    }
    
    return ret.join("");
  },
  
  /**
    Clears the log contents
    
    @returns {Logger} reciever
  */
  clear: function() {
    this._lines = null;
    return this ;
  },
  
  /**
    Adds a line to the log.  Pass the log type and message.
    
    @param {String} kind kind of log message.  should be WARN, DBEUG, or null
    @param {String} message message to log
    @returns {Logger} reciever
  */
  push: function(kind, message) {
    var lines = this._lines;
    if (!lines) lines = this._lines = [];
    lines.push({ kind: kind, message: message });
  },
  
  /**
    Logs a debug statement.
    
    @param {String} msg one or more items to log
    @returns {void} 
  */
  debug: function(msg) {
    this.push('DEBUG', core.A(arguments));
    
    var console = this.console;
    if (console && console.debug) console.debug.apply(console, arguments);
  },
  
  /**
    Logs an info statement.
    
    @param {String} msg one or more items to log
    @returns {void}
  */
  info: function(msg) {
    this.push('INFO', core.A(arguments));
    
    var console = this.console;
    if (console && console.info) console.info.apply(console, arguments);
  },
  
  /**
    Logs a warning
    
    @param {String} msg one or more items to log
    @returns {void}
  */
  warn: function(msg) {
    this.push('WARN', core.A(arguments));
    
    var console = this.console;
    if (console && console.warn) console.warn.apply(console, arguments);
  },
  
  /**
    Logs an error.
    
    @param {String} msg one or mroe items to log
    @returns {void}
  */
  error: function(msg) {
    this.push('ERROR', core.A(arguments));
    
    var console = this.console;
    if (console && console.error) console.error.apply(console, arguments);
  },
  
  /**
    Begins a group stack.
  */
  group: function(groupName) {
    this.push('GROUP', groupName);
    
    var console = this.console;
    if (console && console.group) console.group(groupName);
  },
  
  /**
    Ends a group stack
  */
  groupEnd: function(groupName) {
    this.push('','');
    
    var console = this.console;
    if (console && console.groupEnd) console.groupEnd(groupName);
  },
  
  toString: function() {
    var len = this._lines ? this._lines.length : 0;
    return "Logger<id=" + this.id + " size=" + len + ">";
  }
    
};
Logger.prototype.log = Logger.prototype.info;

console = new Logger('console', pconsole);
