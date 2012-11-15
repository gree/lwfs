var shell = WScript.CreateObject("WScript.Shell");
var fso = WScript.CreateObject("Scripting.FileSystemObject");
var base = fso.GetFile(WScript.ScriptFullName).ParentFolder.Path;
{
    var svc = GetObject("winmgmts://.");
    var objs = svc.InstancesOf("Win32_Process");
    for (var e = new Enumerator(objs); !e.atEnd(); e.moveNext()) {
        var item = e.item();
        if (item.CommandLine) {
            if (item.CommandLine.match(/ruby(.exe)? .*lib\/watch-win.rb/)) {
                item.Terminate();
            }
            if (item.CommandLine.match(/ruby(.exe)? .*lwfs.rb/)) {
                item.Terminate();
            }
        }
    }
}
shell.Run("cmd /c " + "\"" + base + "\\LWFS\\.a\\start.bat\"", 0);
