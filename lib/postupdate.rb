require 'rubygems'
require 'httpclient'

def postUpdate(port, arg = '')
  ret = false
  begin
    client = HTTPClient.new
    res = client.post_content("http://localhost:#{port}/update/", {'arg' => arg})
    ret = true  # at least the http request was correctly processed.
  rescue
    puts "warning: failed to notify http://localhost:#{port} of changes."
  end
  ret
end
