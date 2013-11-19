

                                 LWFS
                              Mac OS X版


インストール
==========

1. stop.appを開きます。これで現在動作しているLWFSが停止します。
2. 前にインストールしたLWFSを削除します。
3. このフォルダを例えば/Applicationの下にコピーします。

Mavericksについて
----------------

Mavericksはダウンロードされたアップルスクリプトについて、”署名されてい
る"ことを要求しますが、ここにあるstart.appおよびstop.appは署名されてい
ません。当面はLWFS*.zipを展開した後、次のコマンドをターミナルで実行して
ください。

  xattr -d -r com.apple.quarantine LWFS


LWFSの開始/停止
==============

* start.appを開くとLWFSが開始します。
* stop.appを開くとLWFSが停止します。
