require 'mkmf'

dir_config("img")

$CFLAGS = '-I/opt/local/include/'
$LDFLAGS = '-L/opt/local/lib'
have_header('zlib.h')
have_header('png.h')
have_header('jpeglib.h')
have_library('z')
have_library('png')
have_library('jpeg')

create_makefile("img")
