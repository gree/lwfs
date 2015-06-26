#
# TinyListen - very simplified 'listen' gem.
#
# Usage:
#
#   listener = TinyListen.to(FOLDER) do |modified, added, removed|
#     p modified, added, removed
#   end
#   at_exit do
#     listener.stop
#   end
#   listener.start
#

require 'pathname'
if RUBY_PLATFORM =~ /darwin/
  require 'rb-fsevent'
elsif RUBY_PLATFORM =~ /mingw/
  require 'wdm'
elsif RUBY_PLATFORM =~ /linux/
  require 'rb-inotify'
end

module TinyListen
  class << self
    def to(*args, &block)
      Listener.new(*args, &block)
    end
  end

  class Listener
    def initialize(*args, &block)
      @directories = args.flatten.map do |path|
        Pathname.new(path).realpath.to_s
      end
      @block = block
      @monitor = nil
    end

    def start
      root = @directories[0]  # treat a single directory for now.
      @files0 = Files.new(root)
      if RUBY_PLATFORM =~ /darwin/
        @monitor = FSEvent.new
        @monitor.watch(root) do |directories|
          onChanged(root)
        end
        Thread.new do
          @monitor.run
        end
      elsif RUBY_PLATFORM =~ /mingw/
        @monitor = WDM::Monitor.new
        @monitor.watch_recursively(root) do |change|
          onChanged(root)
        end
        Thread.new do
          @monitor.run!
        end
      elsif RUBY_PLATFORM =~ /linux/
        @monitor = INotify::Notifier.new
        @monitor.watch(root, :modify, :recursive) do |event|
          onChanged(root)
        end
        Thread.new do
          @monitor.run
        end
      end
    end

    def stop
      @monitor.stop unless @monitor.nil?
      @monitor = nil
    end

    def onChanged(root)
      files1 = Files.new(root);
      result = @files0.compare(files1)
      @files0 = files1
      @block.call(*result) unless result.all?(&:empty?)
    end
  end

  class Files
    attr_reader :names
    attr_reader :stats

    def initialize(folder)
      in_progress = true
      while in_progress
        begin
          @names = Dir.glob("#{folder}/**/*").select do |name|
            File.file?(name)
          end
          @stats = {}
          @names.each do |name|
            @stats[name] = File.mtime(name)
          end
          in_progress = false
        rescue
        end
      end
    end

    def compare(files)
      removed = @names - files.names
      added = files.names - @names
      modified = (@names - removed).select do |name|
        @stats[name] != files.stats[name]
      end
      [modified, added, removed]
    end
  end
end
