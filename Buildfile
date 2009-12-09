# ===========================================================================
# Project:   Tiki
# Copyright: ©2009 Apple Inc.
# ===========================================================================

#######################################################
## CORE TIKI FRAMEWORK
##

config :tiki, 
  :required       => [],
  :debug_required => [],
  :test_required  => [],
  :use_modules    => true,
  :use_loader     => true,
  :factory_format => :function, # string is not needed here
  :module_lib  => ['lib', 'debug'],
  :combine_javascript => true # always improve load times

# Special framework for testing tiki
config :tiki_tests,
  :required => [:tiki],
  :debug_required => [],
  :test_required  => [:core_test],
  :use_modules    => true,
  :use_loader     => true,
  :factory_format => :function
  
#######################################################
## TIKI/SYSTEM FRAMEWORK
##

config :system, 
  :required => [:tiki, (SC.env.platform || 'tiki/platform/classic')],
  :debug_required => [],
  :test_required => [], # see tests in tiki_tests
  :use_modules => true,
  :use_loader => true,
  :combine_javascript => true

#######################################################
## PLATFORM FRAMEWORKS
##

%w(platform/classic).each do |target|
  config target,
    :required       => [:tiki],
    :debug_required => [],
    :test_required  => [], # tests are in tiki_tests
    :use_modules    => true,
    :use_loader     => true,
    :combine_javascript => true
end
