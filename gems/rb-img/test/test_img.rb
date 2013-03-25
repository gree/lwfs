require File.dirname(__FILE__) + '/test_helper.rb'

class TestImg < Test::Unit::TestCase

  def setup
    return unless $dirname.nil?
    $dirname = File.dirname(__FILE__)
    $bytes888 = []
    $bytes8888 = []
    $bytes8888rev = []
    $bytes565 = []
    $bytes4444 = []
    $bytes5551 = []
    512.times do |y|
      512.times do |x|
        r = (255 * x / 511.0).round
        g = (255 * (511 - x) / 511.0).round
        b = (255 * y / 511.0).round
        a = (255 * y / 511.0).round
        $bytes888.push(r)
        $bytes888.push(g)
        $bytes888.push(b)
        $bytes8888.push(r)
        $bytes8888.push(g)
        $bytes8888.push(b)
        $bytes8888.push(a)
        $bytes8888rev.push(a)
        $bytes8888rev.push(r)
        $bytes8888rev.push(g)
        $bytes8888rev.push(b)
        # each 16-bit pixel is expressed in big endian order.
        r5 = (r * 31 / 255.0).round
        g6 = (g * 63 / 255.0).round
        b5 = (b * 31 / 255.0).round
        p = (r5 << 11) | (g6 << 5) | b5
        $bytes565.push((p >> 8) & 0xff)
        $bytes565.push((p >> 0) & 0xff)
        r4 = (r * 15 / 255.0).round
        g4 = (g * 15 / 255.0).round
        b4 = (b * 15 / 255.0).round
        a4 = (a * 15 / 255.0).round
        p = (r4 << 12) | (g4 << 8) | (b4 << 4) | a4
        $bytes4444.push((p >> 8) & 0xff)
        $bytes4444.push((p >> 0) & 0xff)
        r5 = (r * 31 / 255.0).round
        g5 = (g * 31 / 255.0).round
        b5 = (b * 31 / 255.0).round
        a1 = (a *  1 / 255.0).round
        p = (r5 << 11) | (g5 << 6) | (b5 << 1) | a1
        $bytes5551.push((p >> 8) & 0xff)
        $bytes5551.push((p >> 0) & 0xff)
      end
    end
    $bytes888 = $bytes888.pack('C*')
    $bytes8888 = $bytes8888.pack('C*')
    $bytes8888rev = $bytes8888rev.pack('C*')
    $bytes565 = $bytes565.pack('C*')
    $bytes4444 = $bytes4444.pack('C*')
    $bytes5551 = $bytes5551.pack('C*')
  end
  
  def test_version
    version = File.read($dirname + '/../VERSION').chomp
    assert Img::VERSION == version
  end

  def test_save_888_png
    Img::save($dirname + '/img-888.png', 512, 512, Img::RGB888, $bytes888)
  end

  def test_save_8888_png
    Img::save($dirname + '/img-8888.png', 512, 512, Img::RGBA8888, $bytes8888)
  end

  def test_save_8888rev_png
    Img::save($dirname + '/img-8888rev.png', 512, 512, Img::ARGB8888, $bytes8888rev)
  end

  def test_save_565_png
    Img::save($dirname + '/img-565.png', 512, 512, Img::RGB565, $bytes565)
  end

  def test_save_4444_png
    Img::save($dirname + '/img-4444.png', 512, 512, Img::RGBA4444, $bytes4444)
  end

  def test_save_5551_png
    Img::save($dirname + '/img-5551.png', 512, 512, Img::RGBA5551, $bytes5551)
  end

  def test_save_888_jpg
    Img::save($dirname + '/img-888.jpg', 512, 512, Img::RGB888, $bytes888)
  end

  def test_save_8888_jpg
    Img::save($dirname + '/img-8888.jpg', 512, 512, Img::RGBA8888, $bytes8888)
  end

  def test_save_8888rev_jpg
    Img::save($dirname + '/img-8888rev.jpg', 512, 512, Img::ARGB8888, $bytes8888rev)
  end

  def test_save_565_jpg
    Img::save($dirname + '/img-565.jpg', 512, 512, Img::RGB565, $bytes565)
  end

  def test_save_4444_jpg
    Img::save($dirname + '/img-4444.jpg', 512, 512, Img::RGBA4444, $bytes4444)
  end

  def test_save_5551_jpg
    Img::save($dirname + '/img-5551.jpg', 512, 512, Img::RGBA5551, $bytes5551)
  end

end
