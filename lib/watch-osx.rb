#!/usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'rubygems'
require 'rb-fsevent'
require 'postupdate.rb'

timer = nil

fsevent = FSEvent.new
fsevent.watch [ARGV[0]] do |directories|
  postUpdate()
end

['INT', 'TERM'].each do |signal|
  Signal.trap(signal) do
    fsevent.stop
    abort("\n")
  end
end

fsevent.run
