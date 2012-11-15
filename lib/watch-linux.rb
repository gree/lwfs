#!/usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'rubygems'
require 'rb-inotify'
require 'postupdate.rb'

timer = nil

notifier = INotify::Notifier.new
notifier.watch(ARGV[0], :modify, :recursive) do |directories|
  postUpdate()
end

['INT', 'TERM'].each do |signal|
  Signal.trap(signal) do
    notifier.stop
    abort("\n")
  end
end

notifier.run
