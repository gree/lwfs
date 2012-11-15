#!/usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'rubygems'
require 'rb-fchange'
require 'postupdate.rb'

timer = nil

fchange = FChange::Notifier.new
fchange.watch(ARGV[0], :all_events, :recursive) do |event|
  postUpdate()
end

['INT', 'TERM'].each do |signal|
  Signal.trap(signal) do
    fchange.stop
    abort("\n")
  end
end

fchange.run
