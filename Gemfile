# -*- mode: ruby; -*-
source "https://rubygems.org"

gem "httpclient"
gem "uuidtools"
platforms :ruby, :mingw do
  if RUBY_PLATFORM =~ /darwin/
    gem "rb-fsevent"
  elsif RUBY_PLATFORM =~ /mingw/
    gem "rb-fchange"
  elsif RUBY_PLATFORM =~ /linux/
    gem "rb-inotify"
  end
  gem "libxml-ruby"
  gem "rb-img"
end
platforms :jruby do
  gem "rb-listen"
end
