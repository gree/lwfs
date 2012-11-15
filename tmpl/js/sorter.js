var table=function(){
    function sorter(n){
        this.n=n;
        this.t=null;
        this.b=null;
        this.r=null;
        this.d=null;
        this.p=null;
        this.w=null;
        this.a=[];
        this.l=0;
    }
    sorter.prototype.init=function(t,f,desc){
        this.t=document.getElementById(t);
        this.b=this.t.getElementsByTagName('tbody')[0];
        this.r=this.b.rows; var l=this.r.length;
        for(var i=0;i<l;i++){
            if(i==0){
                var c=this.r[i].cells; this.w=c.length;
                for(var x=0;x<this.w;x++){
                    if(c[x].className!='nosort'){
                        c[x].className='head';
                        c[x].onclick=new Function(this.n+'.work(this.cellIndex)');
                    }
                }
            }else{
                this.a[i-1]={}; this.l++;
            }
        }
        if(f!=null){
            var a=new Function(this.n+'.work('+f+')');
            a();
            if (desc) {
                a();
            }
        }
    };
    sorter.prototype.work=function(y){
        this.b=this.t.getElementsByTagName('tbody')[0]; this.r=this.b.rows;
        var x=this.r[0].cells[y],i;
        for(i=0;i<this.l;i++){
            this.a[i].o=i+1; var v=this.r[i+1].cells[y].firstChild;
            this.a[i].value=(v!=null)?getText(v):'';
        }
        for(i=0;i<this.w;i++){
            var c=this.r[0].cells[i];
            if(c.className!='nosort'){c.className='head';}
        }
        if(this.p==y){
            this.a.reverse(); x.className=(this.d)?'asc':'desc';
            this.d=(this.d)?false:true;
        }else{
            this.p=y; this.a.sort(compare); x.className='asc'; this.d=false;
        }
        var n=document.createElement('tbody');
        n.appendChild(this.r[0]);
        for(i=0;i<this.l;i++){
            var r=this.r[this.a[i].o-1].cloneNode(true);
            n.appendChild(r); r.className=(i%2==0)?'even':'odd';
        }
        this.t.replaceChild(n,this.b);
    };
    function compare(f,c){
        f=f.value,c=c.value;
        if(f.match(/^[.0-9]+$/)&&c.match(/^[.0-9]+$/)){
            f=parseFloat(f);
            c=parseFloat(c);
        }
        return (f>c?1:(f<c?-1:0));
    }
    function getText(node) {
        var f=function(n, strs) {
            if (n.nodeType==3 /* Node.TEXT_NODE */) {
                strs.push(n.data);
            } else if(n.nodeType==1 /* Node.ELEMENT_NODE */){
                for (var m=n.firstChild; m!==null; m=m.nextSibling) {
                    f(m, strs);
                }
            }
        };
        var strings = [];
        f(node, strings);
        return strings.join('');
    }
    return{sorter:sorter};
}();
