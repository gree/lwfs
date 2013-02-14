# -*- mode: ruby; -*-
source "https://rubygems.org"

gem "httpclient"
gem "listen"
gem "ruby-lzma"
gem "uuidtools"
platforms :ruby, :mingw do
  if RUBY_PLATFORM =~ /darwin/
    gem "rb-fsevent"
  elsif RUBY_PLATFORM =~ /mingw/
    gem "wdm"
  elsif RUBY_PLATFORM =~ /linux/
    gem "rb-inotify"
  end
  gem "libxml-ruby"
  gem "rb-img"
end
