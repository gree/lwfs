#!/usr/bin/env ruby
$:.unshift File.dirname(__FILE__)
require 'fileutils'
require 'find'
require 'glob.rb'
require 'swf2lwf/swf2lwf.rb'
require 'lwf2lwfjs/lwf2lwfjs.rb'

def swf2res(swf)
  return {"is_error" => true, "message" => 'The file is not swf.'} unless swf =~ /\.swf$/

  ext_textures = []

  dirname = File.dirname(swf)
  basename = File.basename(swf, ".*")
  prefix = dirname + "/" + basename

  swf2lwf_conf = dirname + "/" + "swf2lwf.conf"
  lwfconf = prefix + ".lwfconf"
  font = dirname + "/font.bytes"
  font_texture = dirname + "/font_texture.png"
  xfl = prefix + "/#{basename}.xfl"
  fla = prefix + ".fla"

  res = dirname + "/_"
  lwf = prefix + ".lwfdata/" + basename + ".lwf"
  js = prefix + ".lwfdata/" + basename + ".js"
  lwfjs = prefix + ".lwfdata/" + basename + ".lwf.js"
  stat = prefix + ".status.txt"
  logfile = prefix + ".lwfdata/" + basename + ".txt"
  FileUtils.rm_rf res
  FileUtils.mkdir res

  args = []
  args.push('-i')  # ignore unknown actionscript command.
  if glob("#{dirname}/**/*.jpg").count + glob("#{dirname}/**/*.png").count == 0
    args.push('-p')
  end
  if File.file?(swf2lwf_conf)
    args.push('-c')
    args.push(swf2lwf_conf)
  end
  if File.file?(xfl)
    args.push('-f')
    args.push(File.dirname(xfl))
  elsif File.file?(fla)
    args.push('-f')
    args.push(fla)
  end
  args.push(swf)
  unless args.include?('-p')
    glob("#{dirname}/*.json").each do |jsn|
      args.push(jsn)
    end
  end
  args0 = args.dup
  begin
    swf2lwf_optparse(args)
    t0 = Time.now
    swf2lwf(*args)
    errors = ''
    File.open(logfile, 'r') do |file|
      file.each do |line|
        errors += line if /^ERROR/ =~ line
      end
    end
    raise errors unless errors.empty?
    lwf2lwfjs(lwf)
    t1 = Time.now
    p t1 - t0
  rescue => exception
    msg = "swf2lwf caused an exception:\n"
    msg += exception.message.to_s + "\n"
    msg += "backtrace:\n" 
    exception.backtrace.each do |s|
      msg += s + "\n"
    end
    return {"is_error" => true, "message" => msg, "args" => args0}
  end

  # File.open(File.dirname(lwf) + "/" + File.basename(lwf, ".*") + ".fonts") { |file|
  #   if file.read.size > 0
  #     return {"is_error" => true, "message" => 'Bitmap font is not supported yet.'}
  #   end
  # }

  [lwfconf, font, font_texture, lwf].each do |file|
    FileUtils.cp(file, res) if File.exists?(file)
  end
  
  textures = {}
  tname = File.dirname(lwf) + "/" + File.basename(lwf, ".*") + ".textures"
  File.read(tname, :encoding => 'UTF-8').split.each do |texture|
    unless texture =~ /(.*)_rgb_[0-9a-f]{6}(.*)/ or
        texture =~ /(.*)_rgb_\d+,\d+,\d+(.*)/ or
        texture =~ /(.*)_rgba_[0-9a-f]{8}(.*)/ or
        texture =~ /(.*)_rgba_\d+,\d+,\d+,\d+(.*)/ or
        texture =~ /(.*)_add_[0-9a-f]{6}(.*)/ or
        texture =~ /(.*)_add_\d+,\d+,\d+(.*)/
      textures[texture] = true
    end
  end
  
  glob("#{File.dirname(swf)}/**/*").each do |file|
    ext_textures.unshift file
  end
  ext_textures.each do |file|
    next unless file =~ /\.(png|jpg)$/
    next if file =~ /\.lwfdata\/xfl/
    name = File.basename(file)
    if textures[name]
      FileUtils.cp(file, res)
      if file =~ /_withalpha\.jpg$/
        alpha_file = file.sub(/_withalpha\.jpg$/, "_alpha.png")
        if File.exists?(alpha_file)
          FileUtils.cp(alpha_file, res)
        else
          textures[name.sub(/_withalpha\.jpg$/, "_alpha.png")] = true  # missing
        end
      end
      textures.delete(name)
      if textures.empty?
        break
      end
    end
  end
  unless textures.empty?
    return {"is_error" => true, "message" => ("Missing files:\n" + textures.keys.join("\n")), "args" => args0}
  end
  if File.file?(js)
    FileUtils.cp(js, res)
  end
  if File.file?(lwfjs)
    FileUtils.cp(lwfjs, res)
  end

  return {"args" => args0}
end

if __FILE__ == $0
  swf = ARGV.shift
  swf2res(swf)
end
