# ===========================================================================
# Project:   Tiki
# Copyright: ©2009 Apple Inc.
# ===========================================================================

# Patch these guys for now...
%w(bootstrap runtime datastore foundation desktop mobile).each do |k|
  config "sproutcore/#{k}", :use_modules => false
end

config 'sproutcore/bootstrap', :use_loader => false

# Configure Torch only - rest of frameworks should take care of themselves
config :torch,
  :required => %w(tiki tiki/platform/classic tiki/system),
  :test_required => [:core_test],
  :test_debug    => [],
  :use_modules   => true,
  :theme         => nil