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
  :test_dynamic_required => [:core_test],
  :use_modules    => true,
  :use_loader     => true,
  :factory_format => :function, # string is not needed here
  :module_lib     => ['lib'],
  :combine_javascript => true # always improve load times
