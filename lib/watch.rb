#!/usr/bin/env ruby
$:.unshift File.dirname(__FILE__)

require 'rubygems'
require 'tinylisten.rb'
require 'postupdate.rb'

FOLDER = ARGV[0]
PORT = ARGV[1]
IS_RUNNING = ARGV[2]
IGNORED_PATTERN = /#{ARGV[3]}/
Thread.new do
  while true
    exit(0) unless File.exists?(IS_RUNNING)
    sleep(2.0)
  end
end

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
        sleep(1.0)
      end
    else
      sleep(1.0)
    end
  end
end

listener = TinyListen.to(FOLDER) do |modified, added, removed|
  all = (modified + added + removed).select do |name|
    not name =~ /(^|\/)[.,]/
  end
  $mutex.synchronize do
    all.each do |entry|
#      entry = entry.encode(Encoding::UTF_8,
#                           Encoding.default_external,
#                           :invalid => :replace,
#                           :undef => :replace)
      entry = entry.sub(/^#{FOLDER}\//, '')
      prefix = ''
      if entry =~ /^([A-Z][A-Z0-9_\-]*)((\/[A-Z][A-Z0-9_\-]*)*)(\/?)/
        # fully captal characters represent projects and allow nested folders.
        prefix = $1 + $2 + $4
      end
      entry = entry.slice(prefix.length, entry.length - prefix.length)
      $changes.push(prefix + entry.sub(/\/.*$/, '')) unless entry == '' or entry =~ IGNORED_PATTERN
    end
    $changes.sort!
    $changes.uniq!
  end
end
at_exit do
  listener.stop
end
listener.start
sleep
