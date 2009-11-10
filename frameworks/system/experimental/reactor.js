// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals  Reactor PAUSED STARTED READY RUNNING next schedule repeat send start run  reactor mixin Retainable pause */

"import core";
"import mixins/retainable";
"export PAUSED READY RUNNING STARTED next schedule repeat send start run pause";
"export Reactor reactor";

/**
  @file
  
  A Reactor is a very simple event handling queue.  You can use the reactor
  to queue events or actions that you want to process.  You can create as many
  reactors as you want, but usually you will actually use just the built-in
  default reactor provided by this module.
  
  To schedule an action to run in the reactor, you can call either next() or
  after().  next() will execute the action immediately at the end of the 
  current event loop.  after() will execute the action after a specified 
  period of time.
  
  For this to work, you must implement a platform/timer module which can 
  fire a return action after a set amount of time.  Note that the 
  system/timer functionality is actually implemented on top of the reactor,
  not directly on top of the platform/timer.  This way it can take advantage
  of the queing here.
  
*/

PAUSED  = 'paused';  // initial state of a reactor
STARTED = 'started'; // reactor was started but platform is not ready
READY   = 'ready';   // reactor is ready to handle events
RUNNING = 'running'; // reactor is processing events

// reactor constructor.
Reactor = function Reactor(id) {
  this.id = id;
};

mixin(Reactor.prototype, Retainable, {
  
  // status will be READY, PAUSED, RUNNING
  status: PAUSED,

  // this must be called once to get the reactor going.  Otherwise scheduled
  // items will do nothing.
  start: function() {
    return this;
  },

  // pauses the reactor so that calling run() will have no effect.  You must
  // call start to go again.
  pause: function() {
    return this;
  },

  // Runs a single event loop in the reactor.  Returns when there are no more
  // events to process
  run: function() {

  },

  // schedule a target/method + arguments to execute at the end of this run
  next: function(target, method, args) {

  },

  // schedules a target/method + arguments to execute after a period of time
  schedule: function(delay, target, method, args) {

  },

  // schedules a target/method to run when the reactor is ready to accept 
  // events - otherwise this is like calling next
  ready: function(target, method, args) {
    return this ;
  },
  
  // schedules a target/method to run when the reactor is destroyed on page
  // is unloaded.
  unload: function(target, method, args) {    
  },
  
  _ready: function() {
  },
  
  _unload: function() {
    
  },
  
  destroy: function() {
    
  }
  
});



// ..........................................................
// API
// 

// default reactor to use
reactor = new Reactor('default');

// runs on default
next = function(target, method, args) {
  return reactor.next.apply(reactor, arguments);
};

// runs on default
schedule = function(target, method, args) {
  return reactor.schedule.apply(reactor, arguments);
};

// runs on default
run = function() {
  return reactor.run();
};

// runs on default
start = function() {
  return reactor.start();
};

// runs on default
pause = function() {
  return reactor.pause();
};

