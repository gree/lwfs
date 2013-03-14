var svc = GetObject("winmgmts://.");
var objs = svc.InstancesOf("Win32_Process");
for (var e = new Enumerator(objs); !e.atEnd(); e.moveNext()) {
    var item = e.item();
    if (item.CommandLine) {
        if (item.CommandLine.match(/ruby.*lwfs/)) {
            item.Terminate();
        }
        if (item.CommandLine.match(/ruby.*watch.*LWFS/)) {
            item.Terminate();
        }
    }
}
