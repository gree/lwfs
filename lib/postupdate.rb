require 'rubygems'
require 'httpclient'

def postUpdate(arg = '')
  ret = false
  begin
    client = HTTPClient.new
    res = client.post_content("http://localhost:10080/update/#{arg}", {})
    ret = true  # at least the http request was correctly processed.
  rescue
    puts "warning: failed to notify http://localhost:10080 of changes."
  end
  ret
end
