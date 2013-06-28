# -*- coding: utf-8 -*-

def glob(filter)
  entries = []
  if filter.kind_of?(Array)
    filter = filter.map{|e| e.encode(Encoding::UTF_8)}
  else
    filter = filter.encode(Encoding::UTF_8)
  end
  Dir.glob(filter).each do |e|
    entries.push(e) unless e =~ /(^|\/)[#,]/
  end
  entries.sort
end
