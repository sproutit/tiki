// ==========================================================================
// Project:   Tiki
// Copyright: ©2009 Apple Inc.
// ==========================================================================
/*globals core equal plan */

"import package core_test";
"import tiki:core as core";

module("setupDisplayNames");

test("should set displayName on any functions found in hash", function(){
  var h = {
    string: "foo",
    number: 1,
    bool: true,
    method: function() {}
  };

  core.setupDisplayNames(h, 'H');

  var k,v;
  for(k in h) {
    if (!h.hasOwnProperty(k)) continue;    
    if (k === 'method') {
      equal(h[k].displayName, 'H.'+k, 'should have displayName');
    } else {
      equal(h[k].displayName, undefined, 'should NOT have displayName');
    }
  }

});

plan.run();

