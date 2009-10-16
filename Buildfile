# ===========================================================================
# Project:   Tiki
# Copyright: ©2009 My Company, Inc.
# ===========================================================================

# Add initial buildfile information here
config :all, 
  :required => [:tiki, :core_test, :runtime], 
  :use_modules => true,
  :test_required  => [:core_test],
  :debug_required => [],
  :bootstrap_inline => 'tiki:bootstrap'
   
mode :debug do
  config :all, :debug_required => []
end

config :tiki,      :required => []
config :core_test, :required => [:tiki]
config :runtime,   :required => [:tiki]