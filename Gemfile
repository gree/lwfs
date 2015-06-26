# -*- mode: ruby; -*-
source "https://rubygems.org"

gem "httpclient"
gem "ruby-lzma"
gem "sinatra"
gem "thin"
gem "uuidtools"
gem "actioncompiler"
gem "rb-img"
gem "libxml-ruby"
platforms :ruby, :mingw do
  if RUBY_PLATFORM =~ /darwin/
    gem "rb-fsevent"
  elsif RUBY_PLATFORM =~ /mingw/
    gem "wdm"
  elsif RUBY_PLATFORM =~ /linux/
    gem "rb-inotify"
  end
end
