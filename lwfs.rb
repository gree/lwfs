#!/usr/bin/env ruby -Ku
# -*- coding: utf-8 -*-
$:.unshift File.dirname(__FILE__)

require 'rbconfig'
require 'rubygems'
require 'fileutils'
if RUBY_PLATFORM == /java/
  require 'listen'
end
require 'logger'
require 'set'
require 'sinatra'
require 'socket'
require 'tmpdir'
require 'uuidtools'
require 'lib/postupdate.rb'
require 'lib/swf2lwf/lib/json.rb'
require 'lib/swf2res.rb'
module Sinatra::Helpers
  # adhocly avoid the conflict with 'error' defined in swf2lwf.rb
  def error(str)
    @logfile.puts "ERROR: #{str}" if @logfile
    puts "ERROR: #{str}"
  end

  def xerror(code, body=nil)
    code, body    = 500, code.to_str if code.respond_to? :to_str
    response.body = body unless body.nil?
    halt code
  end

  def not_found(body=nil)
    xerror 404, body
  end
end

$log = Logger.new((ENV['LWFS_LOG_FILE'].nil?) ? STDOUT : ENV['LWFS_LOG_FILE'], 10)
$updated_jsfls = []
$mutex_p = Mutex.new
$mutex_i = Mutex.new
$changes = []
$is_in_post = false
$is_interrupted = false
$is_start = true
$watcher = 0

IS_RUNNING = File.dirname(__FILE__) + "/.lwfs_is_running.#{$$}"
at_exit { FileUtils.rm_f(IS_RUNNING) }
FileUtils.touch(IS_RUNNING)
Thread.new do
  while true
    exit(0) unless File.exists?(IS_RUNNING)
    sleep(2.0)
  end
end

def glob(filter)
  entries = []
  if filter.kind_of?(Array)
    filter = filter.map{|e| e.encode(Encoding::UTF_8)}
  else
    filter = filter.encode(Encoding::UTF_8)
  end
  Dir.glob(filter).each do |e|
    entries.push(e) unless e =~ /(^|\/)[#,]/
  end
  entries
end

def sameFile?(f0, f1)
  return false unless (File.file?(f0) and File.file?(f1))
  f0_s = File.stat(f0)
  f1_s = File.stat(f1)
  # cp_r with :preserve => true seems too expensive on windows. we
  # omit it now and thus mtime will change.
  return false if (f0_s.mtime > f1_s.mtime || f0_s.size != f1_s.size)
  FileUtils.cmp(f0, f1)
end

configure do
  set :port, 10080
  set :public_folder, File.dirname(__FILE__) + '/htdocs'

  def updateJSFL(folders)
    ['LWF_Publish.jsfl', 'include JavaScript for LWF.jsfl'].each do |jsfl|
      src_file = "lib/#{jsfl}"
      folders.each do |folder|
        dst_file = "#{folder}/#{jsfl}"
        if needUpdate?(src_file, dst_file)
          FileUtils.cp("lib/#{jsfl}", folder, {:preserve => true})
          $updated_jsfls.push(jsfl) unless $updated_jsfls.include?(jsfl)
        end
      end
    end
  end

  def needUpdate?(src, dst)
    return false unless File.file?(src)
    return true unless File.file?(dst)
    src_s = File.stat(src)
    dst_s = File.stat(dst)
    src_s.mtime > dst_s.mtime and not FileUtils.cmp(src, dst)
  end

  EXCLUDE_PATTERN = /\/(_|[^\/]+\.lwfdata)\/.*$/

  if File.file?('lib/LWFS_VERSION')
    VERSION = File.read('lib/LWFS_VERSION').chomp
  else
    VERSION = 'development'
  end
  if ENV['LWFS_FRAME_RATE'].nil?
    FRAME_RATE = 0
  else
    FRAME_RATE = ENV['LWFS_FRAME_RATE'].to_i
  end
  if ENV['LWFS_FRAME_STEP'].nil?
    FRAME_STEP = 0
  else
    FRAME_STEP = ENV['LWFS_FRAME_STEP'].to_i
  end
  if ENV['LWFS_DISPLAY_SCALE'].nil?
    DISPLAY_SCALE = 0
  else
    DISPLAY_SCALE = ENV['LWFS_DISPLAY_SCALE'].to_f
  end
  if ENV['LWFS_SCREEN_SIZE'].nil?
    SCREEN_SIZE = '0x0'
  else
    SCREEN_SIZE = ENV['LWFS_SCREEN_SIZE']
  end
  REMOTE_SERVER = ENV['LWFS_REMOTE_SERVER']
  BIRD_WATCHER_SERVER = ENV['LWFS_BIRD_WATCHER_SERVER']
  if ENV['LWFS_TARGETS'].nil?
    TARGETS = ['webkitcss', 'canvas', 'webgl']
  else
    TARGETS = ENV['LWFS_TARGETS'].split(/,/)
  end
  RUBY_COMMAND = (RUBY_PLATFORM =~ /java/) ? 'jruby' : 'ruby'
  if RbConfig::CONFIG['host_os'].downcase =~ /darwin/
    prefix = ENV['HOME']
    updateJSFL(glob(prefix + '/Library/Application Support/Adobe/Flash CS*/*/Configuration/Commands'))
    SRC_DIR = prefix + '/Desktop/LWFS_work'
    if ENV['LWFS_USE_OUTPUT_FOLDER'] == '1'
      OUT_DIR = prefix + '/Desktop/LWFS_work_output'
    else
      OUT_DIR = nil
    end
    OPEN_COMMAND = 'open'
    WATCH_SCRIPT = 'lib/watch.rb'
    LOG_FILE = '/dev/null'
  elsif RbConfig::CONFIG['host_os'].downcase =~ /mswin(?!ce)|mingw|cygwin|bccwin/
    prefix = ENV['USERPROFILE'].gsub(/\\/, '/')
    updateJSFL(glob([prefix + '/AppData/Local/Adobe/Flash CS*/*/Configuration/Commands',
                     prefix + '/Local Settings/Application Data/Adobe/Flash CS*/*/Configuration/Commands']))
    SRC_DIR = prefix + '/Desktop/LWFS_work'
    if ENV['LWFS_USE_OUTPUT_FOLDER'] == '1'
      OUT_DIR = prefix + '/Desktop/LWFS_work_output'
    else
      OUT_DIR = nil
    end
    OPEN_COMMAND = 'start'
    WATCH_SCRIPT = 'lib/watch.rb'
    LOG_FILE = 'NUL'
  elsif RbConfig::CONFIG['host_os'].downcase =~ /linux/
    prefix = ENV['HOME']
    SRC_DIR = prefix + '/LWFS_work'
    if ENV['LWFS_USE_OUTPUT_FOLDER'] == '1'
      OUT_DIR = prefix + '/LWFS_work_output'
    else
      OUT_DIR = nil
    end
    OPEN_COMMAND = 'echo' # dummy
    WATCH_SCRIPT = 'lib/watch.rb'
    LOG_FILE = '/dev/null'
  else
    abort('this platform is not supported.')
  end
  MY_ID = UUIDTools::UUID.sha1_create(UUIDTools::UUID_DNS_NAMESPACE, Socket.gethostname).to_s
  BASE_DIR = "htdocs/lwfs"
  DST_DIR = "#{BASE_DIR}/list"
  # ~/Desktop/LWFS_work
  FileUtils.mkdir_p(SRC_DIR) unless File.directory?(SRC_DIR)
  # htdocs/lwfs
  FileUtils.mv('htdocs/lwfs', '.htdocs_lwfs.' + Time.now.to_f.to_s) if File.directory?('htdocs/lwfs')
  FileUtils.mkdir_p(BASE_DIR)
  FileUtils.cp_r(glob('tmpl/*'), BASE_DIR)
  # ~/Desktop/LWFS_work_output
  if not OUT_DIR.nil?
    FileUtils.mkdir_p(OUT_DIR) unless File.directory?(OUT_DIR)
    FileUtils.mkdir_p("#{OUT_DIR}/html5") unless File.directory?("#{OUT_DIR}/html5")
    FileUtils.mkdir_p("#{OUT_DIR}/unity") unless File.directory?("#{OUT_DIR}/unity")
    FileUtils.mkdir_p("#{OUT_DIR}/native") unless File.directory?("#{OUT_DIR}/native")
    # css
    FileUtils.rm_rf("#{OUT_DIR}/html5/css")
    FileUtils.cp_r('tmpl/css', "#{OUT_DIR}/html5/css")
    # img
    FileUtils.rm_rf("#{OUT_DIR}/html5/img")
    FileUtils.cp_r('tmpl/img', "#{OUT_DIR}/html5/img")
    # js
    FileUtils.rm_rf("#{OUT_DIR}/html5/js")
    FileUtils.mkdir_p("#{OUT_DIR}/html5/js")
    FileUtils.cp_r('tmpl/js/birdwatcher.js', "#{OUT_DIR}/html5/js")
    FileUtils.cp_r('tmpl/js/qrcode.js', "#{OUT_DIR}/html5/js")
    FileUtils.cp_r('tmpl/js/test-html5.js', "#{OUT_DIR}/html5/js")
    glob('tmpl/js/lwf*.js').each do |f|
      FileUtils.cp(f, "#{OUT_DIR}/html5/js") unless f =~ /(cocos2d|unity)/i
    end
    # js_debug
    FileUtils.rm_rf("#{OUT_DIR}/html5/js_debug")
    FileUtils.mkdir_p("#{OUT_DIR}/html5/js_debug")
    glob('tmpl/js_debug/lwf*').each do |f|
      FileUtils.cp(f, "#{OUT_DIR}/html5/js_debug") unless f =~ /(cocos2d|unity)/i
    end
  end
  PORT = Sinatra::Application.port.to_s
  Thread.new do 
    sleep(0.5)
    while not postUpdate(PORT)
      sleep(1.0)
    end
    $watcher = spawn(RUBY_COMMAND, WATCH_SCRIPT, SRC_DIR, PORT, IS_RUNNING)
  end
end

get '/locate/*' do |path|
  if File.directory?("#{SRC_DIR}/#{path}") or File.file?("#{SRC_DIR}/#{path}")
    if RbConfig::CONFIG['host_os'].downcase =~ /darwin/
      path = "#{SRC_DIR}/#{path}"
      path.encode!(Encoding.default_external)
      `open -R "#{path}"`
    elsif RbConfig::CONFIG['host_os'].downcase =~ /mswin(?!ce)|mingw|cygwin|bccwin/
      path = "#{SRC_DIR}/#{path}".gsub(/\//, '\\')
      path.encode!(Encoding.default_external)
      `start explorer /select,#{path}`
    else
      # not supported
    end
  end
end

get '/*' do |path|
  if path =~ /\/$/
    path = File.join(settings.public_folder, path + 'index.html')
    $mutex_p.synchronize do
      begin
        last_modified File.mtime(path)
        File.read(path)
      rescue => e
        send_file path
      end
    end
  elsif path =~ /\.(html|status)$/
    $mutex_p.synchronize do
      send_file path
    end
  else
    send_file path
  end
end

post '/update/*' do |target|
  $mutex_i.synchronize do
    if params[:arg]
      $changes += params[:arg].split("\n")
    else
      glob("#{SRC_DIR}/**/*").each do |entry|
        prefix = "#{SRC_DIR}/"
        entry = entry.slice(prefix.length, entry.length - prefix.length)
        prefix = ''
        if entry =~ /^([A-Z0-9][A-Z0-9_\-\/]*)/
          # fully captal characters represent projects and allow nested folders.
          prefix = $1
        end
        entry = entry.slice(prefix.length, entry.length - prefix.length)
        $changes.push(prefix + entry.sub(/\/.*$/, '')) unless entry == '' or entry =~ /(^|\/)[.,]/
      end
    end
    $changes.sort!
    $changes.uniq!
    if $is_in_post
      $is_interrupted = true
      return
    end
    $is_in_post = true
  end
  Thread.new do
    t0 = t1 = t2 = t3 = t4 = t5 = t6 = t7 = t8 = Time.now
    if $is_start
      begin
        updateTopIndex(Time.now.to_f, true)
      rescue => e
        $log.error(e.to_s)
        $log.error(e.backtrace.to_s)
      end
      rsync(true) unless REMOTE_SERVER.nil?
      if REMOTE_SERVER.nil?
        `#{OPEN_COMMAND} http://#{Socket.gethostname}:10080/lwfs/list/`
      else
        `#{OPEN_COMMAND} http://#{REMOTE_SERVER}/lwfs/#{MY_ID}/list/`
      end
      # delete old htdocs/lwfs backups
      Thread.new do
        sleep(10.0)
        #FileUtils.rm_rf(glob('.htdocs_lwfs.*'))
        glob('.htdocs_lwfs.*').each do |f|
          rm_rf(f, 0.001)
        end
      end
    else
      $mutex_p.synchronize do
        updateLoadingStatus("#{DST_DIR}/", true)
      end
      rsync(true) unless REMOTE_SERVER.nil?
    end
    $is_start = false
    is_in_progress = true
    while is_in_progress
      catch :restart do
        t1 = Time.now
        checkInterruption(__LINE__, 1.0)
        t2 = Time.now
        changes = {:vanishes => [], :updates => []}
        begin
          changes = sync()
        rescue => e
          $log.error(e.to_s)
          $log.error(e.backtrace.to_s)
          $log.info("restart at #{__LINE__}")
          throw :restart
        end
        t3 = Time.now
        checkInterruption(__LINE__, 0.001)
        t4 = Time.now
        begin
          convert(changes)
        rescue => e
          $log.error(e.to_s)
          $log.error(e.backtrace.to_s)
          $log.info("restart at #{__LINE__}")
          throw :restart
        end
        t5 = Time.now
        checkInterruption(__LINE__, 0.001)
        t6 = Time.now
        begin
          updateFolders(changes)
          updateTopIndex(Time.now.to_f)
        rescue => e
          $log.error(e.to_s)
          $log.error(e.backtrace.to_s)
          $log.info("restart at #{__LINE__}")
          throw :restart
        end
        t7 = Time.now
        $mutex_i.synchronize do
          if $is_interrupted
            $is_interrupted = false
            $log.info("restart at #{__LINE__}")
            throw :restart
          end
          $changes = []
          $is_in_post = false
        end
        rsync() unless REMOTE_SERVER.nil?
        t8 = Time.now
        is_in_progress = false
      end
    end
    $log.info("thread finished #{t8 - t0} #{t8 - t1} i #{t2 - t1} s #{t3 - t2} i #{t4 - t3} c #{t5 - t4} i #{t6 - t5} u #{t7 - t6} i #{t8 - t7}")
  end
end

def checkInterruption(line, wait)
  sleep(wait)
  $mutex_i.synchronize do
    if $is_interrupted
      $is_interrupted = false
      $log.info("restart at #{line}")
      throw :restart
    end
  end
end

def rm_rf(src, w)
  sleep(w)
  glob("#{src}/*").each do |f|
    if File.file?(f)
      FileUtils.rm_rf(f)
    elsif File.directory?(f)
      glob("#{f}/*").each do |f|
        rm_rf(f, w)
      end
      FileUtils.rm_rf(f)
    end
  end
  FileUtils.rm_rf(src)
end

def cp_r(src, dst)
  # FileUtils.cp_r(src, dst)
  glob("#{src}/*").each do |f|
    checkInterruption(__LINE__, 0.001)
    if File.file?(f) and not (f =~ /\/index-[^\/]+\.html$/i)
      if f =~ /(swf|fla|json|conf|html|xml|js|png|jpg|jpeg)$/i
        FileUtils.cp(f, dst)
        #FileUtils.ln(f, dst)
      end
    elsif File.directory?(f) and not (f =~ /\/(_|[^\/]+\.lwfdata)$/i)
      sub = dst + '/' + File.basename(f)
      FileUtils.mkdir(sub)
      cp_r(f, sub)
    end
  end
end

def rmdir_p(folder)
  if File.directory?(folder)
    while glob("#{folder}/*").length == 0
      FileUtils.rmdir(folder)
      folder = File.dirname(folder)
    end
  end
end

def sync()
  t0 = Time.now
  # always start over
  FileUtils.rm_rf(glob("#{DST_DIR}/.tmp.*"))
  t1 = Time.now
  # vanished folders
  vanishes = []
  glob("#{DST_DIR}/*/**/.status").each do |file|
    checkInterruption(__LINE__, 0.001)
    name = File.dirname(file).sub(/^#{DST_DIR}\//, '')
    if not File.exists?("#{SRC_DIR}/#{name}")
      $log.info("deleted " + name)
      vanishes.push(name)
    end
  end
  t2 = Time.now
  # added/updated folders
  updates = $changes.dup
  updates.each do |name|
    $mutex_p.synchronize do
      updateLoadingStatus("#{DST_DIR}/#{name}/", true);
    end
  end
  rsync() unless REMOTE_SERVER.nil?
  updates.each do |name|
    checkInterruption(__LINE__, 0.001)
    src = "#{SRC_DIR}/#{name}"
    dst = "#{DST_DIR}/#{name}"
    next unless File.exists?(src)
    next if File.file?(src) and not (src =~ /\.swf$/)
    begin
      $log.info("updated " + name)
      dst = "#{DST_DIR}/.tmp.#{name}"
      if File.file?(src)
        if /\.swf$/ =~ src
          t = Time.now
          FileUtils.mkdir_p(dst)
          FileUtils.cp(src, dst)
          #FileUtils.ln(src, dst)
          $log.info("copied #{src} to #{dst} #{Time.now - t}")
        end
      else
        t = Time.now
        FileUtils.mkdir_p(dst)
        cp_r(src, dst)
        $log.info("copied #{src} to #{dst} #{Time.now - t}")
      end
    end
  end
  t3 = Time.now
  $log.info("sync finished #{t3 - t0} #{t3 - t2} #{t2 - t1} #{t1 - t0}")
  {:vanishes => vanishes, :updates => updates}
end

def diff(src, dst)
  if File.file?(src) and /.swf$/ =~ src
    src_file = src
    dst_file = "#{dst}/#{File.basename(src)}"
    return true unless sameFile?(src_file, dst_file)
  else
    glob(["#{src}/*.swf",
          "#{src}/*.fla",
          "#{src}/*.json",
          "#{src}/*.lwfconf",
          "#{src}/swf2lwf.conf",
          "#{src}/index.html",
          "#{src}/**/*.xml",
          "#{src}/**/*.js"]).each do |src_file|
      file = src_file.sub(/#{src}\//, '')
      next if file =~ EXCLUDE_PATTERN
      dst_file = "#{dst}/#{file}"
      return true unless File.exists?(dst_file)
    end
    glob(["#{dst}/*.swf",
          "#{dst}/*.fla",
          "#{dst}/*.json",
          "#{dst}/*.lwfconf",
          "#{dst}/swf2lwf.conf",
          "#{dst}/index.html",
          "#{dst}/**/*.xml",
          "#{dst}/**/*.js"]).each do |dst_file|
      file = dst_file.sub(/#{dst}\//, '')
      next if file =~ EXCLUDE_PATTERN
      src_file = "#{src}/#{file}"
      return true unless File.exists?(src_file)
      return true unless sameFile?(src_file, dst_file)
    end
    glob(["#{src}/**/*.png",
          "#{src}/**/*.jpg",
          "#{src}/**/*.jpeg"]).each do |src_file|
      file = src_file.sub(/#{src}\//, '')
      next if file =~ EXCLUDE_PATTERN
      dst_file = "#{dst}/#{file}"
      return true unless File.exists?(dst_file)
    end
    glob(["#{dst}/**/*.png",
          "#{dst}/**/*.jpg",
          "#{dst}/**/*.jpeg"]).each do |dst_file|
      file = dst_file.sub(/#{dst}\//, '')
      next if file =~ EXCLUDE_PATTERN
      src_file = "#{src}/#{file}"
      return true unless File.exists?(src_file)
      return true unless sameFile?(src_file, dst_file)
    end
  end
  false
end

def convert(changes)
  # convert added or updated folders
  update_time = Time.now.to_f
  changes[:updates].each do |name|
    folder = "#{DST_DIR}/.tmp.#{name}"
    next unless File.exists?(folder)  # vanished folders
    $log.info("converting #{name}...")
    if File.file?("#{folder}/index.html")
      outputRaw(update_time, folder)
    else
      swfs = glob("#{folder}/*.swf")
      prefix = ''
      if swfs.count == 0
        outputNG(update_time, folder, name, prefix, '', 'found no swf.', '')
      else
        swf = swfs[0]
        swfs.each do |path|
          if name == File.basename(path)
            swf = path
          elsif name == File.basename(path, '.swf')
            swf = path
          end
        end
        prefix = File.basename(swf, '.swf')
        ret = swf2res(swf)
        ret['args'].each do |s|
          s.sub!(/.*\.(swf|fla|json)$/, File.basename(s))
          s.sub!(/.*\/swf2lwf.conf$/, 'swf2lwf.conf')
        end
        commandline = "swf2lwf#{(ret['args'].length > 0) ? ' ' : ''}#{ret['args'].join(' ')}"
        if not ret['is_error']
          outputOK(update_time, folder, name, prefix, commandline, getWarnings(folder, name, prefix))
        else
          # ret['message'] contains warnings.
          outputNG(update_time, folder, name, prefix, commandline, ret['message'], '')
        end
      end
    end
    checkInterruption(__LINE__, 0.001)
  end
end

def getWarnings(folder, name, prefix)
  warnings = ''
  if File.file?("#{folder}/#{prefix}.lwfdata/#{prefix}.txt")
    count = 0
    File.foreach("#{folder}/#{prefix}.lwfdata/#{prefix}.txt") do |line|
      if count > 0
        warnings += line
      end
      count += 1
    end
  end
  warnings
end

def outputRaw(update_time, folder)
  ['webkitcss', 'canvas'].each do |target|
    next unless TARGETS.include?(target)
    content = <<-"EOF"
<html>
  <head>
    <meta http-equiv="refresh" content="0; URL=index.html?renderer=#{target}">
  </head>
  <body>
  </body>
</html>
    EOF
#    $mutex_p.synchronize do
      File.open("#{folder}/index-#{target}.html", 'w') do |fp|
        fp.write(content)
      end
#    end
  end
#  $mutex_p.synchronize do
    File.open("#{folder}/.status", 'w') do |fp|
      fp.write('as-is')
    end
    updateLoadingStatus("#{folder}/", false, update_time);
#  end
end

def outputOK(update_time, folder, name, prefix, commandline, warnings)
  relative = '../' * (name.split('/').count + 1)
  if warnings != ''
    content = <<-"EOF"
<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <title>WARNINGS: #{name}</title>
    <link rel="shortcut icon" href="#{relative}img/favicon-yellow.png" />
    <link rel="icon" href="#{relative}img/favicon-yellow.png" />
    <link rel="stylesheet" href="#{relative}css/common.css" />
    <link rel="stylesheet" href="#{relative}css/viewer.css" />
  </head>
  <body>
    <div id="wrapper">
      <div id="header">
        <h1>WARNINGS: #{name}</h1>
        <div class="info">(#{commandline})</div>
        <div class="info">#{warnings.gsub(/\n/, '<br/>')}</div>
      </div>
    </div>
    <script type="text/javascript" src="#{relative}js/loading.js" interval="1" update_time="#{update_time}"></script>
  </body>
</html>
    EOF
#    $mutex_p.synchronize do
      File.open("#{folder}/index-warn.html", 'w') do |fp|
        fp.write(content)
      end
#    end
  end
  if commandline =~ / -p / or warnings != ''
    status = (commandline =~ / -p /) ? 'OK??' : 'OK?'
    favicon = 'favicon-yellow.png'
  else
    status = 'OK'
    favicon = 'favicon-blue.png'
  end
  screensize = {:w => 0, :h => 0}
  if SCREEN_SIZE =~ /(\d+)x(\d+)/
    screensize[:w] = $1.to_i
    screensize[:h] = $2.to_i
  end
  rootoffset = {:x => 0, :y => 0}
  if File.file?("#{folder}/#{prefix}.lwfconf")
    begin
      lwfconf = JSON.parse(File.read("#{folder}/#{prefix}.lwfconf"))
      x = y = 0
      if not lwfconf["init"].empty?
        lwfconf["init"].each do |cmd|
          if cmd.length == 4 and cmd[0] == '_root' and cmd[1] == 'moveTo'
            x = cmd[2]
            y = cmd[3]
          end
        end
      end
      rootoffset[:x] = x
      rootoffset[:y] = y
    rescue
    end
  end
  userscripts = ''
  glob("#{folder}/*.js").each do |js|
    userscripts += "    <script type=\"text/javascript\" charset=\"UTF-8\" src=\"#{File.basename(js)}\"></script>\n"
  end
  if userscripts == ''
    userscripts = "    <script type=\"text/javascript\">/* no user script is found */</script>\n"
  end
  ['webkitcss', 'canvas', 'webgl'].each do |target|
    next unless TARGETS.include?(target)
    case target
    when 'webgl'
      lwfjs = 'lwf_webgl.js'
    else
      lwfjs = 'lwf.js'
    end
    ['release', 'debug', 'birdwatcher'].each do |rel|
      birdwatcher = ''
      if rel == 'birdwatcher'
        birdwatcher = <<-"EOF"
    <script type="text/javascript" src="#{relative}js/birdwatcher.js"></script>
    <script type="text/javascript">
      window["testlwf_birdwatcher"] = {};
      window["testlwf_birdwatcher"].reportId = '#{MY_ID}_#{target.upcase}_#{name.gsub(/\s/, '_')}';
      window["testlwf_birdwatcher"].reportUrl = 'http://#{BIRD_WATCHER_SERVER}/';
    </script>
        EOF
      end
      if birdwatcher == ''
        birdwatcher = "    <script type=\"text/javascript\">/* birdwatcher is disabled */</script>\n"
      end
      content = <<-"EOF"
<!DOCTYPE HTML>
<html>
  <head>
    <meta name="apple-mobile-web-app-capable" content="yes" />
    <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
    <meta name="viewport" content="width=device-width,initial-scale=1.0,user-scalable=no" />
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
    <title>#{target.upcase}: #{name}</title>
    <link rel="shortcut icon" href="#{relative}img/#{favicon}" />
    <link rel="icon" href="#{relative}img/#{favicon}" />
    <link rel="stylesheet" href="#{relative}css/common.css" />
    <link rel="stylesheet" href="#{relative}css/viewer.css" />
    <script type="text/javascript" src="#{relative}js/ajax.js"></script>
    <script type="text/javascript" src="#{relative}js/qrcode.js"></script>
    <script type="text/javascript" src="#{relative}#{(rel == 'release') ? 'js' : 'js_debug'}/#{lwfjs}"></script>
    <script type="text/javascript" src="#{relative}js/test-html5.js"></script>
    <script type="text/javascript">
      window["testlwf_name"] = "#{name}";
      window["testlwf_html5target"] = "#{target}";
      window["testlwf_commandline"] = "#{commandline}";
      window["testlwf_warn"] = #{warnings != ''};
      window["testlwf_lwf"] = "_/#{prefix}.lwf";
      window["testlwf_lwfjs"] = "#{lwfjs}";
      window["testlwf_config"] = {
          "fr": #{FRAME_RATE},
          "fs": #{FRAME_STEP},
          "ds": #{DISPLAY_SCALE},
          "ss": {
              "w": #{screensize[:w]},
              "h": #{screensize[:h]}
          },
          "rootoffset": {
              "x": #{rootoffset[:x]},
              "y": #{rootoffset[:y]}
          }
      };
    </script>
#{userscripts.chomp}
#{birdwatcher.chomp}
  </head>
  <body>
    <script type="text/javascript" src="#{relative}js/loading.js" interval="1" update_time="#{update_time}"></script>
  </body>
</html>
      EOF
#      $mutex_p.synchronize do
        File.open("#{folder}/index-#{target}#{(rel == 'release') ? '' : '-' + rel}.html", 'w') do |fp|
          fp.write(content)
        end
#      end
    end
  end
#  $mutex_p.synchronize do
    File.open("#{folder}/.status", 'w') do |fp|
      fp.write(status)
    end
    updateLoadingStatus("#{folder}/", false, update_time);
#  end
end

def outputNG(update_time, folder, name, prefix, commandline, msg, warnings)
  relative = '../' * (name.split('/').count + 1)
  content = <<-"EOF"
<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <title>ERROR: #{name}</title>
    <link rel="shortcut icon" href="#{relative}img/favicon-red.png" />
    <link rel="icon" href="#{relative}img/favicon-red.png" />
    <link rel="stylesheet" href="#{relative}css/common.css" />
    <link rel="stylesheet" href="#{relative}css/viewer.css" />
    <script type="text/javascript" src="#{relative}js/ajax.js"></script>
  </head>
  <body>
    <div id="wrapper">
      <div id="header">
        <h1>ERROR: #{name}<span id="loading_icon"></span></h1>
        <div class="info"><a href="javascript:void(0)" onClick="Ajax.post('http://localhost:10080/update/', {'arg': '#{name}'}); return false;">force to update</a></div>
        <div class="info">(#{commandline})</div>
        <div class="info">#{msg.gsub(/\n/, '<br/>')}</div>
  EOF
  if warnings != ''
    content += <<-"EOF"
        <h1>WARNINGS: #{name}</h1>
        <div class="info">#{warnings.gsub(/\n/, '<br/>')}</div>
    EOF
  end
  content += <<-"EOF"
      </div>
    </div>
    <script type="text/javascript" src="#{relative}js/loading.js" interval="1" update_time="#{update_time}"></script>
  </body>
</html>
  EOF
#  $mutex_p.synchronize do
    File.open("#{folder}/index-err.html", 'w') do |fp|
      fp.write(content)
    end
#  end
#  $mutex_p.synchronize do
    File.open("#{folder}/.status", 'w') do |fp|
      fp.write('NG')
    end
    updateLoadingStatus("#{folder}/", false, update_time);
#  end
end

def updateFolders(changes)
  changes[:vanishes].each do |name|
    folder = "#{DST_DIR}/#{name}"
    FileUtils.rm_rf(folder)
  end
  changes[:updates].each do |name|
    src = "#{DST_DIR}/.tmp.#{name}"
    next unless File.exists?(src)  # vanished folders
    dst = "#{DST_DIR}/#{name}"
    FileUtils.rm_rf(dst)
    FileUtils.mkdir_p(File.dirname(dst))
    FileUtils.mv(src, dst)
    rmdir_p(File.dirname(src))
    if not OUT_DIR.nil?
      if File.read("#{DST_DIR}/#{name}/.status") =~ /OK/
        # html5
        FileUtils.rm_rf("#{OUT_DIR}/html5/list/#{name}")
        rmdir_p("#{OUT_DIR}/html5/list/#{name}")
        FileUtils.mkdir_p("#{OUT_DIR}/html5/list/#{name}")
        FileUtils.cp_r("#{DST_DIR}/#{name}/_", "#{OUT_DIR}/html5/list/#{name}/_")
        glob("#{DST_DIR}/#{name}/index-*.html").each do |f|
          FileUtils.cp_r(f, "#{OUT_DIR}/html5/list/#{name}") unless f =~ /(cocos2d|unity)/i
        end
        glob("#{DST_DIR}/#{name}/*.js").each do |f|
          FileUtils.cp_r(f, "#{OUT_DIR}/html5/list/#{name}") unless f =~ /(cocos2d|unity)/i
        end
        # unity
        FileUtils.rm_rf("#{OUT_DIR}/unity/#{name}")
        rmdir_p("#{OUT_DIR}/unity/#{name}")
        FileUtils.mkdir_p(File.dirname("#{OUT_DIR}/unity/#{name}"))
        FileUtils.cp_r("#{DST_DIR}/#{name}/_", "#{OUT_DIR}/unity/#{name}")
        glob("#{OUT_DIR}/unity/#{name}/*.lwf").each do |f|
          FileUtils.mv(f, f.sub(/\.lwf$/, '.bytes'))
        end
        FileUtils.rm_rf(glob("#{OUT_DIR}/unity/#{name}/*.js"))
        # native
        FileUtils.rm_rf("#{OUT_DIR}/native/#{name}")
        rmdir_p("#{OUT_DIR}/native/#{name}")
        FileUtils.mkdir_p(File.dirname("#{OUT_DIR}/native/#{name}"))
        FileUtils.cp_r("#{DST_DIR}/#{name}/_", "#{OUT_DIR}/native/#{name}")
        FileUtils.rm_rf(glob("#{OUT_DIR}/native/#{name}/*.js"))
      end
    end
  end
end

def rsync(is_top_only = false)
  if is_top_only
    `rsync -rtz --delete --no-p --no-g --chmod=ugo=rX --exclude "#{BASE_DIR}/list/*" #{BASE_DIR}/ rsync://#{REMOTE_SERVER}/lwfs/#{MY_ID}`
  else
    `rsync -rtz --delete --no-p --no-g --chmod=ugo=rX --exclude list/index.html --exclude list/.loading #{BASE_DIR}/ rsync://#{REMOTE_SERVER}/lwfs/#{MY_ID}`
  end
  `rsync -rtz --delete --no-p --no-g --chmod=ugo=rX #{DST_DIR}/index.html #{DST_DIR}/.loading rsync://#{REMOTE_SERVER}/lwfs/#{MY_ID}/list`
end

def updateLoadingStatus(dir, is_in_conversion, update_time = nil)
  if File.exists?(dir)
    File.open("#{dir}/.loading", 'w') do |fp|
      if update_time.nil?
        fp.write("{\"is_in_conversion\":#{is_in_conversion}}")
      else
        fp.write("{\"is_in_conversion\":#{is_in_conversion},\"update_time\":#{update_time}}")
      end
    end
  end
end

def updateTopIndex(update_time, is_start = false)
  names = []
  if not is_start
    glob("#{DST_DIR}/*/**/.status").each do |entry|
      prefix = "#{DST_DIR}/"
      name = File.dirname(entry.slice(prefix.length, entry.length - prefix.length))
      names.push(name)
    end
    names.sort!()
  end
  updated_message = Time.now.strftime('%F %T')
  if not is_start and $updated_jsfls.length > 0
    updated_message += ', also updated ' + $updated_jsfls.map{|item| "<u>#{item}</u>"}.join(' and ')
    $updated_jsfls = []
  end
  content = <<-"EOF"
<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <title>lwfs</title>
    <link rel="shortcut icon" href="../img/favicon.png" />
    <link rel="icon" href="../img/favicon.png" />
    <link rel="stylesheet" href="../css/common.css" />
    <link rel="stylesheet" href="../css/datatable.css" />
    <script type="text/javascript" src="../js/jquery.min.js"></script>
    <script type="text/javascript" src="../js/jquery.dataTables.min.js"></script>
    <script type="text/javascript" src="../js/ajax.js"></script>
    <script type="text/javascript" src="../js/qrcode.js"></script>
    <script type="text/javascript" src="../js/top-index.js"></script>
  </head>
  <body>
    <div id="wrapper">
      <div id="header">
        <div id="lpart">
          <h1>lwfs<span id="loading_icon"></span></h1>
          <p>(version: #{VERSION})</p>
          <p><a href="javascript:void(0)" onClick=\"Ajax.post('http://localhost:10080/update/'); return false;\">force to update all</a></p>
        </div>
        <div id="rpart">
          <span id="qr"></span>
        </div>
        <div id="clear">
        </div>
      </div>
      <p>(updated: #{updated_message})</p>
      <table cellpadding="0" cellspacing="0" border="0" class="dataTable" id="sorter">
  EOF
  content += '        <thead>'
  content += '          <tr><th>name</th><th></th>'
  ['webkitcss', 'canvas', 'webgl'].each do |target|
    next unless TARGETS.include?(target)
    content += "<th>#{target}</th>"
  end
  content += "<th>status</th><th>last modified</th></tr>\n"
  content += '        </thead>'
  content += '        <tbody>'
  names.each do |name|
    status = File.read("#{DST_DIR}/#{name}/.status")
    prefix = ''
    date = lastModified("#{DST_DIR}/#{name}")
    date = date.strftime('%F %T')
    content += "          <tr><td><a href=\"javascript:void(0)\" onClick=\"Ajax.get('http://localhost:10080/locate/#{name}'); return false;\">#{name}</a></td><td class=\"center\"><a href=\"javascript:void(0)\" onClick=\"Ajax.post('http://localhost:10080/update/', {'arg': '#{name}'}); return false;\">u</a></td>"
    if status != 'NG'
      ['webkitcss', 'canvas', 'webgl'].each do |target|
        next unless TARGETS.include?(target)
        if File.file?("#{DST_DIR}/#{name}/index-#{target}.html")
          content += "<td class=\"center\"><a href=\"#{name}/index-#{target}.html\" target=\"_blank\">#{target}</a></td>"
        else
          content += "<td class=\"center\">-</td>"
        end
      end
      content += "<td class=\"center\">#{status}</td>"
    else
      ['webkitcss', 'canvas', 'webgl'].each do |target|
        next unless TARGETS.include?(target)
        content += "<td class=\"center\">-</td>"
      end
      content += "<td class=\"center\"><a href=\"#{name}/index-err.html\" target=\"_blank\">#{status}</a></td>"
    end
    content += "<td class=\"center\">#{date}</td></tr>\n"
  end
  content += '        </tbody>'
  modified = Time.now
  content += <<-"EOF"
      </table>
    </div>
    <script type="text/javascript" src="../js/loading.js" interval="1" update_time="#{update_time}"></script>
    <script type="text/javascript">
      $(document).ready(function() {
          $('#sorter').dataTable({
              "bStateSave": true,
              "iDisplayLength": 50,
              "sCookiePrefix": "lwfs_database_#{TARGETS.length + 3}",
              "aaSorting": [[#{TARGETS.length + 3}, 'desc'],[0, 'asc']]
          });
      });
    </script>
  </body>
</html>
  EOF
  $mutex_p.synchronize do
    File.open("#{DST_DIR}/index.html", 'w') do |fp|
      fp.write(content)
    end
    updateLoadingStatus("#{DST_DIR}/", is_start, update_time)
  end
end

def lastModified(folder)
  tmax = Time.at(0)
  Find.find(folder) do |file|
    next if File.directory?(file)
    t = File.mtime(file)
    tmax = t if t > tmax
  end
  tmax
end
