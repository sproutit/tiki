// ==========================================================================
// Project:   SproutCore Unit Testing Library
// Copyright: ©2006-2009 Sprout Systems, Inc. and contributors.
//            Portions ©2008-2009 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see license.js)
// ==========================================================================
/*globals run typeOf T_FUNCTION T_OBJECT T_HASH */

"import tiki:core core";
"export run";

function _beginGroup(logger, moduleName) {
  if (moduleName && logger) {
    if (logger.moduleDidBegin) logger.moduleDidBegin(moduleName);
    else if (logger.group) logger.group(moduleName);
  }
  
  return true;
}

function _runTest(tests, testName, testFunc, logger) {
  var inGroup = testName && logger;
  
  if (inGroup) {
    if (logger.testDidBegin) logger.testDidBegin(testName);
    else if (logger.group) logger.group(testName);
  }

  try {
    testFunc.call(tests, testName);
  } catch(e) {
    if (logger) logger.error(e);
  }
  
  if (inGroup) {
    if (logger.testDidEnd) logger.testDidEnd(testName);
    else if (logger.groupEnd) logger.groupEnd(testName);
  }
}

/**
  Runs any tests defined in the passed array of unit tests.  Optionally pass
  a logger as a second argument which will be used to output the test.
  
  @param {Hash} tests tests to run. looks for any item beginning with 'test'
  @param {Logger} logger optional logger to use for output
  @param {String} moduleName optional moduleName to use when grouping tests
  @returns {void}
*/
run = function run(tests, logger, moduleName) {
  var prevLogger, key, value, inGroup = false;
  
  prevLogger = CoreTest.logger;
  logger = CoreTest.logger = (logger || require('system/logger', 'default').console);
  
  for(key in tests) {
    if (!tests.hasOwnProperty(key)) continue;
    if (key.indexOf('test') !== 0) continue ;

    value = tests[key];
    switch(typeOf(value)) {
      case T_FUNCTION:
        if (!inGroup) inGroup = _beginGroup(logger, moduleName);
        _runTest(tests, key, value, logger);
        break;
        
      case T_HASH:
      case T_OBJECT:
        if (!inGroup) inGroup = _beginGroup(logger, moduleName);
        run(value, logger, key.slice(4));
        break;
    }
  }
  
  if (inGroup && logger) {
    if (logger.moduleDidEnd) logger.moduleDidEnd(moduleName);
    else if (logger.groupEnd) logger.groupEnd(moduleName);
  }
  
  CoreTest.logger = prevLogger;
};

CoreTest.run = run; // preferred way to access this
