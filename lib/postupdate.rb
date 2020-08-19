require 'rubygems'
require 'httpclient'

def postUpdate(port, arg = nil)
  ret = false
  begin
    client = HTTPClient.new
    if arg
      res = client.post_content("http://localhost:#{port}/update/", {'arg' => arg})
    else
      # https://stackoverflow.com/questions/2651379/webrickhttpstatuslengthrequired-error-when-accessing-create-method-in-contro/4061028#4061028
      res = client.post_content("http://localhost:#{port}/update/", {})
    end
    ret = true  # at least the http request was correctly processed.
  rescue
    puts "warning: failed to notify http://localhost:#{port} of changes."
  end
  ret
end
