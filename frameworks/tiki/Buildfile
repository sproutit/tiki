# ===========================================================================
# Project:   Tiki
# Copyright: ©2009 Apple Inc.
# ===========================================================================

config :tiki, 
  :required       => [],
  :required_debug => [],
  :required_test  => [:core_test],
  :use_modules    => true,
  :use_loader     => true
  
%w(platform/classic platform/html5 platform/server system).each do |target|
  config target,
    :required       => [:tiki],
    :required_debug => [],
    :required_test  => [:core_test],
    :use_modules    => true,
    :use_loader     => true
end
