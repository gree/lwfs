#!/usr/bin/env ruby -Ku
# -*- coding: utf-8 -*-
$:.unshift File.dirname(__FILE__)

require 'rbconfig'
require 'rubygems'
if RUBY_PLATFORM == /java/
  require 'listen'
end
require 'fileutils'
require 'set'
require 'socket'
require 'tmpdir'
require 'uuidtools'
require 'webrick'
require 'lib/postupdate.rb'
require 'lib/swf2lwf/lib/json.rb'
require 'lib/swf2res.rb'

def sameFile?(f0, f1)
  return false unless (File.file?(f0) and File.file?(f1))
  f0_s = File.stat(f0)
  f1_s = File.stat(f1)
  # cp_r with :preserve => true seems too expensive on windows. we
  # omit it now and thus mtime will change.
  return false if (f0_s.mtime > f1_s.mtime || f0_s.size != f1_s.size)
  FileUtils.cmp(f0, f1)
end

def needUpdate?(src, dst)
  return false unless File.file?(src)
  return true unless File.file?(dst)
  src_s = File.stat(src)
  dst_s = File.stat(dst)
  src_s.mtime > dst_s.mtime and not FileUtils.cmp(src, dst)
end

$updated_jsfls = []

def updateJSFL(folders)
  src_file = 'lib/LWF_Publish.jsfl'
  folders.each do |folder|
    dst_file = folder + '/LWF_Publish.jsfl'
    if needUpdate?(src_file, dst_file)
      FileUtils.cp('lib/LWF_Publish.jsfl', folder, {:preserve => true})
      $updated_jsfls.push(dst_file)
    end
  end
end

# configuration
if File.file?('lib/LWFS_VERSION')
  VERSION = File.read('lib/LWFS_VERSION').chomp
else
  VERSION = 'development'
end
REMOTE_SERVER = ENV['LWFS_REMOTE_SERVER']
BIRD_WATCHER_SERVER = ENV['LWFS_BIRD_WATCHER_SERVER']
if ENV['LWFS_TARGETS'].nil?
  TARGETS = ['webkitcss', 'canvas', 'webgl']
else
  TARGETS = ENV['LWFS_TARGETS'].split(/,/)
end
if RbConfig::CONFIG['host_os'].downcase =~ /darwin/
  prefix = ENV['HOME']
  updateJSFL(Dir.glob(prefix + '/Library/Application Support/Adobe/Flash CS*/*/Configuration/Commands'))
  SRC_DIR = prefix + '/Desktop/LWFS_work'
  if ENV['LWFS_USE_OUTPUT_FOLDER'] == '1'
    OUT_DIR = prefix + '/Desktop/LWFS_work_output'
  else
    OUT_DIR = nil
  end
  OPEN_COMMAND = 'open'
  WATCH_SCRIPT = 'lib/watch-osx.rb'
  LOG_FILE = '/dev/null'
elsif RbConfig::CONFIG['host_os'].downcase =~ /mswin(?!ce)|mingw|cygwin|bccwin/
  prefix = ENV['USERPROFILE'].gsub(/\\/, '/')
  updateJSFL(Dir.glob([prefix + '/AppData/Local/Adobe/Flash CS*/*/Configuration/Commands',
                       prefix + '/Local Settings/Application Data/Adobe/Flash CS*/*/Configuration/Commands']))
  SRC_DIR = prefix + '/Desktop/LWFS_work'
  if ENV['LWFS_USE_OUTPUT_FOLDER'] == '1'
    OUT_DIR = prefix + '/Desktop/LWFS_work_output'
  else
    OUT_DIR = nil
  end
  OPEN_COMMAND = 'start'
  WATCH_SCRIPT = 'lib/watch-win.rb'
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
  WATCH_SCRIPT = 'lib/watch-linux.rb'
  LOG_FILE = '/dev/null'
else
  abort('this platform is not supported.')
end
MY_ID = UUIDTools::UUID.sha1_create(UUIDTools::UUID_DNS_NAMESPACE, Socket.gethostname).to_s
BASE_DIR = "htdocs/lwfs/#{MY_ID}"
DST_DIR = "#{BASE_DIR}/list"

if not File.directory?(SRC_DIR)
  FileUtils.mkdir_p(SRC_DIR)
end
if OUT_DIR.nil?
  Dir.glob('htdocs/lwfs/*') do |d|
    FileUtils.rm_rf(d) if d != BASE_DIR
  end
else
  FileUtils.rm_rf(Dir.glob('htdocs/lwfs/*'))  # clear everything so that we can update OUT_DIR adequately.
  FileUtils.mkdir_p(OUT_DIR) unless File.directory?(OUT_DIR)
  FileUtils.mkdir_p("#{OUT_DIR}/for-html5") unless File.directory?("#{OUT_DIR}/for-html5")
  FileUtils.mkdir_p("#{OUT_DIR}/for-unity") unless File.directory?("#{OUT_DIR}/for-unity")
end
FileUtils.cp_r('tmpl', BASE_DIR) unless File.directory?(BASE_DIR)

$mutex_p = Mutex.new

class UpdateServlet < WEBrick::HTTPServlet::AbstractServlet
  @@mutex_i = Mutex.new
  @@is_in_post = false
  @@is_interrupted = false

  def initialize(*args)
    super(*args)
  end

  def do_POST(req, res)
    res.status = 200
    res.body = 'OK'
    if req.path == '/update/start'
      updateTopStatus(true);
      updateTopIndex(true)
      if not REMOTE_SERVER.nil?
        3.times do |i|  # retry three times
          `rsync -az --exclude='list/*/' --delete --chmod=ugo=rX #{BASE_DIR} rsync://#{REMOTE_SERVER}/lwfs`
          break if $? == 0
          sleep(1.0)
        end
        sleep(1.0)
        `#{OPEN_COMMAND} http://#{REMOTE_SERVER}/lwfs/#{MY_ID}/list/`
      else
        `#{OPEN_COMMAND} http://#{Socket.gethostname}:10080/lwfs/#{MY_ID}/list/`
      end
      return
    end
    @@mutex_i.synchronize do
      if @@is_in_post
        @@is_interrupted = true
        return
      end
      @@is_in_post = true
    end
    t0 = t1 = t2 = t3 = t4 = t5 = t6 = t7 = t8 = Time.now
    is_in_progress = true
    updateTopStatus(true);
    if not REMOTE_SERVER.nil?
      3.times do |i|  # retry three times
        `rsync -az --exclude='list/*/' --delete --chmod=ugo=rX #{BASE_DIR} rsync://#{REMOTE_SERVER}/lwfs`
        break if $? == 0
        sleep(1.0)
      end
    end
    Thread.new do
      while is_in_progress
        catch :restart do
          t1 = Time.now
          checkInterruption(__LINE__, 1.0)
          t2 = Time.now
          begin
            sync()
          rescue => e
            p e
            p e.backtrace
            p "restart at #{__LINE__}"
            throw :restart
          end
          t3 = Time.now
          checkInterruption(__LINE__, 0.001)
          t4 = Time.now
          begin
            convert()
          rescue => e
            p e
            p e.backtrace
            p "restart at #{__LINE__}"
            throw :restart
          end
          t5 = Time.now
          checkInterruption(__LINE__, 0.001)
          t6 = Time.now
          $mutex_p.synchronize do
            begin
              updateFolders()
              updateTopIndex()
            rescue => e
              p e
              p e.backtrace
            end
          end
          t7 = Time.now
          @@mutex_i.synchronize do
            if @@is_interrupted
              @@is_interrupted = false
              p "restart at #{__LINE__}"
              throw :restart
            end
            is_in_progress = false
            updateTopStatus(false);
            if not REMOTE_SERVER.nil?
              3.times do |i|  # retry three times
                `rsync -az --delete --chmod=ugo=rX #{BASE_DIR} rsync://#{REMOTE_SERVER}/lwfs`
                break if $? == 0
                sleep(1.0)
              end
            end
            @@is_in_post = false
          end
          t8 = Time.now
        end
        if not is_in_progress
          p "thread finished #{t8 - t0} #{t8 - t1} i #{t2 - t1} s #{t3 - t2} i #{t4 - t3} c #{t5 - t4} i #{t6 - t5} u #{t7 - t6} i #{t8 - t7}"
        end
      end
    end
  end

  def checkInterruption(line, wait)
    sleep(wait)
    @@mutex_i.synchronize do
      if @@is_interrupted
        @@is_interrupted = false
        p "restart at #{line}"
        throw :restart
      end
    end
  end

  def cp_r(src, dst)
    # FileUtils.cp_r(src, dst)
    Dir.glob("#{src}/*").each do |f|
      checkInterruption(__LINE__, 0.001)
      if File.file?(f)
        FileUtils.cp(f, dst)
      elsif File.directory?(f)
        sub = dst + '/' + File.basename(f)
        FileUtils.mkdir(sub)
        cp_r(f, sub)
      end
    end
  end

  def sync()
    t0 = Time.now
    # always start over
    FileUtils.rm_rf(Dir.glob("#{DST_DIR}/.tmp.*"))
    t1 = Time.now
    # remove vanished folders
    Dir.glob("#{DST_DIR}/*").each do |file|
      checkInterruption(__LINE__, 0.001)
      if File.directory?(file)
        name = File.basename(file)
        if not File.exists?("#{SRC_DIR}/#{name}")
          p "deleted " + name
          # generate empty tmp indicating the vanished folder
          dst = "#{DST_DIR}/.tmp.#{name}"
          FileUtils.rm_rf(dst)
          FileUtils.mkdir(dst)
        end
      end
    end
    t2 = Time.now
    # added/updated folders
    Dir.glob("#{SRC_DIR}/*").each do |file|
      next if File.file?(file) and not (/\.swf$/ =~ file)
      name = File.basename(file)
      src = "#{SRC_DIR}/#{name}"
      dst = "#{DST_DIR}/#{name}"
      checkInterruption(__LINE__, 0.001)
      if not File.exists?(dst) or diff(src, dst)
        p "updated " + name
        dst = "#{DST_DIR}/.tmp.#{name}"
        if File.file?(src) and /\.swf$/ =~ src
          t = Time.now
          FileUtils.mkdir(dst)
          FileUtils.cp(src, dst)
          p "copied #{src} to #{dst} #{Time.now - t}"
        else
          t = Time.now
          FileUtils.mkdir(dst)
          cp_r(src, dst)
          p "copied #{src} to #{dst} #{Time.now - t}"
        end
      end
    end
    t3 = Time.now
    p "sync finished #{t3 - t0} #{t3 - t2} #{t2 - t1} #{t1 - t0}"
  end

  def diff(src, dst)
    if File.file?(src) and /.swf$/ =~ src
      src_file = src
      dst_file = "#{dst}/#{File.basename(src)}"
      return true unless sameFile?(src_file, dst_file)
    else
      excludes = /#{dst}\/(_|[^\/]+\.lwfdata)\/.*$/  # excludes folders generated by swf2lwf/swf2arc
      Dir.glob(["#{src}/*.swf",
                "#{src}/*.fla",
                "#{src}/*.json",
                "#{src}/*.lwfconf",
                "#{src}/swf2lwf.conf",
                "#{src}/index.html",
                "#{src}/**/*.xml",
                "#{src}/**/*.js"]).each do |src_file|
        file = src_file.sub(/#{src}\//, '')
        dst_file = "#{dst}/#{file}"
        return true unless File.exists?(dst_file)
      end
      Dir.glob(["#{dst}/*.swf",
                "#{dst}/*.fla",
                "#{dst}/*.json",
                "#{dst}/*.lwfconf",
                "#{dst}/swf2lwf.conf",
                "#{dst}/index.html",
                "#{dst}/**/*.xml",
                "#{dst}/**/*.js"]).each do |dst_file|
        next if excludes =~ dst_file
        file = dst_file.sub(/#{dst}\//, '')
        src_file = "#{src}/#{file}"
        return true unless File.exists?(src_file)
        return true unless sameFile?(src_file, dst_file)
      end
      Dir.glob(["#{src}/**/*.png",
                "#{src}/**/*.jpg",
                "#{src}/**/*.jpeg"]).each do |src_file|
        file = src_file.sub(/#{src}\//, '')
        dst_file = "#{dst}/#{file}"
        return true unless File.exists?(dst_file)
      end
      Dir.glob(["#{dst}/**/*.png",
                "#{dst}/**/*.jpg",
                "#{dst}/**/*.jpeg"]).each do |dst_file|
        next if excludes =~ dst_file
        file = dst_file.sub(/#{dst}\//, '')
        src_file = "#{src}/#{file}"
        return true unless File.exists?(src_file)
        return true unless sameFile?(src_file, dst_file)
      end
    end
    false
  end

  def convert()
    # convert added or updated folders
    Dir.glob("#{DST_DIR}/.tmp.*").each do |folder|
      next if Dir.glob("#{folder}/*").count == 0  # vanished folders
      name = File.basename(folder)[5, 4096]
      p "converting #{name}..."
      if File.file?("#{folder}/index.html")
        outputRaw(folder)
      else
        swfs = Dir.glob("#{folder}/*.swf")
        prefix = ''
        if swfs.count == 0
          outputNG(folder, name, prefix, [], 'found no swf.')
        else
          swf = swfs[0]
          prefix = File.basename(swfs[0], '.swf')
          ret = swf2res(swf)
          ret['args'].each do |s|
            s.sub!(/.*\.(swf|fla|json)$/, File.basename(s))
            s.sub!(/.*\/swf2lwf.conf$/, 'swf2lwf.conf')
          end
          if not ret['is_error']
            outputOK(folder, name, prefix, ret['args'])
          else
            outputNG(folder, name, prefix, ret['args'], ret['message'])
          end
        end
      end
      checkInterruption(__LINE__, 0.001)
    end
  end

  def outputRaw(folder)
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
      File.open("#{folder}/index-#{target}.html", 'w') do |fp|
        fp.write(content)
      end
    end
    File.open("#{folder}/.status", 'w') do |fp|
      fp.write('as-is')
    end
  end

  def outputOK(folder, name, prefix, args)
    if args.include?('-p')
      status = '(OK)'
      favicon = 'favicon-yellow.png'
    else
      status = 'OK'
      favicon = 'favicon-blue.png'
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
    Dir.glob("#{folder}/*.js").each do |js|
      userscripts += "    <script type=\"text/javascript\" charset=\"UTF-8\" src=\"#{File.basename(js)}\"></script>\n"
    end
    if userscripts == ''
      userscripts = "    <script type=\"text/javascript\">/* no user script is found */</script>\n"
    end
    userscripts.chomp!
    ['webkitcss', 'canvas', 'webgl'].each do |target|
      next unless TARGETS.include?(target)
      case target
      when 'webgl'
        lwfjs = 'lwf_webgl.js'
      else
        lwfjs = 'lwf.js'
      end
      ['release', 'debug', 'birdwatcher'].each do |rel|
        birdwatcher = '';
        if rel == 'birdwatcher'
          birdwatcher = <<-"EOF"
    <script type="text/javascript" src="../../js/birdwatcher.js"></script>
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
    <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8" />
    <title>#{target.upcase}: #{name}</title>
    <link rel="shortcut icon" href="../../img/#{favicon}" />
    <link rel="icon" href="../../img/#{favicon}" />
    <link rel="stylesheet" href="../../css/common.css" />
    <link rel="stylesheet" href="../../css/viewer.css" />
    <script type="text/javascript" src="../../js/qrcode.js"></script>
    <script type="text/javascript" src="../../#{(rel == 'release') ? 'js' : 'js_debug'}/#{lwfjs}"></script>
    <script type="text/javascript" src="../../js/test-html5.js"></script>
    <script type="text/javascript">
      window["testlwf_html5target"] = "#{target}";
      window["testlwf_commandline"] = "swf2lwf #{args.join(' ')}";
      window["testlwf_lwf"] = "_/#{prefix}.lwf";
      window["testlwf_lwfjs"] = "#{lwfjs}";
      window["testlwf_rootoffset"] = {
          "x": #{rootoffset[:x]},
          "y": #{rootoffset[:y]},
      }
    </script>
#{userscripts}
#{birdwatcher}
    <script type="text/javascript" src="../../js/auto-reloader.js" interval="1" watch_max_time="0"></script>
  </head>
  <body>
  </body>
</html>
        EOF
        File.open("#{folder}/index-#{target}#{(rel == 'release') ? '' : '-' + rel}.html", 'w') do |fp|
          fp.write(content)
        end
      end
    end
    File.open("#{folder}/.status", 'w') do |fp|
      fp.write(status)
    end
  end

  def outputNG(folder, name, prefix, args, msg)
    content = <<-"EOF"
<!DOCTYPE HTML>
<html>
  <head>
    <meta http-equiv="Content-Type" content="text/html;charset=UTF-8">
    <title>ERROR: #{name}</title>
    <link rel="shortcut icon" href="../../img/favicon-red.png" />
    <link rel="icon" href="../../img/favicon-red.png" />
    <link rel="stylesheet" href="../../css/common.css" />
    <link rel="stylesheet" href="../../css/viewer.css" />
  </head>
  <body>
    <div>
      <span>ERROR: #{name}</span>
    </div>
    <p>swf2lwf #{args.join(' ')}</p>
    <p>#{msg.gsub(/\n/, '<br/>')}</p>
    <script type="text/javascript" src="../../js/auto-reloader.js" interval="1" watch_max_time="0"></script>
  </body>
</html>
    EOF
    File.open("#{folder}/index-err.html", 'w') do |fp|
      fp.write(content)
    end
    File.open("#{folder}/.status", 'w') do |fp|
      fp.write('NG')
    end
  end

  def updateFolders()
    Dir.glob("#{DST_DIR}/.tmp.*").each do |src|
      name = File.basename(src)[5, 4096]
      dst = "#{DST_DIR}/#{name}"
      FileUtils.rm_rf(dst)
      next if Dir.glob("#{src}/*").count == 0  # vanished folders
      FileUtils.mv(src, dst)
      if not OUT_DIR.nil?
        if File.read("#{DST_DIR}/#{name}/.status") =~ /OK/
          # html5
          FileUtils.rm_rf("#{OUT_DIR}/for-html5/#{name}")
          FileUtils.cp_r("#{DST_DIR}/#{name}/_", "#{OUT_DIR}/for-html5/#{name}")
          # unity
          FileUtils.rm_rf("#{OUT_DIR}/for-unity/#{name}")
          FileUtils.cp_r("#{DST_DIR}/#{name}/_", "#{OUT_DIR}/for-unity/#{name}")
          Dir.glob("#{OUT_DIR}/for-unity/#{name}/*.lwf") do |f|
            FileUtils.mv(f, f.sub(/\.lwf$/, '.bytes'))
          end
          FileUtils.rm_rf(Dir.glob("#{OUT_DIR}/for-unity/#{name}/*.js"))
        end
      end
    end
  end

  def updateTopStatus(is_in_conversion)
    File.open("#{DST_DIR}/.status", 'w') do |fp|
      fp.write("{\"is_in_conversion\":#{is_in_conversion}}");
    end
  end

  def updateTopIndex(is_start = false)
    names = []
    if not is_start
      Dir.glob("#{DST_DIR}/*").each do |file|
        if File.directory?(file)
          names.push(File.basename(file))
        end
      end
    end
    File.open("#{DST_DIR}/index.html", 'w') do |fp|
      updated_message = Time.now.strftime('%F %T')
      if not is_start and $updated_jsfls.length > 0
        updated_message += ', <b>NOTE: LWF_Publish.jsfl is also updated</b>'
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
    <link rel="stylesheet" href="../css/sorter.css" />
    <script type="text/javascript" src="../js/status.js" interval="1"></script>
    <script type="text/javascript" src="../js/sorter.js"></script>
    <script type="text/javascript" src="../js/qrcode.js"></script>
    <script type="text/javascript">
      window.onload = function() {
        var qr = qrcode(7, 'L');
        qr.addData(window.location.href);
        qr.make();
        document.getElementById('qr').innerHTML = qr.createImgTag();
      };
    </script>
  </head>
  <body>
    <div id="wrapper">
      <div id="header">
        <div id="lpart">
          <h1>lwfs<img id="loading" src="../img/loading.gif" /></h1>
          <p>(version: #{VERSION})</p>
        </div>
        <div id="rpart">
          <span id="qr"></span>
        </div>
      </div>
      <p>(updated: #{updated_message})</p>
      <table cellpadding="0" cellspacing="0" border="0" class="sortable" id="sorter">
      EOF
      content += '        <tr><th>name</th>'
      ['webkitcss', 'canvas', 'webgl'].each do |target|
        next unless TARGETS.include?(target)
        content += "<th>#{target}</th>"
      end
      content += "<th>status</th><th>last modified</th></tr>\n"
      names.each do |name|
        status = File.read("#{DST_DIR}/#{name}/.status")
        prefix = ''
        date = lastModified("#{DST_DIR}/#{name}")
        date = date.strftime('%F %T')
        content += "        <tr><td>#{name}</td>"
        if status != 'NG'
          ['webkitcss', 'canvas', 'webgl'].each do |target|
            next unless TARGETS.include?(target)
            if File.file?("#{DST_DIR}/#{name}/index-#{target}.html")
              content += "<td><a href=\"#{name}/index-#{target}.html\" target=\"_blank\">#{target}</a></td>"
            else
              content += "<td>-</td>"
            end
          end
          content += "<td>#{status}</td>"
          content += "<td>#{date}</td></tr>\n"
        else
          ['webkitcss', 'canvas', 'webgl'].each do |target|
            next unless TARGETS.include?(target)
            content += "<td>-</td>"
          end
          content += "<td><a href=\"#{name}/index-err.html\" target=\"_blank\">#{status}</a></td>"
          content += "<td>#{date}</td></tr>\n"
        end
      end
      content += <<-"EOF"
      </table>
    </div>
    <script type="text/javascript">
      var sorter = new table.sorter("sorter");
      sorter.init("sorter", #{TARGETS.length + 2}, true);
    </script>
    <script type="text/javascript" src="../js/auto-reloader.js" interval="1" watch_max_time="0"></script>
  </body>
</html>
      EOF
      fp.write(content)
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

end

watcher = 0
mime_types = {
  'js' => 'text/javascript',
  'json' => 'text/javascript'
}
server = WEBrick::HTTPServer.new({
  :DocumentRoot => 'htdocs',
  :BindAddress => '0.0.0.0',
  :Port => 10080,
  :Logger => WEBrick::Log.new(LOG_FILE),
  :AccessLog => [[File.open(LOG_FILE, 'w'), WEBrick::AccessLog::COMBINED_LOG_FORMAT]],
  :MimeTypes => WEBrick::HTTPUtils::DefaultMimeTypes.merge(mime_types),
  :StartCallback => Proc.new {
    Thread.new do 
      sleep(0.1)
      postUpdate('start');
      sleep(1.0)
      postUpdate();
      if RUBY_PLATFORM == /java/
        Listen.to(SRC_DIR, :latency => 0.5) do |modified, added, removed|
          postUpdate();
        end
      else
        watcher = spawn("ruby #{WATCH_SCRIPT} #{SRC_DIR}")
      end
    end
  }
})

server.mount('/update', UpdateServlet)

['INT', 'TERM'].each { |signal|
  Signal.trap(signal) {
    if watcher != 0
      Process.kill(signal, watcher)
    end
    server.shutdown
  }
}

server.start
