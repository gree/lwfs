# -*- mode: ruby; coding: utf-8 -*-
require 'rubygems'
require File.dirname(__FILE__) + '/lwfs'

module Rack
  class CommonLogger
    def call(env)
      # do nothing
      @app.call(env)
    end
  end
end

run Sinatra::Application
