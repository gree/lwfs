window.addEventListener(
    'load',
    function() {
        var qr = qrcode(8, 'M');
        qr.addData(window.location.href);
        qr.make();
        document.getElementById('qr').innerHTML = qr.createImgTag();
    },
    false);
