

                                 LWFS
                              Mac OS X版


インストール
==========

1. stop.appを開きます。これで現在動作しているLWFSが停止します。
2. 前にインストールしたLWFSを削除します。
3. このフォルダを例えば/Applicationの下にコピーします。

最近のOS Xについて
----------------

最近のOS Xは、ダウンロードされたアップルスクリプトについて、”署名されて
いる"ことを要求しますが、ここにあるstart.appおよびstop.appは署名されて
いません。当面はLWFS*.zipを展開した後、次のコマンドをターミナルで実行し
てください。

  xattr -d -r com.apple.quarantine LWFS


LWFSの開始/停止
==============

* start.appを開くとLWFSが開始します。
* stop.appを開くとLWFSが停止します。
