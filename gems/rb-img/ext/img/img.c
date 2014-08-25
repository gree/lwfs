/*
 * img.c
 */

#ifdef __MINGW32__
#include <windows.h>
#endif
#include <stddef.h>
#include <stdio.h>
#include <stdlib.h>
#include <ruby.h>
#undef EXTERN
#include <png.h>
#include <jpeglib.h>
#include <setjmp.h>

/* GL in big endian */
#define GL_RGB                          0x1907  /* RGB888 */
#define GL_RGBA                         0x1908  /* RGBA8888 */
#define GL_UNSIGNED_INT_8_8_8_8_REV	0x8367  /* ARGB8888 */
#define GL_UNSIGNED_SHORT_5_6_5         0x8363  /* RGB565 */
#define GL_UNSIGNED_SHORT_4_4_4_4       0x8033  /* RGBA4444 */
#define GL_UNSIGNED_SHORT_5_5_5_1       0x8034  /* RGBA5551 */

static int normalize(
    int format,
    char *bytes_,
    int num_bytes_,
    int width,
    int height,
    char *bytes,
    int num_bytes,
    int num_compos);
static int savePNG(
    FILE *fp,
    char *raw1d,
    int width,
    int height);
static int saveJPG(
    FILE *fp,
    char *raw1d,
    int width,
    int height);
static void onErrorJPG(
    j_common_ptr info);


VALUE img_save(
    VALUE self,
    VALUE fname_,
    VALUE width_,
    VALUE height_,
    VALUE format_,
    VALUE bytes_)
{
    char *fname, *suffix;
    int width;
    int height;
    int format;
    unsigned char *bytes;
    int num_bytes;
    int dst_num_compos;
    char *dst_bytes = NULL;
    int dst_num_bytes;
    FILE *fp = NULL;
    char *err_msg = NULL;
#ifdef __MINGW32__
    WCHAR fname_w[MAX_PATH + 1];
#endif
    rb_check_type(fname_, RUBY_T_STRING);
    rb_check_type(width_, RUBY_T_FIXNUM);
    rb_check_type(height_, RUBY_T_FIXNUM);
    rb_check_type(format_, RUBY_T_FIXNUM);
    rb_check_type(bytes_, RUBY_T_STRING);
    fname = RSTRING_PTR(fname_);
    width = NUM2INT(width_);
    height = NUM2INT(height_);
    format = NUM2INT(format_);
    bytes = (unsigned char *)RSTRING_PTR(bytes_);
    num_bytes = RSTRING_LEN(bytes_);
    if (strlen(fname) < 4) {
        err_msg = "wrong file name without .png/.jpg.";
        goto end;
    }
    suffix = fname + strlen(fname) - 4;
    if (strcmp(suffix, ".png") != 0 && strcmp(suffix, ".jpg") != 0) {
        err_msg = "wrong file name without .png/.jpg.";
        goto end;
    }
    if (width <= 0 || height <= 0) {
        err_msg = "wrong width/height.";
        goto end;
    }
    dst_num_compos = (strcmp(suffix, ".png") == 0) ? 4 : 3;
    dst_num_bytes = width * height * dst_num_compos;
    dst_bytes = (char *)malloc(dst_num_bytes);
    if (! normalize(format, bytes, num_bytes, width, height, dst_bytes, dst_num_bytes, dst_num_compos)) {
        err_msg = "unsupported format";
        goto end;
    }
#ifdef __MINGW32__
    if (MultiByteToWideChar(CP_UTF8, 0, fname, strlen(fname) + 1, NULL, 0) > MAX_PATH + 1) {
        goto end;
    }
    MultiByteToWideChar(CP_UTF8, 0, fname, strlen(fname) + 1, fname_w, MAX_PATH + 1);
    fp = _wfopen(fname_w, L"wb");
#else
    fp = fopen(fname, "wb");
#endif
    if (! fp) {
        err_msg = "failed to open the file.";
        goto end;
    }
    if (strcmp(suffix, ".png") == 0) {
        if (! savePNG(fp, dst_bytes, width, height)) {
            err_msg = "failed to write the file.";
            goto end;
        }
    } else {
        if (! saveJPG(fp, dst_bytes, width, height)) {
            err_msg = "failed to write the file.";
            goto end;
        }
    }
end:
    if (fp) {
        fclose(fp);
    }
    if (dst_bytes) {
        free(dst_bytes);
    }
    if (err_msg) {
        rb_raise(rb_eRuntimeError, "%s", err_msg);
    }
    return Qnil;
}

void Init_img()
{
    VALUE module = rb_define_module("Img");
    rb_define_const(module, "RGB888", rb_int_new(GL_RGB));
    rb_define_const(module, "RGB565", rb_int_new(GL_UNSIGNED_SHORT_5_6_5));
    rb_define_const(module, "RGBA4444", rb_int_new(GL_UNSIGNED_SHORT_4_4_4_4));
    rb_define_const(module, "RGBA5551", rb_int_new(GL_UNSIGNED_SHORT_5_5_5_1));
    rb_define_const(module, "RGBA8888", rb_int_new(GL_RGBA));
    rb_define_const(module, "ARGB8888", rb_int_new(GL_UNSIGNED_INT_8_8_8_8_REV));
    rb_define_module_function(module, "save", img_save, 5);
}

#define GET_SRC_888 \
    unsigned char r = src[0]; \
    unsigned char g = src[1]; \
    unsigned char b = src[2]; \
    unsigned char a = 255; \
    src += 3

#define GET_SRC_8888 \
    unsigned char r = src[0]; \
    unsigned char g = src[1]; \
    unsigned char b = src[2]; \
    unsigned char a = src[3]; \
    src += 4

#define GET_SRC_8888rev \
    unsigned char a = src[0]; \
    unsigned char r = src[1]; \
    unsigned char g = src[2]; \
    unsigned char b = src[3]; \
    src += 4

#define GET_SRC_565 \
    unsigned short p = (src[0] << 8) | src[1]; \
    unsigned char r = (unsigned char)(((p >> 11) & 31) * 255 / 31); \
    unsigned char g = (unsigned char)(((p >>  5) & 63) * 255 / 63); \
    unsigned char b = (unsigned char)(((p >>  0) & 31) * 255 / 31); \
    unsigned char a = 255; \
    src += 2

#define GET_SRC_4444 \
    unsigned short p = (src[0] << 8) | src[1]; \
    unsigned char r = (unsigned char)(((p >> 12) & 15) * 255 / 15); \
    unsigned char g = (unsigned char)(((p >>  8) & 15) * 255 / 15); \
    unsigned char b = (unsigned char)(((p >>  4) & 15) * 255 / 15); \
    unsigned char a = (unsigned char)(((p >>  0) & 15) * 255 / 15); \
    src += 2

#define GET_SRC_5551 \
    unsigned short p = (src[0] << 8) | src[1]; \
    unsigned char r = (unsigned char)(((p >> 11) & 31) * 255 / 31); \
    unsigned char g = (unsigned char)(((p >>  6) & 31) * 255 / 31); \
    unsigned char b = (unsigned char)(((p >>  1) & 31) * 255 / 31); \
    unsigned char a = (unsigned char)(((p >>  0) &  1) * 255 /  1); \
    src += 2

#define SET_DST_888 \
    dst[0] = r * a / 255; \
    dst[1] = g * a / 255; \
    dst[2] = b * a / 255; \
    dst += 3

#define SET_DST_8888 \
    dst[0] = r; \
    dst[1] = g; \
    dst[2] = b; \
    dst[3] = a; \
    dst += 4

#define FOR_EACH \
    unsigned char *src = (unsigned char *)bytes_; \
    unsigned char *dst = (unsigned char *)bytes; \
    int i; \
    for (i = 0; i < num; i++)

static int normalize(
    int format,
    char *bytes_,
    int num_bytes_,
    int width,
    int height,
    char *bytes,
    int num_bytes,
    int num_compos)
{
    int num;
    memset(bytes, 0, num_bytes);
    {
        int num_compos_;
        int num_pixels_;
        int num_pixels;
        switch (format) {
        case GL_RGB:
            num_compos_ = 3;
            break;
        case GL_RGBA:
            num_compos_ = 4;
            break;
        case GL_UNSIGNED_INT_8_8_8_8_REV:
            num_compos_ = 4;
            break;
        case GL_UNSIGNED_SHORT_5_6_5:
        case GL_UNSIGNED_SHORT_4_4_4_4:
        case GL_UNSIGNED_SHORT_5_5_5_1:
            num_compos_ = 2;
            break;
        default:
            return 0;
        }
        num_pixels_ = num_bytes_ / num_compos_;
        num_pixels = num_bytes / num_compos;
        num = (num_pixels_ < num_pixels) ? num_pixels_ : num_pixels;
    }
    switch (format) {
    case GL_RGB:
        if (num_compos == 4) {
            FOR_EACH {
                GET_SRC_888;
                SET_DST_8888;
            }
        } else {
            memcpy(bytes, bytes_, num * num_compos);
        }
        break;
    case GL_RGBA:
        if (num_compos == 4) {
            memcpy(bytes, bytes_, num * num_compos);
        } else {
            FOR_EACH {
                GET_SRC_8888;
                SET_DST_888;
            }
        }
        break;
    case GL_UNSIGNED_INT_8_8_8_8_REV:
        if (num_compos == 4) {
            FOR_EACH {
                GET_SRC_8888rev;
                SET_DST_8888;
            }
        } else {
            FOR_EACH {
                GET_SRC_8888rev;
                SET_DST_888;
            }
        }
        break;
    case GL_UNSIGNED_SHORT_5_6_5:
        if (num_compos == 4) {
            FOR_EACH {
                GET_SRC_565;
                SET_DST_8888;
            }
        } else {
            FOR_EACH {
                GET_SRC_565;
                SET_DST_888;
            }
        }
        break;
    case GL_UNSIGNED_SHORT_4_4_4_4:
        if (num_compos == 4) {
            FOR_EACH {
                GET_SRC_4444;
                SET_DST_8888;
            }
        } else {
            FOR_EACH {
                GET_SRC_4444;
                SET_DST_888;
            }
        }
        break;
    case GL_UNSIGNED_SHORT_5_5_5_1:
        if (num_compos == 4) {
            FOR_EACH {
                GET_SRC_5551;
                SET_DST_8888;
            }
        } else {
            FOR_EACH {
                GET_SRC_5551;
                SET_DST_888;
            }
        }
        break;
    default:
        return 0;
    }
    return 1;
}

static int savePNG(
    FILE *fp,
    char *raw1d,
    int width,
    int height)
{
    png_bytepp raw2d = (png_bytepp)malloc(height * sizeof(png_bytep));
    png_structp pp = png_create_write_struct(PNG_LIBPNG_VER_STRING, NULL, NULL, NULL);
    png_infop ip = png_create_info_struct(pp);
    int i;
    if (setjmp(png_jmpbuf(pp))) {
        goto end;
        return 0;
    }
    png_init_io(pp, fp);
    png_set_IHDR(
        pp,
        ip,
        width,
        height,
        8,
        PNG_COLOR_TYPE_RGBA,
        PNG_INTERLACE_NONE,
        PNG_COMPRESSION_TYPE_DEFAULT,
        PNG_FILTER_TYPE_DEFAULT);
    for (i = 0; i < height; i++) {
        raw2d[i] = (png_bytep)&raw1d[i * png_get_rowbytes(pp, ip)];
    }
    png_write_info(pp, ip);
    png_write_image(pp, raw2d);
    png_write_end(pp, ip);
end:
    png_destroy_write_struct(&pp, &ip);
    if (raw2d) {
        free(raw2d);
    }
    return 1;
}

typedef struct JPGErrorMgr JPGErrorMgr;
struct JPGErrorMgr {
    struct jpeg_error_mgr pub;
    jmp_buf buf;
};

static int saveJPG(
    FILE *fp,
    char *raw1d,
    int width,
    int height)
{
    JSAMPARRAY raw2d = (JSAMPARRAY)malloc(height * sizeof(JSAMPROW));
    struct jpeg_compress_struct info;
    JPGErrorMgr mgr;
    jmp_buf jpg_jmpbuf;
    int i;
    info.err = jpeg_std_error(&mgr.pub);
    mgr.pub.error_exit = onErrorJPG;
    if (setjmp(mgr.buf)) {
        goto end;
    }
    jpeg_create_compress(&info);
    jpeg_stdio_dest(&info, fp);
    info.image_width = width;
    info.image_height = height;
    info.input_components = 3;
    info.in_color_space = JCS_RGB;
    jpeg_set_defaults(&info);
    for (i = 0; i < height; i++) {
        raw2d[i] = (JSAMPROW)&raw1d[i * sizeof(JSAMPLE) * 3 * width];
    }
    jpeg_start_compress(&info, TRUE);
    jpeg_write_scanlines(&info, raw2d, height);
    jpeg_finish_compress(&info);
end:
    jpeg_destroy_compress(&info);
    if (raw2d) {
        free(raw2d);
    }
    return 1;
}

static void onErrorJPG(
    j_common_ptr info)
{
    JPGErrorMgr *mgr = (JPGErrorMgr *)info->err;
    /* info->err->output_message(info); */
    longjmp(mgr->buf, 1);
}
