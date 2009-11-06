# ===========================================================================
# Project:   Tiki
# Copyright: ©2009 Apple Inc.
# ===========================================================================

config :tiki, 
  :required       => [],
  :debug_required => [],
  :test_required  => [], # we actually require core_test :(
  :use_modules    => true,
  :use_loader     => true,
  :factory_format => :function, # string is not needed here
  :combine_javascript => true # always improve load times
  
%w(platform/classic platform/html5 platform/server).each do |target|
  config target,
    :required       => [:tiki],
    :debug_required => [],
    :test_required  => [:core_test],
    :use_modules    => true,
    :use_loader     => true,
    :combine_javascript => true
end

config :system, 
  :required => [:tiki, 'platform/classic'],
  :debug_required => [],
  :test_required => [:core_test],
  :use_modules => true,
  :use_loader => true,
  :combine_javascript => true
  

