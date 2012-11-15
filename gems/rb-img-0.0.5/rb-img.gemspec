# -*- encoding: utf-8; mode: ruby; -*-

Gem::Specification.new do |s|
  s.name = %q{rb-img}
  s.version = "0.0.5"
  s.description = "ruby img extension."
  s.required_rubygems_version = Gem::Requirement.new(">= 0") if s.respond_to? :required_rubygems_version=
  s.authors = ["Ian Levesque"]
  s.date = %q{2012-10-23}
  s.email = %q{koji.nakamaru@gree.net}
  s.extensions = ["ext/img/extconf.rb"]
  s.extra_rdoc_files = [
    "README.rdoc"
  ]
  s.files = [
     "README.rdoc",
     "LICENSE",
     "LICENSE.3RDPARTY",
     "Rakefile",
     "VERSION",
     "ext/img/img.c",
     "lib/rb-img.rb",
     "rb-img.gemspec",
     "test/test_helper.rb",
     "test/test_img.rb"
  ]
  s.homepage = %q{https://github.com/gree/lwfs}
  s.rdoc_options = ["--charset=UTF-8"]
  s.require_paths = ["lib"]
  s.rubygems_version = %q{1.3.7}
  s.summary = %q{'Img' extension to save image data in png/jpg.}
  s.test_files = [
     "test/test_img.rb"
  ]

  if s.respond_to? :specification_version then
    current_version = Gem::Specification::CURRENT_SPECIFICATION_VERSION
    s.specification_version = 3

    if Gem::Version.new(Gem::VERSION) >= Gem::Version.new('1.2.0') then
    else
    end
  else
  end
end
