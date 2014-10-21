var shell = WScript.CreateObject("WScript.Shell");
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var base = fso.GetFile(WScript.ScriptFullName).ParentFolder.Path;
try {
    fso.DeleteFile(base + "\\LWFS\\.a\\lwfs\\.lwfs_is_running.*");
}
catch (ex) {
}
WScript.Sleep(2000);
{
    var svc = GetObject("winmgmts://.");
    var objs = svc.InstancesOf("Win32_Process");
    for (var e = new Enumerator(objs); !e.atEnd(); e.moveNext()) {
        var item = e.item();
        if (item.CommandLine) {
            if (item.CommandLine.match(/ruby.*lwfs/)) {
                try {
                    item.Terminate();
                }
                catch (ex) {
                }
            }
            if (item.CommandLine.match(/ruby.*watch.*LWFS/)) {
                try {
                    item.Terminate();
                }
                catch (ex) {
                }
            }
        }
    }
}
