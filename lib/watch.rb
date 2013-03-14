#!/usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'rubygems'
require 'listen'
require 'postupdate.rb'

FOLDER = ARGV[0]
PORT = ARGV[1]

$mutex = Mutex.new
$changes = []

Thread.new do
  while true
    changes = nil
    $mutex.synchronize do
      changes = $changes
      $changes = []
    end
    if changes.length > 0
      changes = changes.join("\n")
      while not postUpdate(PORT, changes)
        p 'retrying...'
        sleep(3.0)
      end
    else
      sleep(1.0)
    end
  end
end

callback = Proc.new do |modified, added, removed|
  $mutex.synchronize do
    (modified + added + removed).each do |e|
      $changes.push(e.sub(/\/.*$/, ''))
    end
    $changes.sort!
    $changes.uniq!
  end
end

listener = Listen.to(FOLDER)
listener.relative_paths(true)
listener.change(&callback)

listener.start
