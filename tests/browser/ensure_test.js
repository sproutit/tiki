// ==========================================================================
// Project:   Seed - Flexible Package Manager
// Copyright: ©2009-2010 Apple Inc. All rights reserved.
// License:   Licened under MIT license (see __preamble__.js)
// ==========================================================================

var tiki = require('tiki:tiki'),
    Ct   = require('core_test');
    
Ct.module('Browser.ensure');

Ct.setup(function(t, done) {
  t.browser = tiki.Browser.start();
  
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "tiki:resources": ['js1.js', 'js2.js', 'stylesheet.css']
  });
  
  t.browser.module('::foo/1.2.1:bar', function(r,e){ e.moduleId = 'bar'; });
  
  // patch browser to invoke a callback registered on t by the test
  t.browser._loadScript = function(id, url, done) {
    t.loadScript(id, url, done);
  };
  
  t.browser._loadStylesheet = function(id, url, done) {
    t.loadStylesheet(id, url, done);
  };
  
  t.scriptLoads = [];
  t.stylesheetLoads = [];
  
  // defaults just count load request
  t.loadScript = function(id, url, done) {
    t.scriptLoads.push(id);
    setTimeout(function() {
      t.browser.script(id);
    }, 100); // simulate load
  };

  t.loadStylesheet = function(id, url) {
    t.stylesheetLoads.push(id);
    setTimeout(function() {
      t.browser.stylesheet(id);
    }, 100);
  };
  
  done();
  
});

Ct.teardown(function(t, done) {
  var k ='browser scriptLoads stylesheetLoads loadScript loadStylesheet'.split(' '),
      loc = k.length;
  while(--loc>=0) delete t[k[loc]];
  done();
});

Ct.test("ensure with all resources loaded", function(t, done) {
  t.browser.script('::foo/1.2.1:js1.js');
  t.browser.script('::foo/1.2.1:js2.js');
  t.browser.stylesheet('::foo/1.2.1:stylesheet.css');

  t.timeout(1000, done);
  t.expect(3);
  t.browser.require.ensure('foo:bar', function(err) {
    t.equal(err, null, 'should not have error');
    t.equal(t.scriptLoads.length, 0, 'should not call loadScript');
    t.equal(t.stylesheetLoads.length, 0, 'should not call loadStylesheet');
    done();
  });
});

Ct.test('ensure should load missing resources', function(t, done) {
  t.browser.script('::foo/1.2.1:js1.js');
  t.timeout(1000, done);
  t.expect(6);
  t.browser.require.ensure('foo:bar', function(err) {
    t.equal(err, null, 'should not have error');
    t.deepEqual(t.scriptLoads, ['::foo/1.2.1:js2.js'], 'loadScript');
    t.deepEqual(t.stylesheetLoads, ['::foo/1.2.1:stylesheet.css'], 'loadStylesheet');
    
    // calling again should not load again..
    t.scriptLoads.length = 0;
    t.stylesheetLoads.length = 0;
    
    t.browser.require.ensure('foo:bar', function(err) {
      t.equal(err, null, 'should not have error');
      t.equal(t.scriptLoads.length, 0, 'should not call loadScript');
      t.equal(t.stylesheetLoads.length, 0, 'should not call loadStylesheet');
      done();
    });

  });
});

Ct.test('ensure should load dependencies as well', function(t, done) {
  t.browser.register('::bar/2.0.0', {
    'name': 'bar',
    'version': '2.0.0',
    
    'dependencies': {
      'foo': '=1.2.1'
    },
    
    'tiki:resources': ['javascript.js']
  });

  t.browser.module('::bar/2.0.0:baz', function(r,e) {});
  
  t.timeout(1000, done);
  t.expect(3);
  t.browser.require.ensure('bar:baz', function(err) {
    t.equal(err, null, 'should not have error');
    t.deepEqual(t.scriptLoads, [
      '::foo/1.2.1:js1.js',
      '::foo/1.2.1:js2.js',
      '::bar/2.0.0:javascript.js' // note: order is important here...
    ], 'loadScript');
    
    t.deepEqual(t.stylesheetLoads, [
      '::foo/1.2.1:stylesheet.css'
    ], 'loadStylesheet');
    
    done();
  });
  
});

// ..........................................................
// SPECIAL CASES
// 

Ct.module('Browser.ensure - special cases');

Ct.setup(function(t, done) {
  t.browser = tiki.Browser.start();
  
  // foo will need to load bar, which is an external ref.  when bar loads
  // it turns out that it requires a different set of dependencies.  uh oh!
  // make sure those load as well.
  t.browser.register('::foo/1.2.1', {
    "name": "foo",
    "version": "1.2.1",
    "dependencies": {
      "bar": "=2.0.0"
    },
    
    'tiki:resources': ['javascript.js']
  });
  
  t.browser.register('::bar/2.0.0', {
    "name": "bar",
    "version": "2.0.0",
    "dependencies": {
      "fizz": "1.2.1"
    },
    "tiki:external": true,
    "tiki:resources": ["javascript.js"]
  });
  // NOTE: fizz is not registered. This should not throw an error since 
  // it will be replaced with something more accurate later...
  
  t.browser.module('::foo/1.2.1:bar', function(r,e){ e.moduleId = 'bar'; });

  t.loaded = [];
  
  // patch load script to fake it.  when loading bar, change dependencies.
  t.browser._loadScript = function(id, url, done) {
    t.loaded.push(id);
    setTimeout(function() {
      if (id === '::bar/2.0.0:javascript.js') {
        t.browser.register('::bar/2.0.0', {
          "name": "bar",
          "version": "2.0.0",
          "dependencies": {
            "pop": "3.2.1"
          },
          "tiki:resources": ["javascript.js"]
        });
        
        t.browser.register('::pop/3.2.1', {
          "name": "pop",
          "version": "3.2.1",
          "tiki:external": true,
          "tiki:resources": ["javascript.js"]
        });

      // make pop not external when it loads...
      } else if (id === '::pop/3.2.1:javascript.js') {
        t.browser.register('::pop/3.2.1', {
          "name": "pop",
          "version": "3.2.1",
          "tiki:resources": ["javascript.js"]
        });
      }
      
      t.browser.script(id);
    }, 100);
  };
  
  
  done();
  
});

Ct.teardown(function(t, done) {
  var k ='browser loaded'.split(' '),
      loc = k.length;
  while(--loc>=0) delete t[k[loc]];
  done();
});

Ct.test('should load nested dependencies',function(t, done) {
  t.timeout(1000, done);
  t.expect(2);
  t.browser.require.ensure('foo:bar', function(err) {
    t.equal(err, null, 'should not have an error');
    t.deepEqual(t.loaded, [
      '::bar/2.0.0:javascript.js',
      '::foo/1.2.1:javascript.js',
      '::pop/3.2.1:javascript.js'
    ]);
    done();
  });
});

Ct.run();
