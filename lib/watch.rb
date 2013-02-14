#!/usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'rubygems'
require 'listen'
require 'postupdate.rb'

FOLDER = ARGV[0]
PORT = ARGV[1]

callback = Proc.new do |modified, added, removed|
  changes = []
  (modified + added + removed).each do |e|
    changes.push(e.sub(/\/.*$/, ''))
  end
  changes.sort!
  changes.uniq!
  postUpdate(PORT, changes.join("\n"))
end

listener = Listen.to(FOLDER)
listener.relative_paths(true)
listener.change(&callback)

listener.start
