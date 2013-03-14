require 'rubygems'
require 'httpclient'

def postUpdate(port, arg = nil)
  ret = false
  begin
    client = HTTPClient.new
    if arg
      res = client.post_content("http://localhost:#{port}/update/", {'arg' => arg})
    else
      res = client.post_content("http://localhost:#{port}/update/")
    end
    ret = true  # at least the http request was correctly processed.
  rescue
    puts "warning: failed to notify http://localhost:#{port} of changes."
  end
  ret
end
