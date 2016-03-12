var groover = {};
groover.geom = (function (){
    const MPI2 = Math.PI * 2;
    const MPI = Math.PI ;
    const MPI90 = Math.PI / 2;
    const MPI180 = Math.PI;
    const MPI270 = Math.PI * ( 3 / 2);
    const MPI360 = Math.PI * 2;
    const MR2D = 180 / MPI;
    const EPSILON = 1E-6; // this is still undecided Could use Number.EPSILON but I feel that is a little small for graphics based metrics
    const EPSILON1 = 1-EPSILON;
    
    var UID = 1;
    
    // some math extentions 
    Math.triPh = function(a,b,c){    // return the angle pheta of a triangle given length of sides a,b,c. Pheta is the angle opisite the length c
        return Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
    }
    Math.triCosPh = function(a,b,c){ // return the cosine of the angle pheta of a triangle given length of sides a,b,c. Pheta is the angle opisite the length c
        return (c * c - (a * a + b * b)) / (-2 * a * b);
    }
    Math.triLenC = function(a,b,pheta){ // return the length of side C given the length of two sides a,b and the angle opisite the edge C
        return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(pheta));
    }
    Math.triLenC2 = function(a,b,pheta){ // return the length squared of side C given the length of two sides a,b and the angle opisite the edge C
        return a*a + b*b - 2*a*b*Math.cos(pheta);
    }
    
    // polyfill for math hypot function.
    if(typeof Math.hypot !== "function"){
        Math.hypot = function(x, y){ return Math.sqrt(x * x + y * y);};
    }
      
    Math.dir = function(x,y){
        return ((Math.atan2(y,x) % MPI2) + MPI2) % MPI2;
 
    }
      
    var sharedFunctions = {
        setLable : function(lable){
            this.lableStr = lable;
            return this;
        },
        getLable : function(){
            return this.lableStr;
        },   
        makeUnique : function(){
            this.id = UID;
            UID += 1;
            return this;
        },
        copyFull : function(arg1,arg2){
            var newMe = this.copy(arg1,arg2);
            newMe.id = this.id;
            newMe.lableStr = this.lableStr;
            return newMe;
        },
        
    }
    var sharedProperties = {
        lableStr : null,
        id : null,
    }
    
    // Closure Vars for internal optimistion
    
    // the following are to aid in optimisation. Rather than create new primitives when needed these should be used instead
    // Do not return them.
    var v1,v2,v3,v4,v5,va,vb,vc,vd,ve,vr1,vr2;
    var l1,l2,l3,l4,l5,la,lb,lc,ld,le,lr1,lr2;    
    const REGS_LEN = 5;
    // reg for regerstry
    var regl,regv; // line and vec stack for quick access to optimisition var
                   // these arrays can act like a stack, quew, random access, or cyclic access
 
    var reglSP, regvSP; // stack pos
    
    function Geom(){
        v1 = new Vec();
        v2 = new Vec();
        v3 = new Vec();
        v4 = new Vec();
        v5 = new Vec();
        va = new Vec();
        vb = new Vec();
        vc = new Vec();
        vd = new Vec();
        ve = new Vec();
        vr1 = new Vec();
        vr2 = new Vec();
        l1 = new Line();
        l2 = new Line();
        l3 = new Line();
        l4 = new Line();
        l5 = new Line(); 
        la = new Line();
        lb = new Line();
        lc = new Line();
        ld = new Line();
        le = new Line();
        lr1 = new Line();
        lr2 = new Line();
        regl = [l1,l2,l3,l4,l5];
        regv = [v1,v2,v3,v4,v5];
        reglSP = 0;
        regvSP = 0;

        this.objectNames = [
            "Vec",
            "VecArray",
            "Line",
            "Triangle",
            "Rectangle",
            "Circle",
            "Arc",
            "Box",
            "Empty",
            "Transform",
        ];
        this.extentions = {
            
        },
        this.properties = {
            Vec : ["x","y","type"],
            Box : ["t","l","b","r","type"],
            Line: ["p1","p1","type"],
            Arc: ["c","s","e","type"],
            Circle: ["p","r","type"],
            Rectangle: ["t","a","type"],
            VecArray: ["vecs","type"],
            Transform: ["xa","ya","o","type"],
            Triangle : ["p1","p2","p3","type"],
            
            Empty : ["type"],
        };
        this.Vec = Vec;
        this.Line = Line;
        this.Circle = Circle;
        this.Arc = Arc;
        this.Triangle = Triangle;
        this.Rectangle = Rectangle;
        this.Box = Box;
        this.Transform = Transform;
        this.VecArray = VecArray;
        this.Geom = Geom;
        this.Empty = Empty;

    }
    Geom.prototype = {
        extentions : {},
        init : function(){
            var me = this;
            this.objectNames.forEach(function(primitive){
                var i;
                var prim = me[primitive];
                for(i in sharedFunctions){
                     Object.defineProperty(prim.prototype, i, {
                        writable : false,
                        enumerable : true,
                        configurable : false,
                        value : sharedFunctions[i]
                     });
                    console.log("adding to "+primitive+".prototype."+i+"()");
                }
                for(i in sharedProperties){
                     Object.defineProperty(prim.prototype, i, {
                        writable : true,
                        enumerable : true,
                        configurable : false,
                        value : sharedProperties[i]
                     }); 
                }
            });        
        },
        isGeom : function (obj){
            if(obj !== undefined && typeof obj.type === "string"){
                if(this.types.indexOf(obj.type) > -1){
                    return true;
                }
            }        
            return false;
        },
        getDetails : function(){
            var newLine = "\r\n";
            function getComments(lines,currentObj){
                cLines = [];
                lines.forEach(function(line){
                    if(line.indexOf("//") > -1){
                        var l = (line.split("//").pop().trim());
                        if(l !== ""){
                            l = l.replace( /\{a(.*?)\}/g, "requiered argument $1");
                            l = l.replace( /\{o(.*?)\}/g, "optional argument $1");
                            s.objectNames.forEach(function(n){
                                l = l.replace(new RegExp("("+n+")","gi"),"[$1](#"+n.toLowerCase()+")");
                            })
                            l = l.replace( /(`this`)/g, "[this](#"+currentObj.toLowerCase()+")");
                            l = l[0].toUpperCase() + l.substr(1);
                            cLines.push("\t" +l);
                        }
                        
                    }
                });
                return cLines;
            }
            var s = this;
            var str = "";
             
            this.objectNames.forEach(function(n){
                var desc = "## " + n + newLine;
                var methods = "Functions."+newLine;
                var propDesc = "Properties."+newLine;
                var pr = s.properties[n];
                var extentions = {};
                
                
                for(var i in s[n].prototype){
                   
                    if(typeof s[n].prototype[i] === "function"){
                        var ce = "";
                        for(var k in s.extentions){
                            if(s.extentions[k].functions.indexOf(i) > -1){
                                if(extentions[k] === undefined){
                                    extentions[k] = k + " extention."+newLine;
                                }
                                ce = k;
                                break;
                            } 
                        }
                        st = s[n].prototype[i].toString();
                        f = st.replace(/\r/g,"").split("\n");
                        var com = getComments(f,n);
                        f = f.shift();
                        f = f.replace("function ","").replace("{","") ;
                        f = f.replace(/\/\/.*/g,"").trim();

                        if(ce !== ""){
                            extentions[ce] += "- **"+n + "." + i+f + "**  " + newLine;
                            if(com.length > 0){
                                extentions[ce] += com.join("  "+newLine)+newLine;
                            }
                        }else{
                            methods += "- **"+n + "." + i+f + "**  " + newLine;
                            if(com.length > 0){
                                methods += com.join("  "+newLine)+newLine;
                            }
                        }
                    }else
                    if(typeof s[n].prototype[i] === "string"){
                        st = s[n].prototype[i].toString();
                        propDesc += "- **"+n + "." + i+"** = '" +st+"'"+"  " + newLine;
                    }else{
                        st = typeof s[n].prototype[i];
                        propDesc += "- **"+n + "." + i+"** = " +st+"  " + newLine;
                    }
                }
                str += desc + newLine;
                str += propDesc + newLine;
                str += methods + newLine;
                for(var k in extentions){
                    str += extentions[k] + newLine;
                }
                str += "[Back to top.](#contents)"+newLine+newLine
            });
            console.log(str)
        }

    }
    var geom = new Geom();
    geom.Geom = Geom;  // add geom to geom object for use by extentions or anything that needs to 
                       // extend the prototype of Geom.

    function Empty(){};
    function Vec(x,y){
        if(x === undefined && y === undefined){
            return;
        }else
        if(x !== undefined && x !== null && x.x !== undefined && y === undefined){
            this.x = x.x;
            this.y = x.y
        }else
        if(x !== undefined && x !== null && x.x !== undefined && y !== undefined && y.y !== undefined){
            this.x = y.x - x.x;
            this.y = y.y - x.y;
        }else
        if(y === undefined){
            this.x = x;
        }else
        if(x === undefined || x === null){
            this.x = Math.cos(y);
            this.y = Math.sin(y);        
        }else{
            this.x = x;
            this.y = y;
        }
    };
    function VecArray(){
        this.vecs = [];
    };
    function Triangle(p1,p2,p3){
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    };
    function Line(vec1,vec2){  
        if((vec1 === undefined || vec1 === null) && (vec2 === undefined || vec2 === null)){
            this.p1 = new Vec(0,0);
            this.p2 = new Vec(); // vec defualts to unit vec
        }else
        if(vec1 !== undefined && vec1.type !== undefined && vec1.type === "Vec" && vec2 !== undefined &&  vec2.type !== undefined && vec2.type === "Vec"){
            this.p1 = vec1;
            this.p2 = vec2;
        }else{
            this.p1 = new Vec(0,0);
            this.p2 = new Vec(); // vec defualts to unit vec            
        }
    };
    function Circle(vec,num){
        if((vec === undefined || vec === null) && (num === undefined || num === null)){
            this.center = new Vec(0,0);
            this.radius = 1;
        }else 
        if(vec.type !== undefined && vec.type === "Vec" && typeof num === "number"){
            this.center = vec;
            this.radius = num;
        }else{
            this.center = new Vec(0,0);
            this.radius = 1;
        }
    };
    function Arc(circle,start,end){
        this.circle = circle === undefined || circle === null ? new Circle() : circle;
        this.start = start;
        this.end = end;
    };
    function Rectangle(top,aspect){
        this.top = top === undefined || top === null ? new Line() : top;
        this.aspect = aspect === undefined || aspect === null ? 1 : aspect;
    };
    function Box(left,top,right,bottom){
        if((left === undefined || left === null) && (top === undefined || top === null)  && (right === undefined || right === null) && (bottom === undefined || bottom === null)){
            this.irrate();
            return;
        }
        this.left = left;
        this.top = top;
        this.right = right;
        this.bottom = bottom;
    };
    function Transform(xAxis,yAxis,origin){
        this.xa = xAxis;
        this.ya = yAxis;
        this.o = origin;
    };
    
    Empty.prototype = {
        type : "Empty",
        copy : function(){  //Makes a copy of this
            return new Empty();  // returns a new Empty 
        },
        asBox : function(box){  // this is always empty and thus has no size. Will create a new box if {obox} is not supplied 
            if(box === undefined){
                box = new Box();
            }
            return box; // Returns new box or the {obox}
        },
        setAs : function(){ // does nothing.
            return this; // returns this.
        },
        isEmpty : function(){ // always returns true.
            return true; // returns true.
        },
    },
    VecArray.prototype =  {
        vecs : [],
        type :"VecArray",
        each : function (callback,dir,start){ // Itterates the vecs in this. The itterater can break if the {acallback} returns false. The {odir} if true itterates the vecs in the reverse direction. The {ostart} as Number is the index of the start of itteration.
                                 // if the {odir} is true then {ostart} if passed will be the number of vec from the end to start itteration at
                                 // The {acallback} in the form
                                 // ```JavaScript
                                 // var callback = function(vec, i){
                                 // return boolean    
                                 // }
                                 // ```
            var i;
            var l = this.vecs.length;      
            if(start === undefined || start === null){
                start = 0;
            }
            if(dir){
                l -= 1;
                l -= start;
                for(i = l; i >= 0; i --){
                    if(callback(this.vecs[i],i) === false){
                        break;
                    }
                }
            }else{
                for(i = start; i < l; i ++){
                    if(callback(this.vecs[i],i) === false){
                        break;
                    }
                }
            }
            return this; // returns this
        },
        cull : function (callback){  // Itterate all vecs culling those vecs that the {acallback} returns false for.
                                 // Callback {acallback} in the form
                                 // ```JavaScript
                                 // var callback = function(vec, i){
                                 // return boolean    
                                 // }
                                 // ```
            var i;
            var l = this.vecs.length; 
            for(i =0; i < l; i ++){
                if(callback(this.vecs[i],i) === false){
                    this.vecs.splice(i,1);
                    i -= 1;
                    l -= 1;
                }
            }
            return this;  // returns this
        },
        toString : function(precision, lineFeed){ // return a string representing this object. 
                                       // The {olineFeed} can insert a lineFeed after each vec. For example for console output add call with lineFeed = "\n". 
                                       // the {oprecision} can also be changed. The default is 6;
            var str;
            if(precision === undefined || precision === null){
                precision = 6;
            }
            if(lineFeed === undefined || lineFeed === null){
                lineFeed = "";
            }
            if(this.vecs.length === 0){
                str += "VecArray : Is empty." + lineFeed
            }else{
                str = "VecArray : "+ this.vecs.length+" vecs" + lineFeed
                this.each(function(vec,i){
                    str += "index "+i+" : "+vec.toString(precision)+lineFeed;
                });
            }
            return str; // returns String
        },
        clear : function(){  // removes all vecs from the list
            this.vecs.splice(0,this.vecs.length);
            return this;  // returns this
        },
        reverse : function(){
            this.vecs.reverse();
            return this; // returns this
        },
        remove : function(index){
            if(index >= 0 && index < this.vecs.length){
                this.vecs.splice(index,1);
            }
            return this;
        },
        copy : function (from, to){  // Creates a new VecArray with a copy of the vecs in this.
                                     // if {ofrom} and {oto} are passed then create a copy of the points from {ofrom} to but not including {oto}.
            var to2, count;                                     
            var va = new VecArray();
            if(from !== undefined && from !== null){
                if(to === undefined){
                    to = this.getCount();
                }
            }else
            if(to !== undefined && to !== null){
                from = 0;
            }
            if(from !== undefined){
                count = this.getCount();
                to2 = to;
                if(to > count){
                    this.each(function(vec,ind){
                        va.push(vec.copy());
                    },false,from);
                    to -= count;
                    this.each(function(vec,ind){
                        if(ind < to){
                            va.push(vec.copy());
                        }else{
                            return false;
                        }
                    },false,0);
                    return va;  
                }else{                    
                    this.each(function(vec,ind){
                        if(ind < to){
                            va.push(vec.copy());
                        }else{
                            return false;
                        }
                    },false,from);
                    return va;  
                }
            }
            this.each(function(vec){
                va.push(vec.copy());
            });
            return va;  // returns new VecArray
        },
        setAs :function (vecArray){  // sets the array of vecs to that of the {avecArray} will only set existing vecs in this Extra items in the {avecArray} are ignored. If the {avecArray} is smaller than this items then 
                                     
            this.each(function(vec,i){
                vec.x = vecArray.vecs[i].x;
                vec.y = vecArray.vecs[i].y;
            });
            return this; // returns this
        },
        isEmpty : function (){ // Returns whether this is empty (has items)
            if(this.vecs.length === 0){
                return true;  // returns true if there are one or more vecs in this
            }
            return false;  // returns false if there are no vecs in this
        },
        push : function (vec){ // Push the {avec} onto the array of vecs
            this.vecs[this.vecs.length] = vec;
            return this;  // returns this
        },
        pushI : function (vec){ // Push the {avec} onto the array of vecs returning the index of the vec
            this.vecs[this.vecs.length] = vec;
            return this.vecs.length-1;  // returns the index of the pushed vec
        },
        append : function(vecArray){  // append the {avecArray} to the end of the list of vecs
            vecArray.each(function(vec){  
                this.push(vec);
            })
            return this;  // returns this
        },
        asBox : function(box){ // gets the bounding box that envelops all the vecs in the list. The {obox} is used or a new Box is created. Box may be irrational if there are no items in vecArray.
            if(box === undefined){
                var box = new Box();
            }
            this.each(function(vec){
               box.env(vec.x,vec.y);
            });
            return box; // returns the {obox} or a new box.
        },
        mult : function (number){  // Multiply each vec in the list by the {anumber}
            this.each(function(vec){
               vec.mult(number);
            });
            return this; // returns this.
        },
        add : function (vec){ // add the {avec} to each vec in the list
            this.each(function(vec1){
               vec1.add(v);
            });
            return this; // returns this
        },
        sum : function (){ // add the {avec} to each vec in the list
            var vec1 = new Vec(0,0);
            this.each(function(v){
               vec1.add(v);
            });
            return vec1; // returns this
        },
        mean : function(){
            var count = this.getCount();
            if(count > 0){
                return this.sum().div(count);
            }
            return new Empty();
        },
        rotate : function(number){  // rotates each vec bu {anumber}
            this.each(function(vec){
               vec.rotate(number); 
            });
            return this; //returns this.
        },
        findClosestIndex : function(vec, limit){ // returns the index of the point closest to the {avec}{olimit} defines the threshold if defined. Points further away than {olimit} are igonred
            if(this.vecs.length === 0){
                return -1;
            }
            var minDist = limit = undefined ? Infinity : limit;
            var index = -1;
            var dist = 0;
            this.each(function(vec1,ind){
                dist = vec.distTo(vec1);
                if(dist < minDist){
                    minDist = dist;
                    index = ind;
                }                
            });
            return index;
        },
        findClosest : function(vec,limit){ // returns the referance to the point closest to the {avec} {olimit} defines the threshold if defined. Points further away than {olimit} are igonred
            if(this.vecs.length === 0){
                return new Empty();
            }
            var ind = this.findClosestIndex(vec,limit);
            if(ind === -1){
                return new Empty();                
            }
            return this.vecs[ind];
        },
        getLast : function(){ // returns the last vec on the list
            return this.vecs[this.vecs.length-1]; // returns Vec
        },
        getCount : function(){ 
            return this.vecs.length; // Returns the number of vecs in the list
        },
        sumCross : function(){ // returns the sum of the cross product of all the vecs as if they are a set of lines. This includes the line that joins the last vec with the first.
            var i,v1,v2;
            var l = this.vecs.length;
            if(l === 0){
                return 0;
            }
            var xc = 0;
            var yc = 0;
            v1 = this.vecs[0]
            for( i = 0; i < l; i ++){
                v2 = this.vecs[(i+1)%l];
                xc += v1.x * v2.y;
                yc += v1.y * v2.x;
                v1 = v2;                
            }
            return xc - yc; // Returns Number as the summed cross product
        },
        area : function(){ // gets the area of the polygon created by the set of points. I am using an old school method and do not know if the is a better way. The verts must be in counter clockwise order.
            return Math.abs(this.sumCross()/2); // Returns Number as the area
        },        
        perimiter : function(){ // gets the length of the perimiter of the polygon created by the set of points.
            var i,v1,v2;
            var l = this.vecs.length;
            if(l === 0){
                return 0;
            }
            var len = 0;
            v1 = this.vecs[0]
            for( i = 0; i < l; i ++){
                v2 = this.vecs[(i+1)%l];
                len += Math.hypot(v1.x - v2.x, v1.y - v2.y);
                v1 = v2;                
            }
            return len; // Returns Number as length
        },
        indexOf : function(vec, start){ // finds the index of the first vec that is the same as {aVec}. If the {ostart} is passed then the search starts at that index
            var index = -1;
            this.each(function(vec1,i){
                if(vec.isSame(vec1)){
                    index = i;
                    return false; // break from each
                }
            },false,start);
            return index; // Returns index as Number of first matching vec or -1
        },
    }
    Triangle.prototype = {
        p1 : undefined,
        p2 : undefined,
        p3 : undefined,
        type : "Triangle",
        copy : function(){
            return new Triangle(this.p1.copy(),this.p2.copy(),this.p3.copy());
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.p1.x, this.p1.y);
            box.env ( this.p2.x, this.p2.y);
            box.env ( this.p3.x, this.p3.y);
            return box;            
        },
        isEmpty : function(){
            if(this.p1.distFrom(this.p2) <= EPSILON){
                return true;
            }
            if(this.p2.distFrom(this.p3) <= EPSILON){
                return true;
            }
            if(this.p3.distFrom(this.p1) <= EPSILON){
                return true;
            }
            if(this.p1 === undefined || this.p2 === undefined || this.p2 === undefined){
                return true;
            }
        },
        area : function(){
            return Math.abs( this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1) );
        },
        perimiter: function(){
            return this.p1.distFrom(this.p2) + this.p2.distFrom(this.p3) + this.p3.distFrom(this.p1);
        },
        asVecArray : function(){
            return new VecArray()
                .push(this.p1.copy())
                .push(this.p2.copy())
                .push(this.p3.copy())
        },            
        asLines : function(){
            return [
                new Line(this.p1.copy(),this.p2.copy()),
                new Line(this.p2.copy(),this.p3.copy()),
                new Line(this.p3.copy(),this.p1.copy())
            ]
        },
        lines : function(){
            return [
                new Line(this.p1,this.p2),
                new Line(this.p2,this.p3),
                new Line(this.p3,this.p1)
            ]            
        },
        angles : function(){
            var a = this.p2.copy().sub(this.p1).leng();
            var b = this.p3.copy().sub(this.p2).leng();
            var c = this.p1.copy().sub(this.p3).leng();
            return [
                Math.triPh(a,c,b),
                Math.triPh(b,a,c),
                Math.triPh(c,b,a)            
            ];
            
        },
        center : function(){
            return this.p1.copy().add(this.p2).add(this.p3).div(3);
        },
        sumCross : function(){
            return  this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1);
        },
        isVecInside : function(vec){
            var x,y,x1,y1,c; // use the cross product of the vec and each line to find it the point is left off all lines
            x = vec.x - this.p1.x;
            y = vec.y - this.p1.y;
            x1 = this.p2.x-this.p1.x;
            y1 = this.p2.y-this.p1.y;
            if((x1 * y - y1 * x) < 0){
                return false;
            }
            x = vec.x - this.p2.x;
            y = vec.y - this.p2.y;
            x1 = this.p3.x-this.p2.x;
            y1 = this.p3.y-this.p2.y;
            if((x1 * y - y1 * x) < 0){
                return false;
            }
            x = vec.x - this.p3.x;
            y = vec.y - this.p3.y;
            x1 = this.p1.x-this.p3.x;
            y1 = this.p1.y-this.p3.y;
            if((x1 * y - y1 * x) < 0){
                return false;
            }
            return true;
        },
        isLineInside : function(line){
            if(!this.isVecInside(line.p1)){
                return false;
            }
            return this.isVecInside(line.p2)
        },
        isCircleInside : function(circle){
        },
        isArcInside : function(arc){
        },
        isRectangleInside : function(rectangle){
        },
        isBoxInside : function(box){
        },
        isTriangleInside : function(triangle){
        },
        isLineTouching : function(line){
        },
        isCircleTouching : function(circle){
        },
        isArcTouching : function(arc){
        },
        isBoxTouching : function(box){
        },
        isRectangleTouching : function(rectangle){
        },
        isTriangleTouching : function(triangle){
        },
        isClockwise : function(){
            return  this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1)> 0 ? true : false;
        },
        isInside : function(primitive){
            var call = this["is"+primitive.type+"Inside"];
            if(call !== undefined){
                return call(primitive);
            }
            return false;
        },
        sliceLineRemove : function(line,triArray){ // slices triangle with line removing anything right of the line
            if(triArray === undefined){
                triArray = [];
            }
               
            var pe1 = line.isVecLeft(this.p1);
            var pe2 = line.isVecLeft(this.p2);
            var pe3 = line.isVecLeft(this.p3);
            if(pe1 && pe2 && pe3){
                return triArray.push(this.copy());
            }
            if(!pe1 && !pe2 && !pe3){
                triArray;
            }


            var l1 = new Line(this.p1,this.p2);
            var l2 = new Line(this.p2,this.p3);
            var l3 = new Line(this.p3,this.p1);
            var v1 = l1.interceptSeg(line);
            var v2 = l2.interceptSeg(line);
            var v3 = l3.interceptSeg(line);
            var e1 = ! v1.isEmpty(); // if not empty
            var e2 = ! v2.isEmpty();
            var e3 = ! v3.isEmpty();
            
            if(e1 && (v1.isSameE(this.p1) || v1.isSameE(this.p2))){
                e1 = false;
            }
            if(e2 && (v2.isSameE(this.p2) || v2.isSameE(this.p3))){
                e2 = false;
            }
            if(e3 && (v3.isSameE(this.p3) || v3.isSameE(this.p1))){
                e3 = false;
            }
            var tri;
            if(!e1 && ! e2 && !e3){
                tri = [this.copy()];
            }else
            if(e1 && e2 && !e3){
                if(pe2){
                    triArray.push(new Triangle(v1.copy(),this.p2.copy(),v2.copy()));
                }else{
                    triArray.push(   new Triangle(this.p1.copy(),v1,this.p3.copy()));
                    triArray.push(   new Triangle(v1.copy(),v2,this.p3.copy()));
                }
            }else
            if(!e1 && e2 && e3){
                if(pe3){
                    triArray.push(  new Triangle(v2.copy(),this.p3.copy(),v3.copy()));
                }else{
                    triArray.push(  new Triangle(this.p1.copy(),this.p2.copy(),v3));
                    triArray.push(  new Triangle(this.p2.copy(),v2,v3.copy()));
                }
                
            }else
            if(e1 && !e2 && e3){
                if(pe1){
                    triArray.push(  new Triangle(this.p1.copy(),v1,v3));
                }else{
                    triArray.push(  new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()));
                    triArray.push(  new Triangle(v1.copy(),this.p3.copy(),v3.copy()));
                }
            }else
            if(e1 && !e2 && !e3){
                if(pe1){
                     triArray.push( new Triangle(v1,this.p3.copy(),this.p1.copy()));
                }else{
                     triArray.push( new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()));
                }
            }else
            if(!e1 && e2 && !e3){
                if(pe2){
                    triArray.push( new Triangle(v2.copy(),this.p1.copy(),this.p2.copy()));
                }else{
                    triArray.push( new Triangle(v2,this.p3.copy(),this.p1.copy()));
                }
            }else
            if(!e1 && !e2 && e3){
                if (pe3) {
                    triArray.push(new Triangle(v3, this.p2.copy(), this.p3.copy()));
                } else {
                    triArray.push(new Triangle(v3.copy(), this.p1.copy(), this.p2.copy()));
                }
            }else {
                tris = [];
            }
            return tris;
        },
        sliceLine : function(line){
            var l1 = new Line(this.p1,this.p2);
            var l2 = new Line(this.p2,this.p3);
            var l3 = new Line(this.p3,this.p1);
            var v1 = l1.interceptSeg(line);
            var v2 = l2.interceptSeg(line);
            var v3 = l3.interceptSeg(line);
            var e1 = ! v1.isEmpty(); // if not empty
            var e2 = ! v2.isEmpty();
            var e3 = ! v3.isEmpty();
            
            if(e1 && (v1.isSameE(this.p1) || v1.isSameE(this.p2))){
                e1 = false;
            }
            if(e2 && (v2.isSameE(this.p2) || v2.isSameE(this.p3))){
                e2 = false;
            }
            if(e3 && (v3.isSameE(this.p3) || v3.isSameE(this.p1))){
                e3 = false;
            }
            var tri;
            if(!e1 && ! e2 && !e3){
                tri = [this.copy()];
            }else
            if(e1 && e2 && !e3){
                tris = [
                    new Triangle(this.p1.copy(),v1,this.p3.copy()),
                    new Triangle(v1.copy(),v2,this.p3.copy()),
                    new Triangle(v1.copy(),this.p2.copy(),v2.copy())
                 ];
            }else
            if(!e1 && e2 && e3){
                tris = [
                    new Triangle(this.p1.copy(),this.p2.copy(),v3),
                    new Triangle(this.p2.copy(),v2,v3.copy()),
                    new Triangle(v2.copy(),this.p3.copy(),v3.copy())
                 ];
                
            }else
            if(e1 && !e2 && e3){
                tris = [
                    new Triangle(this.p1.copy(),v1,v3),
                    new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()),
                    new Triangle(v1.copy(),this.p3.copy(),v3.copy())
                 ];                
            }else
            if(e1 && !e2 && !e3){
                tris = [
                    new Triangle(v1,this.p3.copy(),this.p1.copy()),
                    new Triangle(v1.copy(),this.p2.copy(),this.p3.copy()),
                ];
            }else
            if(!e1 && e2 && !e3){
                tris = [
                    new Triangle(v2,this.p3.copy(),this.p1.copy()),
                    new Triangle(v2.copy(),this.p1.copy(),this.p2.copy()),
                ];
            }else
            if(!e1 && !e2 && e3){
                tris = [
                    new Triangle(v3,this.p2.copy(),this.p3.copy()),
                    new Triangle(v3.copy(),this.p1.copy(),this.p2.copy()),
                ];
            }else{
                tris = [];
            }
            return tris;
                

            
            
        },
        slice : function(obj){
            
            
        },
        reverse : function(){
            var t = this.p1;
            this.p1 = this.p3,
            this.p3 = t;
            return this;
        },
        inflate : function(amount){
        },
        center : function(){
        },
        asVecArray: function(va){
            if(va === undefined){
                va = new VecArray();
            }
            va.push(this.p1.copy());
            va.push(this.p2.copy());
            va.push(this.p3.copy());
            return va;
        },
        setAs: function(triangle){
            this.p1.x = triangle.p1.x;
            this.p1.y = triangle.p1.y;
            this.p2.x = triangle.p2.x;
            this.p2.y = triangle.p2.y;
            this.p3.x = triangle.p3.x;
            this.p3.y = triangle.p3.y;
            return this;
        },
        scale : function(scale){
            this.p1.x *= scale;
            this.p1.y *= scale;
            this.p2.x *= scale;
            this.p2.y *= scale;
            this.p3.x *= scale;
            this.p3.y *= scale;
            return this; // returns this
        },
        translate : function(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            this.p3.x += vec.x;
            this.p3.y += vec.y;
            return this; // returns this
        },
        rotate : function(rotation){
            var dx = Math.cos(rotation);
            var dy = Math.sin(rotation);
            var x = this.p1.x;
            var y = this.p1.y;
            this.p1.x = x * dx + y * -dy;
            this.p1.y = x * dy + y * dx;
            x = this.p2.x;
            y = this.p2.y;
            this.p2.x = x * dx + y * -dy;
            this.p2.y = x * dy + y * dx;
            x = this.p3.x;
            y = this.p3.y;
            this.p3.x = x * dx + y * -dy;
            this.p3.y = x * dy + y * dx;
            return this; // returns this
        },
        transform : function(transform){
            return this; // returns this
        },
    },
    Vec.prototype = {
        x : 1,
        y : 0,
        _leng : null,  // optimising result for length  
        _dir : null,  // optimising result for direction  
        type : "Vec",
        copy : function(){  // Creates a copy of this
            return new Vec(this.x,this.y);  // returns a new `this`
        },
        toString : function(precision){  // returns a string representing this object
                                // the {oprecision} can also be changed. The default is 6;
            if(precision === undefined || precision === null){
                precision = 6;
            }
            return "Vec: ("+ this.x.toFixed(precision) + ", "+this.y.toFixed(precision) + ")"; // returns String
        },        
        setAs : function(vec){  // Sets this vec to the values in the {avec}
            this.x = vec.x;
            this.y = vec.y;
            return this;  // Returns the existing this
        }, 
        asBox : function(box){  // returns the bounding box that envelops this vec
            if(box === undefined){
                var box = new Box();  // {obox} is created if not supplied
            }
            box.env (this.x, this.y);
            return box;  // returns box
        },
        isEmpty : function (){  // Vec can not be empty so always returns true
            return false;  
        },
        isSame : function(vec){ // Returns true if the {avec} is the same as this
            if(vec.x === this.x && vec.y === this.y){
                return true;
            }
            return false; // returns boolean            
        },
        isSameE : function(vec){ // Returns true if the {avec} is the same as this. Uses EPSILON 
            if(Math.hypot(vec.x-this.x,vec.y-this.y) < EPSILON){
                return true;
            }
            return false; // returns boolean            
        },
        add : function(vec){ // adds {avec} to this.
            this.x += vec.x;
            this.y += vec.y;
            return this;    // returns this
        },
        sub : function(vec){  // subtracts {avec} from this.
            this.x -= vec.x;
            this.y -= vec.y;
            return this; // returns this
        },
        mult : function(number){
            this.x *= number;
            this.y *= number;
            return this; // returns this
        },
        div : function(number){
            this.x /= number;
            this.y /= number;
            return this; // returns this
        },
        rev : function () {
            this.x = - this.x;
            this.y = - this.y;
            return this; // returns this
        },
        r90 : function(){
            var x = this.x;
            this.x = - this.y;
            this.y = x;
            return this; // returns this
        },
        rN90 : function(){
            var x = this.x;
            this.x = this.y;
            this.y = -x;
            return this; // returns this
        },
        r180 : function(){
            this.x = - this.x;
            this.y = - this.y;
            return this; // returns this
        },
        half : function(){
            this.x /= 2;
            this.y /= 2;
            return this; // returns this
        },
        setLeng : function(number){  // Sets the length (magnitude) of this vec to the {anumber}.
            var l = Math.hypot(this.x,this.y);
            this.x = (this.x / l) * number;
            this.y = (this.y / l) * number;
            this._leng = number;
            return this; // returns this
        },
        setDir : function(number){ // Sets the direction of this by {anumber} in radians. This function does not cahnge the magnitude of this vec.
            this._leng  = this.leng();
            this.x = Math.cos(number) * this._leng;
            this.y = Math.sin(number) * this._leng;
            return this;  // returns this
        },
        rotate : function(number){ // Rotates this by {anumber}
            this._leng = Math.hypot(this.x,this.y);
            this._dir = (number += Math.atan2(this.y,this.x));
            this.x = Math.cos(number) * this._leng;
            this.y = Math.sin(number) * this._leng;
            return this;  // returns this
        },
        magnitude : function(){
            return Math.hypot(this.x,this.y);  // returns the magnitude of this as a Number
        },
        leng : function(){
            return Math.hypot(this.x,this.y);  // returns the length (magnitude) of this as a Number
        },
        leng2 : function(){
            return this.x*this.x + this.y * this.y; // returns the length squared of this
        },
        dir : function(){
            return Math.atan2(this.y,this.x);  // returns the direction of this in radians.
        },
        mid : function(vec){
            this.x /= 2;
            this.y /= 2;
            return this;
            // WTF must have been a late night
            //return vec.copy().norm().add(this.copy().norm()).div(2).norm().mult((this.leng()+vec.leng())/2);
        },
        norm : function(){ // normalises this to be a unit length.
            var l = Math.hypot(this.x,this.y);
            this.x /= l;
            this.y /= l;
            return this; // returns this            return this.div(this.leng()); // returns this
        },
        dot : function(vec){  // get the dot product of this and {avec}
            return this.x * vec.x + this.y * vec.y; // returns number
        },
        cross : function(vec){ // get the cross product of this and the {avec}
            return this.x * vec.y - this.y * vec.x; // returns number
        },
        dotNorm : function(vec){ // get the dot product of the normalised this and {avec}
            var la, lb;            
            this._leng = la = Math.hypot(this.x,this.y);
            vec._leng = lb = Math.hypot(vec.x,vec.y);
            return (this.x / la) * (vec.x / lb) + (this.y / la) * (vec.y / lb);
        },
        crossNorm : function(vec){ // get the cross product of the normalised this and the {avec}
            var la, lb;            
            this._leng = la = Math.hypot(this.x,this.y);
            vec._leng = lb = Math.hypot(vec.x,vec.y);
            return (this.x / la) * (vec.y / lb) - (this.y / la) * (vec.x / lb);
        },
        angleBetween : function(vec){ // get the angle between this and the {avec}
            var la, lb;            
            this._leng = la = Math.hypot(this.x,this.y);
            vec._leng = lb = Math.hypot(vec.x,vec.y);
            return Math.asin((this.x / la) * (vec.y / lb) - (this.y / la) * (vec.x / lb)); // returns number as radians
        },
        distFrom : function(vec){ // get the distance from this to the {avec}
            return Math.hypot(this.x-vec.x,this.y-vec.y); // returns number
        },
        distTo : function(vec){ // get the distance from this to the {avec}
            return Math.hypot(this.x-vec.x,this.y-vec.y); // returns number
        },        
        angleTo : function(vec){  // Get the direction from this to the {avec}
            return Math.atan2(vec.y - this.y,vec.x-this.x); // returns number as radians
        },
        scale : function(scale){
            this.x *= scale;
            this.y *= scale;
        },
        translate : function(vec){
            this.x += vec.x;
            this.y += vec.y;
        },
        transform : function(transform){
        },
    }
    Arc.prototype = {
        circle : undefined,
        start : 0,
        end : 0,
        type : "Arc",
        copy : function(){
            return new Arc(this.circle.copy(),this.start,this.end);
        },
        setAs : function (arc){
            this.circle.setAs(arc.circle);
            this.start = arc.start;
            this.end = arc.end;
            return this;         // returns this.    
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            var a = this.copy().normalise();
            box.env (a.circle.center.x + Math.cos(a.start) * a.circle.radius, a.circle.center.y + Math.sin(a.start) * a.circle.radius );
            box.env (a.circle.center.x + Math.cos(a.end) * a.circle.radius, a.circle.center.y + Math.sin(a.end) * a.circle.radius );
            var s = a.start;
            var e = a.end;
            if(s > e){
                s -= MPI2;
            }            
            if(s <= 0 && e >= 0){
                box.env ( a.circle.center.x + a.circle.radius)
            }
            if((s <= -MPI && e >= -MPI) || (s <= MPI && e >= MPI)){
                box.env ( a.circle.center.x - a.circle.radius);
            }
            if(s <= MPI90 && e >= MPI90){
                box.env (undefined, a.circle.center.y + a.circle.radius)
            }
            if((s <= MPI270 && e >= MPI270) || (s <= -MPI90 && e >= -MPI90)){
                box.env (undefined, a.circle.center.y - a.circle.radius)
            }
            return box;
        },
        isEmpty : function(){
            if(this.start === this.end || this.circle.radius === 0){
                return true;
            }
            return false;
        },
        asCircle : function(){
            return this.circle.copy();
        },
        sweap : function (){
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;            
            if( s > e){
                s -= MPI2;
            }
            return (e-s);
        },
        arcLength : function (){  // returns the arc length of this arc
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;            
            if( s > e){
                s -= MPI2;
            }
            return (e-s); // returns a number
        },
        fromCircleIntercept : function(circle){
            var pa = this.circle.circleIntercept(circle);
            if(pa.vecs.length > 0){
                this.fromPoints(pa.vecs[0],pa.vecs[1]);
            }else{
                this.start = 0;
                this.end = 0;
            }
            return this; // returns this.
        },
        areaOfSector : function (){
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;            
            if( s > e){
                s -= MPI2;
            }
            return this.circle.radius * this.circle.radius * (e-s);
        },
        areaOfSegment : function (){
            var swap = false;
            var s  = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;            
            if( s > e){
                s -= MPI2;
            }
            var a = (e-s); // angle 
            if(a > MPI){
                a = MPI2-a;
                swap = true;
            }
            var p =  this.circle.radius * this.circle.radius * a; // area of the pie shape
            var c = Math.sin(a/2) * this.circle.radius; // lenght of half the cord;
            var d = Math.sqrt(this.circle.radius * this.circle.radius - c * c); // length of line from center to cord
            if(swap){
                return  (this.circle.radius * this.circle.radius * MPI2 ) - (p - c * d); // area is Pie area - triangle *2
            }else{
                return  p - c * d; // area is Pie area - triangle *2
            }
        },
        swap : function(){
            var s = this.start;
            this.start = this.end;
            this.end = s;
            return this; // returns this.
        },
        fromPoints : function(p1,p2,p3){
            if(p3 === undefined){
                this.start = this.circle.angleOfPoint(p1);
                this.end = this.circle.angleOfPoint(p2);
                return this; // returns this.
            }
            var a1 = ((this.circle.angleOfPoint(p1) % MPI2) + MPI2) % MPI2;
            var a2 = ((this.circle.angleOfPoint(p2) % MPI2) + MPI2) % MPI2;
            var a3 = ((this.circle.angleOfPoint(p3) % MPI2) + MPI2) % MPI2;
            this.start = Math.min(a1,a2,a3);
            this.end = Math.max(a1,a2,a3);
            return this;
        },
        setRadius : function (number){ // set the radius of this to the {anumber}
            this.circle.radius = number;
            return this; // returns this.
        },
        setCenter : function (vec){  // sets the center of this to the {avec}
            this.circle.center.x = vec.x;
            this.circle.center.y = vec.y;
            return this; // returns this.
        },
        setCircle : function (circle){  // set this.circle to the {acircle}
            this.circle.center.x = circle.center.x;
            this.circle.center.y = circle.center.y;
            this.circle.radius = circle.radius;
            return this; // returns this.
        },
        normalise : function(){ // Changes the start and end angle to within the range 0 - Math.PI * 2
            this.start = ((this.start % MPI2) + MPI2) % MPI2;
            this.end = ((this.end % MPI2) + MPI2) % MPI2;
            return this; // returns this.
        },
        towards : function(vec){ // Changes the arc if needed to bend towards the {avec}
            var a = ((this.circle.angleOfPoint(vec) % MPI2) + MPI2) % MPI2;
            var s = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if(s > e){
                s -= MPI2;
            }
            if(a > s && a < e){
                return this;
            }
            a -= MPI2;
            if(a > s && a < e){
                return this;
            }
            return this.swap(); // returns this.
        },
        away : function(vec){ // Changes the arc if needed to bend away from the {avec}
            var a = ((this.circle.angleOfPoint(vec) % MPI2) + MPI2) % MPI2;
            var s = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if(s > e){
                s -= MPI2;
            }
            if(a > s && a < e){
                return this.swap();
            }
            a -= MPI2;
            if(a > s && a < e){
                return this.swap();
            }
            return this; // returns this.
        },    
        endsAsVec : function() { 
            return new VecArray()
                .push(new Vec(this.circle.center.x + Math.cos(this.start) * this.circle.radius,this.circle.center.y + Math.sin(this.start) * this.circle.radius))
                .push(new Vec(this.circle.center.x + Math.cos(this.end) * this.circle.radius,this.circle.center.y + Math.sin(this.end) * this.circle.radius))
        },
        startAsVec : function() { 
            return new Vec(this.circle.center.x + Math.cos(this.start) * this.circle.radius,this.circle.center.y + Math.sin(this.start) * this.circle.radius);
        },
        endAsVec : function() { 
            return new Vec(this.circle.center.x + Math.cos(this.end) * this.circle.radius,this.circle.center.y + Math.sin(this.end) * this.circle.radius);
        },
        sweapLeng : function(){
            var s = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if(s > e){
                s -= MPI2;
            }            
            return Math.abs(e - s) * this.circle.radius;
        },
        setCircumference : function(leng){ 
            this.end = this.start  + (leng / (this.circle.radius ));
            return this; // returns this.
        },
        cordLeng : function(){
            return Math.hypot(
                (this.circle.center.x + Math.cos(this.start) * this.circle.radius) - (this.circle.center.x + Math.cos(this.end) * this.circle.radius),
                (this.circle.center.y + Math.sin(this.start) * this.circle.radius) - (this.circle.center.y + Math.sin(this.end) * this.circle.radius)
            );
        },
        cordAsLine : function(){
            if(this.start === this.end){
                return new Empty();
                
            }
            return new Line(
                new Vec(this.circle.center.x + Math.cos(this.start) * this.circle.radius,this.circle.center.y + Math.sin(this.start) * this.circle.radius),
                new Vec(this.circle.center.x + Math.cos(this.end) * this.circle.radius,this.circle.center.y + Math.sin(this.end) * this.circle.radius)
            );
        },
        great : function(){
            var s = ((this.start % MPI2) + MPI2) % MPI2;
            var e = ((this.end % MPI2) + MPI2) % MPI2;
            if(s > e){
                var ang = s - e;
                if(ang  < MPI){
                    this.start = s;
                    this.end = e;
                }else{
                    this.start = e;
                    this.end = s;
                }
            }else{
                var ang = e - s;
                if(ang  < MPI){
                    this.start = e;
                    this.end = s;
                }else{
                    this.start = s;
                    this.end = e;
                }
            }
            return this; // returns this.
        },
        minor : function(){
            this.great();
            var t = this.start;
            this.start = this.end;
            this.end = t;
            return this; // returns this.
        },
        isPointOn : function(p){
            var a = this.circle.angleOfPoint(p1);
            if(a >= this.start && a <= this.end){
                return true;
            }
            return false;
            
        },
        fromTangentsToPoint : function(vec){
            var tp = this.circle.tangentsPointsForPoint(vec);
            if(tp.vecs.length === 0){
                return this;
            }
            this.fromPoints(tp.vecs[0],tp.vecs[1]);
            
            return this;    // returns this.
        },
        roundCorner : function(l1,l2){
            this.circle.fitCorner(l1,l2);
            this.fromTangentsToPoint(l1.p2).towards(l1.p2);
            return this; // returns this.
        },
        scale : function(scale){
            this.circle.radius * scale;
            return this; // returns this
        },
        translate : function(vec){
            this.circle.center.translate(vec);
            return this; // returns this
        },
        rotate : function(rotation){
            this.start += rotation;
            this.end += rotation;
            return this; // returns this
        },
        transform : function(transform){
            return this; // returns this
        },
    }
    Circle.prototype = {
        center : undefined,
        radius : 0,
        type : "Circle",
        copy : function(){
            return new Circle(this.center.copy(),this.radius)
        },
        setAs : function (circle){  // Sets this circle to the argument {acircle}.
                                    // Return `this`
            this.center.setAs(circle.center);
            this.radius = circle.radius;
            return this;
        },
        asBox : function(box){     // Returns the bounding box 
                                   // {abox} is option
                                   // Returns `Box`
            if(box === undefined){
                var box = new Box();
            }
            box.env (this.center.x - this.radius,this.center.y - this.radius);
            box.env (this.center.x + this.radius,this.center.y + this.radius);
            return box;
        },
        isEmpty : function(){
            if(this.radius === 0){
                return true;
            }
            return false;
        },
        setRadius : function (r){
            this.radius = r;
            return this;
        },
        circumference : function(){
            return this.radius * Math.PI * 2;
        },
        area : function(){
            return this.radius * this.radius * Math.PI * 2;
        },
        fromLine : function (line){
            this.fromPoints2(line.midPoint(),line.p2);
            return this
        },
        fromPoints2 : function (vec1, vec2){
            this.center.x = vec1.x;
            this.center.y = vec1.y;
            this.radius = vec2.copy().sub(vec1).leng();
            return this;
        },
        fromPoints3 : function (vec1, vec2, vec3){
            var f1 = (vec2.x - vec1.x) / (vec1.y - vec2.y);
            var m1 = new Vec((vec1.x + vec2.x) / 2, (vec1.y + vec2.y) / 2);
            var g1 = m1.y - f1 * m1.x;
            var f2 = (vec3.x - vec2.x) / (vec2.y - vec3.y);
            var m2 = new Vec((vec2.x + vec3.x) / 2, (vec2.y + vec3.y) / 2);
            var g2 = m2.y - f2 * m2.x;

            if (f1 == f2)  {
                return false;  // points are in a line 
            }else 
            if(a.y == vec2.y){
                this.center = new Vec(m1.x, f2 * m1.x + g2);  
            }else
            if(vec2.y == vec3.y){
                this.center = new Vec(m2.x, f1*m2.x + g1);
            } else{
                var x = (g2-g1) / (f1 - f2);
                this.center = new Vec(x, f1*x + g1);
            }

            this.radius = vec1.copy().sub(this.center).leng();
            return this;
        },
        fromArea : function(area){
            this.radius = Math.sqrt(area / (Math.PI * 2));
        },
        fromCircumference  : function(leng){
            this.radius = leng / (Math.PI * 2);
        },
        touching : function(circle){
            if(this.center.copy().sub(circle.center).leng() > this.radius + circle.radius){
                return false;
            }
            return true;
        },
        touchingLine : function(l){
            if(l.distFrom(this.center) > this.radius){
                return false
            }
            return true;
        },
        isRectangleInside : function(rectangle){
            var inside = true;
            var me = this;
            rectangle.getCorners().each(function(vec){
               return (inside = me.isPointInside(vec));
            });
            return inside;
        },
        isCircleInside : function(circle){
            return (this.distFrom(circle.center) + circle.radius < 0);
        },
        isLineInside : function(line){
            return (this.isPointInside(line.p1) && this.isPointInside(line.p2) );;
        },
        isPointInside : function(vec){
            return  this.center.distFrom(vec) < this.radius;
        },
        distFrom : function(vec){
            return  this.center.distFrom(vec)-this.radius;
        },
        closestPoint : function(vec){
            return  vec.copy().sub(this.center).setLeng(this.radius).add(this.center);
        },
        lineSegInside : function(line){
            var pa = this.lineIntercept(line);
            if(pa.vecs.length > 0){
                return line.copy().sliceToPoints(pa.vecs[0],pa.vecs[1]);
            }
            return line.createEmpty();
        },
        lineSegIntercept : function(l){
            var va = new VecArray();
            var d =  l.distFrom(this.center); // dist from line
            if(d <= this.radius){
                var p = l.closestPoint(this.center);  // closest point on line
                var d1 = Math.sqrt(this.radius*this.radius- d*d);
                var v1 = l.asVec().setLeng(d1);
                var v2 = p.copy().sub(v1);
                var pos = line.getUnitDistOfPoint(v2);
                if(pos >= 0 && pos <= 1){
                    va.push(v2)
                }
                v2 = p.copy().add(v1);
                pos = line.getUnitDistOfPoint(v2);
                if(pos >= 0 && pos <= 1){
                    va.push(v2)
                }
                return va;
            }
            return va;
        },
        lineIntercept : function(l){
            var va = new VecArray();
            var d =  l.distFrom(this.center); // dist from line
            if(d <= this.radius){
                var p = l.closestPoint(this.center);  // closest point on line
                var d1 = Math.sqrt(this.radius*this.radius- d*d);
                var v1 = l.asVec().setLeng(d1);
                return va.push(p.copy().sub(v1)).push(p.add(v1));
            }
            return va;
        },
        circleIntercept : function(circle){
            var va = new VecArray();
            var l = circle.center.copy().sub(this.center);
            var d = l.leng();
            if(d > this.radius + circle.radius || d < Math.abs(this.radius - circle.radius)){
                return va;
            }

            var x = (d * d - this.radius * this.radius + circle.radius * circle.radius) / ( 2 * d);
            var a = Math.sqrt(circle.radius*circle.radius - x * x);
            l.setLeng(x);

            var mid = circle.center.copy().sub(l);
            l.r90().setLeng(a);
            va.push(mid.copy().add(l))
            va.push(mid.sub(l));      

            return va
        },
        tangentAtPoint : function(p){
            var l = p.copy().sub(this.center);
            var at = l.copy().setLeng(this.radius).add(this.center);
            l.r90();
            return new Line(at,at.copy().add(l));
        },
        angleOfPoint : function(p){
            return p.copy().sub(this.center).dir();
        },
        tangentsPointsForPoint : function(vec){  // finds where on the circle the tangents are for the point vec. In valid if point is inside the circle
            var va = new VecArray();
            var d = this.center.distFrom(vec);
            if(d <= this.radius){  // point is inside so no tangents exist
                return va;  
            }
            var a = Math.acos(this.radius / d);
            var a1 = this.center.angleTo(vec);
            return va
                .push(new Vec(null,a1-a).mult(this.radius).add(this.center))
                .push(new Vec(null,a1+a).mult(this.radius).add(this.center))
        },
        reflectLine : function(line){ // WTF sorry will fix in time
            var va = new VecArray();
            var pa = this.lineIntercept(line);
            if(pa.vecs.length > 0){
                return va
                    .push(this.tangentAtPoint(pa.vecs[0]).reflectLine(line))
                    .push(this.tangentAtPoint(pa.vecs[1]).reflectLine(line))
                
                
            }
            return va;
        },
        /*refractLine : function(line,n1,n2){
            var p = this.lineIntercept(line);
            if(p.length > 0){
                return [
                    this.tangentAtPoint(p[0]).refractLine(line,n1,n2),
                    this.tangentAtPoint(p[1]).refractLine(line,n1,n2)
                ]
                
            }
            return [];
        },*/
        fitCorner : function(l1,l2){
            var v1 = l1.asVec().rev();
            var v2 = l2.asVec();
            var v3 = v1.mid(v2);
            var angle = v3.angleBetween(v2);
            var d = this.radius / Math.sin(angle);
            
            this.center.setAs(v3.norm().mult(d).add(l2.p1));
            return this;
        },    
        scale : function(scale){
            this.radius * scale;
            return this; // returns this
        },
        translate : function(vec){
            this.center.translate(vec);
            return this; // returns this
        },
        rotate : function(rotation){
            return this; // returns this
        },
        transform : function(transform){
            return this; // returns this
        },
          
    }
    Line.prototype = {
        p1 : undefined,
        p2 : undefined,
        type : "Line",      
        _leng : null,
        _dir : null,
        
        copy : function(){
            return new Line(this.p1.copy(),this.p2.copy());
        },
        setAs : function(line){
            this.p1.x = line.p1.x;
            this.p1.y = line.p1.y;
            this.p2.x = line.p2.x;
            this.p2.y = line.p2.y;
            return this;
        },
        isEmpty : function(){ // line is empty if either points are undefined or the length is 0 or any point has Infinity or any point has NaN
            var t;
            if(this.p1 === undefined ||  this.p2 === undefined || 
                    ((this.p1.x - this.p2.x) === 0 &&  (this.p1.y - this.p2.y) === 0) ||
                    (t = Math.abs(this.p1.x + this.p1.y + this.p2.x + this.p2.y)) === Infinity ||
                    isNaN(t)){
                return true;
            }
            return false;
        },
        createEmpty : function (){
            return new Line(this.p1.copy(),this.p1.copy());
        },
        toString : function (precision){
            if(precision === undefined || precision === null){
                precision = 6;
            }
            return "Line: ("+this.p1.toString(precision)+"-"+this.p2.toString(precision)+")";
        },
        swap : function(){
            var t = this.p1;
            this.p1 = this.p2;
            this.p2 = t;
            return this;  // returns this
        },
        reverse : function(){
            return this.swap(); // returns this.
        },
        asVec : function(){
            return new Vec(this.p1,this.p2);
        },
        _asVec : function(){  // do not use, experimental code
            var v = regv[(regvSP ++)%REGS_LEN]; // get next reg vec
            v.x = this.p2.x - this.p1.x
            v.y = this.p2.y - this.p1.y
            return v;
        },
        _asVec1 : function(){ // do not use, experimental code
            vr1.x = this.p2.x - this.p1.x
            vr1.y = this.p2.y - this.p1.y
            return vr1;
        },
        _asVec2 : function(){ // do not use, experimental code
            vr2.x = this.p2.x - this.p1.x
            vr2.y = this.p2.y - this.p1.y
            return vr2;
        },
        asVecArray : function(){
            return new VecArray().push(this.p1.copy()).push(this.p2.copy());
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.p1.x, this.p1.y);
            box.env ( this.p2.x, this.p2.y);
            return box;
        },
        asCircle : function(circle){ // creates a circle the bounds this line/ {ocircle) if supplied is set to the circle else a new circle is created
            if(circle === undefined){
                circle = new Circle();
            }
            circle.center.x = (this.p1.x + this.p2.x)/2;
            circle.center.y = (this.p1.y + this.p2.y)/2;
            circle.radius = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y) / 2;
            return circle;            
        },
        isVecLeft : function(vec){ // Is the {avec} to the left of this line. Left is left of screen when looking at it and the line moves down.
            if((this.p2.x - this.p1.x) * (vec.y - this.p1.y) - (this.p2.y - this.p1.y) * (vec.x - this.p1.x) < 0){
                return true;
            }
            return false;
        },
        isLineLeft : function(line){ // Is the {aline} to the left of this line. Left is left of screen when looking at it and the line moves down.
            var v = this._asVec1();
            v1.x = line.p1.x - this.p1.x;
            v1.y = line.p1.y - this.p1.y;
            var v1 = line.p1.copy().sub(this.p1);
            if(v.x * v1.y - v.y * v1.y < 0){
                v1.x = line.p2.x - this.p1.x;
                v1.y = line.p2.y - this.p1.y;
                if(v.x * v1.y - v.y * v1.y < 0){
                    return true;
                }
            }
            return false; // returns boolean 
        },
        isCircleLeft : function(circle){ // is the circle {acircle} left of this line. Left is left of screen when line moves from top to bottom
            if(this.isVecLeft(circle.center)){
                if(this.distFrom(circle.center) > circle.radius){
                    return true;
                }
            }
            return false; // returns boolean 
        },
        leng : function(){
            return Math.hypot(this.p2.y-this.p1.y,this.p2.x-this.p1.x);
        },
        dir : function(){
            return Math.atan2(this.p2.y-this.p1.y,this.p2.x-this.p1.x);
        },
        extend : function(percentage){  // grows or shrinks the linetowards or away from its center
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = (Math.hypot(v1.x,v1,y) * 2) / percentage;
            v1.x /= l;
            v1.y /= l;
            this.p1.x -= v1.x;
            this.p1.y -= v1.y;
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this; // returns this.
        },
        setLeng : function(len){
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = Math.hypot(v1.x,v1,y);
            this.p2.x = this.p1.x + v1.x * len / l;
            this.p2.y = this.p1.y + v1.y * len / l;
            return this; // returns this.
        },
        setDir : function(num){
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = Math.hypot(v1.x,v1,y);
            v1.x = Math.cos(num) * l;
            v1.y = Math.sin(num) * l;            
            this.p2.x = this.p1.x + v1.x;
            this.p2.y = this.p1.y + v1.y;
            return this; // returns this.
        },
        cross : function(){
            return this.p1.x * this.p2.y - this.p1.y * this.p2.x;            
        },
        crossBack : function(){
            return this.p2.x * this.p1.y - this.p2.y * this.p1.x;            
        },
        mult : function(num){
            this.p1.x *= num;
            this.p1.y *= num;
            this.p2.x *= num;
            this.p2.y *= num;
            return this; // returns this.
        },
        add : function(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            return this; // returns this.
        },
        translate : function(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            return this; // returns this.
        },
        rotate : function(num){
            var xdx = Math.cos(num);
            var xdy = Math.sin(num);
            var x = this.p1.x * xdx + this.p1.y * - xdy;
            var y = this.p1.x * xdy + this.p1.y *  xdx;
            this.p1.x = x;
            this.p1.y = y;
            var x = this.p2.x * xdx + this.p2.y * - xdy;
            var y = this.p2.x * xdy + this.p2.y *  xdx;
            this.p2.x = x;
            this.p2.y = y;
            return this; // returns this.
        },
        scale : function(num){
            this.p1.x *= num;
            this.p1.y *= num;
            this.p2.x *= num;
            this.p2.y *= num;
            return this; // returns this.
        },
        midPoint : function(rVec){
            if(rVec === undefined){
                return new Vec((this.p1.x + this.p2.x)/2,(this.p1.y + this.p2.y)/2);                
            }
            rVec.x = (this.p1.x + this.p2.x)/2;
            rVec.y = (this.p1.y + this.p2.y)/2;
            return rVec;
            
        },
        unitAlong : function ( unitDist , rVec){ // returns a Vec unitDist (0 is start 1 is end) along the line 
            if(rVec === undefined){
                return new Vec(
                    (this.p2.x - this.p1.x) * unitDist + this.p1.x,
                    (this.p2.y - this.p1.y) * unitDist + this.p1.y
                );
            }
            rVec.x = (this.p2.x - this.p1.x) * unitDist + this.p1.x;
            rvec.y = (this.p2.y - this.p1.y) * unitDist + this.p1.y;
            return rVec;
        },
        distanceAlong : function ( dist, rVec) { // returns a Vec that is dist along the line 0 = start and line length is the end
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            var l = dist / Math.hypot(v1.x,v1,y);
            if(rVec === undefined){
                return new Vec(
                    v1.x * l + this.p1.x,
                    v1.y * l + this.p1.y
                );
            }
            rVec.x = v1.x * l + this.p1.x;
            rvec.y = v1.y * l + this.p1.y;
            return rVec;
        },
        angleBetween : function (line){
            var la, lb;            
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            
            la = Math.hypot(v1.x,v1.y);
            lb = Math.hypot(v2.x,v2.y);
            return Math.asin ((v1.x / la) * (v2.y / lb) - (v1.y / la) * (v2.x / lb));
            
        },
        angleFromNormal : function (line){
            var la, lb;            
            v1.x = -(this.p2.y - this.p1.y);
            v1.y = this.p2.x - this.p1.x;
            v2.x = line.p2.x - line.p1.x;
            v2.y = line.p2.y - line.p1.y;
            
            la = Math.hypot(v1.x,v1.y);
            lb = Math.hypot(v2.x,v2.y);
            return Math.asin ((v1.x / la) * (v2.y / lb) - (v1.y / la) * (v2.x / lb));
        },
        setTransformToLine :function(ctx){
            var l;
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = l = Math.hypot(v1.y,v1.x);
            v1.x /= l;
            v1.y /= l;
            ctx.setTransform(v1.x, v1.y, -v1.y, v1.x, this.p1.x, this.p1.y)
            return this;  // returns this.
        },
        sliceOffEnd : function ( line ){
            var p = this.intercept(line);
            var u = this.getUnitDistOfPoint(p);
            if(u > 0 && u < 1){
                var u1 = line.getUnitDistOfPoint(p);
                if(u1 >= 0 && u1 <= 1){
                    this.p2 = p;
                }
            }
            return this;  // returns this.
        },
        sliceOffStart : function ( line ){
            var p = this.intercept(line);
            var u = this.getUnitDistOfPoint(p);
            if(u > 0 && u < 1){
                var u1 = line.getUnitDistOfPoint(p);
                if(u1 >= 0 && u1 <= 1){
                    this.p1 = p;
                }
            }
            return this; // returns this.
        },
        sliceToPoints : function (p1,p2){
            var pp1 = this.closestPoint(p1);
            var pp2 = this.closestPoint(p2);
            var u = this.getUnitDistOfPoint(pp1);
            var u1 = this.getUnitDistOfPoint(pp2);
            if(u1 < u){
                var t = pp1;
                pp2 = pp1;
                pp1 = t;
                t = u;
                u = u1;
                u1 = t;
            }
            if((u <= 0 && u1 < 0) || (u > 1 && u1 > 1)){
                this.p2 = this.p1.copy();
                return this;
            }
            if(u >= 0 && u <= 1){
                this.p1 = pp1;
            }
            if(u1 >= 0 && u1 <= 1){
                this.p2 = pp2;
            }
            return this; // returns this.
                
        },
        intercept : function(line,rVec){  // find the point of intercept between this line and {aline}
            v1.x = this.p1.x - this.p2.x;
            v1.y = this.p1.y - this.p2.y;
            v2.x = line.p1.x - line.p2.x;
            v2.y = line.p1.y - line.p2.y;
            var c = v1.x * v2.y - v1.y * v2.x;
            v3.x = this.p1.x * this.p2.y - this.p1.y * this.p2.x;
            v3.y = line.p1.x * line.p2.y - line.p1.y * line.p2.x;
            if(rVec === undefined){
                rVec = new Vec();
            }
            rVec.x = (v3.x * v2.x - v3.y * v1.x) / c;
            rVec.y = (v3.x * v2.y - v3.y * v1.y) / c;
            return rVec;
        },
        interceptSeg : function(line,rVec){ // find the point of intercept between this line segment  and {aline}
            v1.x = this.p1.x - this.p2.x;
            v1.y = this.p1.y - this.p2.y;
            v2.x = line.p1.x - line.p2.x;
            v2.y = line.p1.y - line.p2.y;
            var c = v1.x * v2.y - v1.y * v2.x;
            v3.x = this.p1.x * this.p2.y - this.p1.y * this.p2.x;
            v3.y = line.p1.x * line.p2.y - line.p1.y * line.p2.x;
            if(rVec === undefined){
                rVec = new Vec();
            }
            rVec.x = (v3.x * v2.x - v3.y * v1.x) / c;
            rVec.y = (v3.x * v2.y - v3.y * v1.y) / c;
            var l = Math.hypot(v1.x,v1.y);
            if ((this._leng = Math.hypot(rVec.y - this.p1.y, rVec.x - this.p1.x)) / l <= 1) {
                if (Math.hypot(rVec.y - this.p2.y, rVec.x - this.p2.x) / l <= 1){
                    return rVec;
                }
            }
            rVec.p1 = undefined;
            rVec.p2 = undefined;
            return rVec;        

        },
        interceptSegsE : function(line,rVec){ // find the point of intercept between this line segment and and the {aline} as a line segment
            var ll;
            v1.x = this.p1.x - this.p2.x;
            v1.y = this.p1.y - this.p2.y;
            v2.x = line.p1.x - line.p2.x;
            v2.y = line.p1.y - line.p2.y;
            var c = v1.x * v2.y - v1.y * v2.x;
            v3.x = this.p1.x * this.p2.y - this.p1.y * this.p2.x;
            v3.y = line.p1.x * line.p2.y - line.p1.y * line.p2.x;
            if(rVec === undefined){
                rVec = new Vec();
            }
            rVec.x = (v3.x * v2.x - v3.y * v1.x) / c;
            rVec.y = (v3.x * v2.y - v3.y * v1.y) / c;
            var l = Math.hypot(v1.x,v1.y);
            if ( (ll = (this._leng = Math.hypot(rVec.y - this.p1.y, rVec.x - this.p1.x)) / l) <= EPSILON1 && ll >= EPSILON) {
                if (Math.hypot(rVec.y - this.p2.y, rVec.x - this.p2.x) / l < 1){
                    l = Math.hypot(v2.x,v2.y);
                    if ( (ll = (line._leng = Math.hypot(rVec.y - line.p1.y, rVec.x - line.p1.x)) / l) <= EPSILON1 && ll >= EPSILON) {
                        if (Math.hypot(rVec.y - line.p2.y, rVec.x - line.p2.x) / l < 1){
                            return rVec;
                        }
                    }
                }
            }
            rVec.p1 = undefined;
            rVec.p2 = undefined;

            return rVec;              
        },
        interceptSegs : function(line,rVec){ // find the point of intercept between this line segment and and the {aline} as a line segment
            var ll;
            v1.x = this.p1.x - this.p2.x;
            v1.y = this.p1.y - this.p2.y;
            v2.x = line.p1.x - line.p2.x;
            v2.y = line.p1.y - line.p2.y;
            var c = v1.x * v2.y - v1.y * v2.x;
            v3.x = this.p1.x * this.p2.y - this.p1.y * this.p2.x;
            v3.y = line.p1.x * line.p2.y - line.p1.y * line.p2.x;
            if(rVec === undefined){
                rVec = new Vec();
            }
            rVec.x = (v3.x * v2.x - v3.y * v1.x) / c;
            rVec.y = (v3.x * v2.y - v3.y * v1.y) / c;
            var l = Math.hypot(v1.x,v1.y);
            if ( (this._leng = Math.hypot(rVec.y - this.p1.y, rVec.x - this.p1.x)) / l <= 1) {
                if (Math.hypot(rVec.y - this.p2.y, rVec.x - this.p2.x) / l <= 1){
                    l = Math.hypot(v2.x,v2.y);
                    if ( (line._leng = Math.hypot(rVec.y - line.p1.y, rVec.x - line.p1.x) )/ l <= 1) {
                        if (Math.hypot(rVec.y - line.p2.y, rVec.x - line.p2.x) / l <= 1){
                            return rVec;
                        }
                    }
                }
            }
            rVec.p1 = undefined;
            rVec.p2 = undefined;

            return rVec;  
         
        },
        isLineSegIntercepting : function(line){ // Returns true if the {aline} intercepts this line segment
                                                // if returns true then v4 is intercept, and _leng is the dist from start for line and this line
 
            v1.x = this.p1.x - this.p2.x;
            v1.y = this.p1.y - this.p2.y;
            v2.x = line.p1.x - line.p2.x;
            v2.y = line.p1.y - line.p2.y;
            var c = v1.x * v2.y - v1.y * v2.x;
            v3.x = this.p1.x * this.p2.y - this.p1.y * this.p2.x;
            v3.y = line.p1.x * line.p2.y - line.p1.y * line.p2.x;

            v4.x = (v3.x * v2.x - v3.y * v1.x) / c;
            v4.y = (v3.x * v2.y - v3.y * v1.y) / c;

            var l = Math.hypot(v1.x,v1.y);
            if ( (this._leng = Math.hypot(v4.y - this.p1.y, v4.x - this.p1.x)) / l <= 1) {
                if (Math.hypot(v4.y - this.p2.y, v4.x - this.p2.x) / l <= 1){
                    l = Math.hypot(v2.x,v2.y);
                    if ( (line._leng = Math.hypot(v4.y - line.p1.y, v4.x - line.p1.x) )/ l <= 1) {
                        if (Math.hypot(v4.y - line.p2.y, v4.x - line.p2.x) / l <= 1){
                            return true;
                        }
                    }
                }
            }
            return false;  
        },
        distFrom : function(p){
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = l = Math.hypot(v1.y,v1.x);
            v2.x = p.x - this.p1.x;
            v2.y = p.y - this.p1.y;
            l = (v2.x * v1.x + v2.y * v1.y)/(l * l);
            v3.x = v1.x * l - v2.x;
            v3.y = v1.y * l - v2.y;
            return Math.hypot(v3.y,v3.x);
        },
        distFromDir : function(p){ // 
            var d = this.distFrom(p);
            // WARNING this is using optimisation vars in distFrom
            v1.x /= this._leng;
            v1.y /= this._leng;
            var l = Math.hypot(v2.x,v2.y);
            v2.x /= l;
            v2.y /= l;
            this._leng = la = Math.hypot(this.x,this.y);
            p._leng = lb = Math.hypot(p.x,p.y);
            if(v1.x * v2.y - v1.y * v2.x >= 0 ){
                return d;
            }
            return -d;
        },
        lineTo : function(p, rLine){  // returns the line from vec p to the closest point on the line
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = l = Math.hypot(v1.y,v1.x);
            v2.x = p.x - this.p1.x;
            v2.y = p.y - this.p1.y;
            l = (v2.x * v1.x + v2.y * v1.y)/(l * l);
            if(rLine === undefined){
                return new Line(
                    p.copy(),
                    new Vec(
                        v1.x * l + this.p1.x,
                        v1.y * l + this.p1.y
                    )
                )
            }
            rLine.p1.x = p.x;
            rLine.p1.y = p.y;
            rLine.p2.x = v1.x * l + this.p1.x;
            rLine.p2.y = v1.y * l + this.p1.y;
            return rLine;
        },
        getDistOfPoint : function(vec){ // returns the distance of a point on the line from the start. If the point is not on the line then the distance is the distance with the line roated to align to the point.
                                        // Use getDistOfPointSafe if the distance needs to be without the rotation. Ie the cosine(angle between point and line) * distance to point
            var l = Math.hypot(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            var la = Math.hypot(vec.y - this.p1.y, vec.x - this.p1.x);
            var lb = Math.hypot(vec.y - this.p2.y, vec.x - this.p2.x);
            if ((la <= l && lb <= l) || la > lb) {
                return la;
            }
            return -la;
        },
        getUnitDistOfPoint : function(vec){ // returns the unit distance of a point on the line from the start. If the point is not on the line then the distance is the distance with the line roated to align to the point.
                                        // Use getDistOfPointSafe if the distance needs to be without the rotation. Ie the cosine(angle between point and line) * distance to point
            var l = Math.hypot(this.p2.y - this.p1.y, this.p2.x - this.p1.x);
            var la = Math.hypot(vec.y - this.p1.y, vec.x - this.p1.x) / l;
            var lb = Math.hypot(vec.y - this.p2.y, vec.x - this.p2.x) / l;
            if ((la <= 1 && lb <= 1) || la > lb) {
                return la;
            }
            return -la;
        },
        getDistOfPointSafe : function(vec){ // returns the unit distance of a point on the line from the start. 
            this.closestPoint(vec,v3);
            // WARNING uses results and optimisations vars from closestPoint
            var la = Math.hypot(v3.y - this.p1.y, v3.x - this.p1.x);
            var lb = Math.hypot(v3.y - this.p2.y, v3.x - this.p2.x);
            if ((la <= this._leng && lb <= this._leng) || la > lb) {
                return la;
            }
            return -la;
        },
        getUnitDistOfPointSafe : function(vec){ // returns the unit distance of a point on the line from the start. 
            this.closestPoint(vec,v3);
            // WARNING uses results and optimisations vars from closestPoint
            var la = Math.hypot(v3.y - this.p1.y, v3.x - this.p1.x) / this._leng;
            var lb = Math.hypot(v3.y - this.p2.y, v3.x - this.p2.x) / this._leng;
            if ((la <= 1 && lb <= 1) || la > lb) {
                return la;
            }
            return -la;
        },    
        closestPoint : function(vec, rVec){
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = l = Math.hypot(v1.y,v1.x);
            v2.x = p.x - this.p1.x;
            v2.y = p.y - this.p1.y;
            l = (v2.x * v1.x + v2.y * v1.y)/(l * l);
            if(rVec === undefined){
                return new Vec(
                    v1.x * l + this.p1.x,
                    v1.y * l + this.p1.y
                );
                
            }
            rVec.x = v1.x * l + this.p1.x;
            rVec.y = v1.y * l + this.p1.y;
            return rVec;

        },
        /*refractLine : function(line,n1,n2){ // error in logic. do not use
            n1 = 1.2
            var p1 = this.intercept(line);
            var l  = Math.hypot(line.p2.y-line.p1.y,line.p2.x-line.p1.x);
            var a  = Math.atan2(this.p2.y-this.p1.y,this.p2.x-this.p1.x);
            var a1 = this.asVec().crossNorm(line.asVec().rev());
            var a2 = Math.asin((n1 * a1)/n2);
            return new Line(p1,new Vec(null,a-MPI+a2).mult(l).add(p1));
        },*/
        reflect : function(l){
            var v2 = this.asVec();
            var v1 = l.asVec();
            var len = v1.dot(v2.norm())*2;
            return v2.mult(len).sub(v1)
        },
        reflectLine : function(l){
            var p1 = this.intercept(l);
            return new Line(p1,p1.copy().add(this.reflect(l)));
        },
        mirrorLine : function(line){
            var p1 = this.closestPoint(line.p1);
            var p2 = this.closestPoint(line.p2);
            
            p1.x -=  (line.p1.x - p1.x);
            p1.y -=  (line.p1.y - p1.y);
            p2.x -=  (line.p2.x - p2.x);
            p2.y -=  (line.p2.y - p2.y);
            return new Line(p1,p2);
        },
        centerOnStart : function(){
            var v1 = this.asVec().half();
            this.p2 = this.p1.copy().add(v1)
            this.p1.sub(v1);
            return this; // returns this.
        },
        midLine : function(l1){ // this is bad must find a better way
            var len;
            var p = this.intercept(l1);
            var v1 = l1.asVec().setLeng(len = this.leng());
            var v1 = l1.asVec().setLeng(len = 100);
            var v2 = this.asVec().setLeng(len);
            v1  = p.copy().add(v1);
            v2 = p.copy().sub(v2);
            var v3 = v1.copy().sub(v2).half().add(v2);
            return new Line(p, p.copy().add(v3.sub(p).setLeng(len)));
            
        },
        scale : function(scale){
            this.p1.x *= scale;
            this.p1.y *= scale;
            this.p2.x *= scale;
            this.p2.y *= scale;
            return this; // returns this
        },
        translate : function(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            return this; // returns this
        },
        rotate : function(rotation){
            var dx = Math.cos(rotation);
            var dy = Math.sin(rotation);
            var x = this.p1.x;
            var y = this.p1.y;
            this.p1.x = x * dx + y * -dy;
            this.p1.y = x * dy + y * dx;
            x = this.p2.x;
            y = this.p2.y;
            this.p2.x = x * dx + y * -dy;
            this.p2.y = x * dy + y * dx;         
            return this; // returns this
        },
        transform : function(transform){
            return this; // returns this
        },
    }
    Rectangle.prototype = {
        top : undefined,
        aspect : 1,
        type : "Rectangle",
        _width : 0,
        _height : 0,
        copy : function () {
            return new Rectangle(this.top.copy(),this.aspect);
        },
        setAs : function(rectange){
            this.top.setAs(rectange.top);
            this.aspect = rectange.aspect;
            return this; // returns this.
        },
        isEmpty : function(){
            if(this.aspect <= 0 || Math.hypot(this.top.p1.x - this.top.p2.x,this.top.p1.y - this.top.p2.y) < EPSILON){
                return true;
            }
            return false;
        },
        width : function (){
            return  Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x);
        },
        height : function () {
            return Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x) * this.aspect;
        },
        aspect : function (){
            return this.aspect;
        },
        setWidth : function (num){
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            var l = Math.hypot(v1.x,v1,y);
            this.top.p2.x = this.top.p1.x + v1.x * num / l;
            this.top.p2.y = this.top.p1.y + v1.y * num / l;            
            this.aspect = (l * this.aspect) / num;
            return this;
        },
        setHeight : function (num){
            this.aspect = num / Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x)
            return this;
        },
        topLine : function(line){
            if(line === undefined){
                return this.top.copy();
            }
            line.p1.x = this.top.p1.x;
            line.p1.y = this.top.p1.y;
            line.p2.x = this.top.p2.x;
            line.p2.y = this.top.p2.y;
            return line;
        },
        leftLine : function(line){
            if(line === undefined){
                line = new Line();
            }
            line.p2.x = this.top.p1.x;
            line.p2.y = this.top.p1.y;
            line.p1.x = line.p2.x - (this.top.p2.y - this.top.p1.y) * this.aspect;
            line.p1.y = line.p2.y + (this.top.p2.x - this.top.p1.x) * this.aspect;
            return line;
        },
        rightLine : function(line){
            if(line === undefined){
                line = new Line();
            }
            line.p1.x = this.top.p2.x;
            line.p1.y = this.top.p2.y;
            line.p2.x = line.p1.x - (this.top.p2.y - this.top.p1.y) * this.aspect;
            line.p2.y = line.p1.y + (this.top.p2.x - this.top.p1.x) * this.aspect;
            return line;
        },
        bottomLine : function(line){
            if(line === undefined){
                line = new Line();
            }
            line.p1.x = this.top.p2.x - (v1.y = this.top.p2.y - this.top.p1.y) * this.aspect;
            line.p1.y = this.top.p2.y + (v1.x = this.top.p2.x - this.top.p1.x) * this.aspect;
            line.p2.x = line.p1.x - v1.x;
            line.p2.y = line.p1.y - v1.y;            
            return line;
        },
        corners : function () {
            var v = this.top.asVec().r90().mult(this.aspect);
            var vecA = new VecArray();
            vecA.push(this.top.p1.copy());
            vecA.push(this.top.p2.copy());
            vecA.push(this.top.p2.copy().add(v));
            vecA.push(this.top.p1.copy().add(v));
            return vecA;
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.top.p1.x, this.top.p1.y);
            box.env ( this.top.p2.x, this.top.p2.y);
            var v = this.top.asVec().r90().mult(this.aspect);
            box.env ( this.top.p1.x + v.x, this.top.p1.y + v.y);
            box.env ( this.top.p2.x + v.x, this.top.p2.y + v.y);
            return box;
        },
        asCircle : function(circle){
            var l;
            if(circle === undefined){
                circle = new Circle();
            }
            circle.center.x = this.top.p1.x;
            circle.center.y = this.top.p1.y;
            circle.center.x += (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            circle.center.y += (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            circle.center.x += -v1.y * this.aspect;
            circle.center.y += v1.x * this.aspect;
            l = Math.hypot(v1.x,v1.y);
            circle.radius = Math.hypot(l,l * this.aspect);
            return circle;            
        },
        asInnerCircle : function(circle){
            var l;
            if(circle === undefined){
                circle = new Circle();
            }
            circle.center.x = this.top.p1.x;
            circle.center.y = this.top.p1.y;
            circle.center.x += (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            circle.center.y += (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            circle.center.x += -v1.y * this.aspect;
            circle.center.y += v1.x * this.aspect;
            l = Math.hypot(v1.x,v1.y);
            circle.radius = Math.min(l,l * this.aspect);
            return circle;            
        },
        slice : function (x, y, rect){
                // uses v1,v2,v3,v4
            var lw,lh;
            if(rect === undefined){
                rect = new Rectangle();
            }
            
            
            
            x = x < EPSILON ? 0 : x > EPSILON1 ? 1 : x;
            y = y < EPSILON ? 0 : y > EPSILON1 ? 1 : y;
            if(x === 0 && y === 0){
                rect.top.p1.x = this.top.p1.x;
                rect.top.p1.y = this.top.p1.y;
                rect.top.p2.x = this.top.p2.x;
                rect.top.p2.y = this.top.p2.y;
                rect.aspect = this.aspect;
                return rect;
            }
            if(x === 1 || y === 1){
                v3.x = x;
                v3.y = y;
                rect.top.p1.setAs(this.pointAt(v3,v4));
                rect.top.p2.setAs(rect.top.p1);
                rect.aspect = 0;
                return rect;
            }

            //Get top vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            // Get top length (width)
            lw = Math.hypot(v1.x,v1.y);
            lh = lw * this.aspect
            v1.x /= lw;
            v1.y /= lw;
            rect.top.p2.x = rect.top.p1.x = this.top.p1.x + v1.x * lw * x - v1.y * lh * y;
            rect.top.p2.y = rect.top.p1.y = this.top.p1.y + v1.y * lw * x + v1.x * lh * y;
            rect.top.p2.x += v1.x * lw * (1 - x);
            rect.top.p2.y += v1.y * lw * (1 - x); 
            rect.aspect = (lh * (1 - y)) / (lw * (1 - x)) ;
            return rect;
                     
        },
        asArc : function(where,radius,arc){
            var lw,lh,a,r,b;
            where = where.toLowerCase();
            if(arc === undefined){
                arc = new Arc();
            }

            //Get top vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            // Get top length (width)
            lw = (l = Math.hypot(v1.x,v1.y)) / 2;
            lh = lw * this.aspect;
            // get top direction
            a = Math.dir(v1.x,v1.y);
            // normalise
            r = l ;
            b = lh * 2 ;
            
            v1.x /= l;
            v1.y /= l;
            
            l = Math.min(lw,lh);
            if(radius === undefined || radius === null){
                radius = l;
            }
            // for request get the arc
            if(where.indexOf("cap") > -1){
                if(where.indexOf("top") > -1){
                    arc.circle.radius = lw;
                    arc.circle.center.x = this.top.p1.x + v1.x * lw;
                    arc.circle.center.y = this.top.p1.y + v1.y * lw;
                    arc.start = a + MPI;
                    arc.end = arc.start + MPI;
                    return arc;
                }
                if(where.indexOf("bot") > -1){
                    arc.circle.radius = lw;
                    arc.circle.center.x = this.top.p1.x + v1.x * lw - v1.y * b;
                    arc.circle.center.y = this.top.p1.y + v1.y * lw + v1.x * b;
                    arc.start = a;
                    arc.end = arc.start + MPI;
                    return arc;
                }
                if(where.indexOf("left") > -1){
                    arc.circle.radius = lh;
                    arc.circle.center.x = this.top.p1.x - v1.y * lh;
                    arc.circle.center.y = this.top.p1.y + v1.x * lh;
                    arc.start = a + MPI90;
                    arc.end = arc.start + MPI;
                    return arc;
                }
                if(where.indexOf("right") > -1){
                    arc.circle.radius = lh;
                    arc.circle.center.x = this.top.p2.x - v1.y * lh;
                    arc.circle.center.y = this.top.p2.y + v1.x * lh;
                    arc.start = a + MPI270;
                    arc.end = arc.start + MPI;
                    return arc;
                }
            }
            if(where.indexOf("inner") > -1){
                if(where.indexOf("top") > -1){
                    if(where.indexOf("left") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * radius - v1.y * radius;
                        arc.circle.center.y = this.top.p1.y + v1.y * radius + v1.x * radius;
                        arc.start = a + MPI;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                    if(where.indexOf("right") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * (r - radius) - v1.y * radius;
                        arc.circle.center.y = this.top.p1.y + v1.y * (r - radius) + v1.x * radius;
                        arc.start = a + MPI270;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                }
                if(where.indexOf("bot") > -1){
                    if(where.indexOf("left") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * radius - v1.y * (b - radius);
                        arc.circle.center.y = this.top.p1.y + v1.y * radius + v1.x * (b - radius);
                        arc.start = a + MPI90;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                    if(where.indexOf("right") > -1){
                        arc.circle.radius = radius;
                        arc.circle.center.x = this.top.p1.x + v1.x * (r - radius) - v1.y * (b - radius);
                        arc.circle.center.y = this.top.p1.y + v1.y * (r - radius) + v1.x * (b - radius);
                        arc.start = a;
                        arc.end = arc.start + MPI90;
                        return arc;
                    }
                }
            } 
            return arc;
            
        },
        area : function () {
            var l = Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x);
            return l * l * this.aspect;
        },
        heightFromArea : function (area){
            var l = Math.hypot(this.top.p2.y - this.top.p1.y, this.top.p2.x - this.top.p1.x);
            this.aspect  = (area / l) / l;
            return this; // returns this.
        },
        widthFromArea : function (area){
            var l = Math.hypot(v1.y = this.top.p2.y - this.top.p1.y, v1.x = this.top.p2.x - this.top.p1.x) ;            
            var la = l * this.aspect;
            this.aspect = la / (lb =  area / la);            
            this.top.p2.x = this.top.p1.x + v1.x * (l = lb/l);
            this.top.p2.y = this.top.p1.y + v1.y * (l);
            return this; // returns this.
        },
        perimiter : function() {
            var l = Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x);
            return l * 2 + l* this.aspect * 2;
        },
        diagonalLength : function () {
            var l = Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x);
            return Math.hypot(l,l* this.aspect);
        },
        center : function (vec) {
            if(vec === undefined){
                vec = this.top.p1.copy();
            }else{
                vec.x = this.top.p1.x;
                vec.y = this.top.p1.y;
            }
            vec.x += (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            vec.y += (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            vec.x += -v1.y * this.aspect;
            vec.y += v1.x * this.aspect;
            return vec;
        },
        setCenter : function(vec){ // moves rectangle to place its center at vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            v2.x = (-v1.y * this.aspect + v1.x)/2;
            v2.y = (v1.x * this.aspect + v1.y)/2;
            this.top.p2.x = this.top.p1.x = vec.x - v2.x;
            this.top.p2.y = this.top.p1.y = vec.y - v2.y;
            this.top.p2.x += v1.x;
            this.top.p2.y += v1.y;
            return this;
        },
        diagonalLine : function (line){            
            if(line === undefined){
                line = new Line();
            }
            line.p1.x = this.top.p1.x;
            line.p1.y = this.top.p1.y;
            line.p2.y = this.top.p2.y + (this.top.p2.x - this.top.p1.x) * this.aspect;
            line.p2.x = this.top.p2.x - (this.top.p2.y - this.top.p1.y) * this.aspect;
            return line;   
        },
        setDiagonalLine : function (line){   
            // I do not like this solution as it seams a little to long. Need to find a better method
            var len = Math.hypot(v1.y = line.p2.y - line.p1.y, v1.x = line.p2.x - line.p1.x);
            v1.x /= len;
            v1.y /= len;
            var h = Math.sqrt( 1 + this.aspect * this.aspect);
            var ph = Math.atan(this.aspect);
            h = (1/h) * len;
            v2.x = Math.cos(-ph) * h;
            v2.y = Math.sin(-ph) * h;
            v3.x = v1.x * v2.x + v1.y * -v2.y;
            v3.y = v1.x * v2.y + v1.y * v2.x;
            
            this.top.p1.x = line.p1.x;
            this.top.p1.y = line.p1.y;
            this.top.p2.x = line.p1.x + v3.x;
            this.top.p2.y = line.p1.y + v3.y;
            return this;   
        },
        bottomRight : function (vec) {
            if(vec === undefined){
                vec = this.top.p2.copy();
            }else{
                vec.x = this.top.p2.x;
                vec.y = this.top.p2.y;
            }
            vec.y += (this.top.p2.x - this.top.p1.x) * this.aspect;
            vec.x -= (this.top.p2.y - this.top.p1.y) * this.aspect;
            
            return vec;
        }, 
        setBottomRight : function(vec){ // moves rectangle to place its Bottom Right at vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            v2.x = (-v1.y * this.aspect + v1.x);
            v2.y = (v1.x * this.aspect + v1.y);
            this.top.p2.x = this.top.p1.x = vec.x - v2.x;
            this.top.p2.y = this.top.p1.y = vec.y - v2.y;
            this.top.p2.x += v1.x;
            this.top.p2.y += v1.y;
            return this;
        },
        setTopRight : function(vec){ // moves rectangle to place its Bottom Right at vec
            v1.x = this.top.p2.x - this.top.p1.x;
            v1.y = this.top.p2.y - this.top.p1.y;
            this.top.p2.x = this.top.p1.x = vec.x;
            this.top.p2.y = this.top.p1.y = vec.y;
            this.top.p2.x += v1.x;
            this.top.p2.y += v1.y;
            return this;
        },
        isRectangleTouching : function(rectangle){
            if(! this.asCircle().touching(rectangle.asCircle())){
                return false;
            }
            if(this.top.isLineSegIntercepting(rectangle.top)){
                return true;
            }
            var rll,rlb,rlr;
            if(this.top.isLineSegIntercepting(rll = rectangle.leftLine()) ||
                this.top.isLineSegIntercepting(rlb = rectangle.bottomLine()) ||
                this.top.isLineSegIntercepting(rlr = rectangle.rightLine())){
                return true;
            }
            var ll = this.leftLine();
            if(ll.isLineSegIntercepting(rectangle.top) ||
                ll.isLineSegIntercepting(rll) ||
                ll.isLineSegIntercepting(rlb) ||
                ll.isLineSegIntercepting(rlr) ){
                return true;
            }
            var ll = this.bottomLine();
            if(ll.isLineSegIntercepting(rectangle.top) ||
                ll.isLineSegIntercepting(rll) ||
                ll.isLineSegIntercepting(rlb) ||
                ll.isLineSegIntercepting(rlr) ){
                return true;
            }            
            var ll = this.rightLine();
            if(ll.isLineSegIntercepting(rectangle.top) ||
                ll.isLineSegIntercepting(rll) ||
                ll.isLineSegIntercepting(rlb) ||
                ll.isLineSegIntercepting(rlr) ){
                return true;
            }            
            if(this.isRectangleInside(rectangle) || rectangle.isRectangleInside(this)){
                return true;
            }
            return false;            
        },
        isRectangleInside : function (rectangle){ // there is room for more optimisation.
            var x1,y1,x2,y2,x3,y3,x4,y4;
            v1.x = x2 = this.top.p2.x - this.top.p1.x;
            v1.y = y2 = this.top.p2.y - this.top.p1.y;
            x1 = rectangle.top.p1.x - this.top.p1.x
            y1 = rectangle.top.p1.y - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }
            x1 = rectangle.top.p2.x - this.top.p1.x
            y1 = rectangle.top.p2.y - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }            
            x1 = rectangle.top.p1.x - (x3 = this.top.p2.x - y2 * this.aspect); 
            y1 = rectangle.top.p1.y - (y3 = this.top.p2.y + x2 * this.aspect);
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            x1 = rectangle.top.p2.x - x3; 
            y1 = rectangle.top.p2.y - y3;
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            x4 = (rectangle.top.p2.x - rectangle.top.p1.x) * rectangle.aspect;
            y4 = (rectangle.top.p2.y - rectangle.top.p1.y) * rectangle.aspect;

            x1 = rectangle.top.p1.x - y4 - this.top.p1.x
            y1 = rectangle.top.p1.y + x4 - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }
            x1 = rectangle.top.p2.x - y4 - this.top.p1.x
            y1 = rectangle.top.p2.y + x4 - this.top.p1.y
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }            

            x1 = rectangle.top.p1.x - y4 - x3; 
            y1 = rectangle.top.p1.y + x4 - y3;
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            x1 = rectangle.top.p2.x - y4 - x3; 
            y1 = rectangle.top.p2.y + x4 - y3;
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }                        
            return true;                        
        },
        isBoxInside : function(box){ // Needs improvment
            var x1,y1,x2,y2,x3,y3,x4,y4,x5,t1,t2,a1,a2;
            x2 = this.top.p2.x - this.top.p1.x;
            y2 = this.top.p2.y - this.top.p1.y;
            x1 = box.left - this.top.p1.x
            y1 = box.top - this.top.p1.y
            x5 = box.right - this.top.p1.x
            if ( x2 * y1 - y2 * x1 < 0 || 
                -y2 * y1 - x2 * x1 > 0 ||
                 x2 * y1 - y2 * x5 < 0 || 
                -y2 * y1 - x2 * x5 > 0 ) {
                return false;
            }         
            x4 = box.left - (x3 = this.top.p2.x - y2 * this.aspect); 
            y4 = box.top - (y3 = this.top.p2.y + x2 * this.aspect);
            t1 = box.right - x3; 
            y1 = box.bottom - this.top.p1.y
            t2 = box.bottom - y3;
            if ( (a1 = x2 * y4) - y2 * x4 > 0 || 
                 (a2 = -y2 * y4) - x2 * x4 < 0 ||
                 a1 - y2 * t1 > 0 ||
                 a2 - x2 * t1 < 0 ||
                 (a1 = x2 * y1) - y2 * x1 < 0 || 
                 (a2 = -y2 * y1) - x2 * x1 > 0 ||
                 a1 - y2 * x5 < 0 || 
                 a2 - x2 * x5 > 0 ||
                 (a1 = x2 * t2) - y2 * x4 > 0 ||
                 (a2 = -y2 * t2 - x2) * x4 < 0 || 
                 a1 - y2 * t1 > 0 || 
                 a2 - x2 * t1 < 0 ) {
                return false;
            }            
            return true;         
        },
        isCircleInside : function (circle){
            var x,y,x1,y1,x2,y2,l,l1
            // get top as vec
            x2 = this.top.p2.x - this.top.p1.x;
            y2 = this.top.p2.y - this.top.p1.y;            
            l = Math.hypot(x2,y2);
            // if the radius is greater then the lenghth of a side then can not fit.
            if( l / 2 < circle.radiua || (l * this.aspect) / 2 < circle.radius){
                return false;
            }    

            // check if circle center is inside.            
            x = circle.center.x - this.top.p1.x
            y = circle.center.y - this.top.p1.y
            if(x2 * y - y2 * x < 0 || -y2 * y - x2 * x > 0){
                return false;
            }
            // get vec relative to bottom right
            x1 = circle.center.x - (this.top.p2.x - y2 * this.aspect); 
            y1 = circle.center.y - (this.top.p2.y + x2 * this.aspect);
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }            
            
            // find the distance of the circle center from the top
            l1 = (x * x2 + y * y2) / (l * l);
            l1 = Math.hypot(x2 * l1 - x, y2 * l1 - y);
            if(l1 < circle.radius || (l * this.aspect) - l1 < circle.radius){
                return false;
            }
            // find the distance of the circle center from the left
            l1 = (x * -y2 + y * x2) / (l * l);
            l1 = Math.hypot(-y2 * l1 - x, x2 * l1 - y);
            if(l1 < circle.radius || l  - l1 < circle.radius){
                return false;
            }            
            return true;
            
        },
        isPointInside : function (vec){
            var x1,y1,x2,y2;
            // get vec relative to top left
            x1 = vec.x - this.top.p1.x
            y1 = vec.y - this.top.p1.y
            // get top as vec
            x2 = this.top.p2.x - this.top.p1.x;
            y2 = this.top.p2.y - this.top.p1.y;
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }
            // get vec relative to bottom right
            x1 = vec.x - (this.top.p2.x - y2 * this.aspect); 
            y1 = vec.y - (this.top.p2.y + x2 * this.aspect);
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            return true;

        },
        isLineInside : function (line){
            var x1,y1,x2,y2,x,y;
             // get top as vec
            x2 = this.top.p2.x - this.top.p1.x;
            y2 = this.top.p2.y - this.top.p1.y;   
            // get start of line relative to top left
            x1 = line.p1.x - this.top.p1.x
            y1 = line.p1.y - this.top.p1.y
            // is start of line above or to the left of the top and left edges
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }
            // get end of line relative to top left
            x1 = line.p2.x - this.top.p1.x
            y1 = line.p2.y - this.top.p1.y
            // is end of line above or to the left of the top and left edges
            if(x2 * y1 - y2 * x1 < 0 || -y2 * y1 - x2 * x1 > 0){
                return false;
            }


            // get start of line relative to bottom right
            x1 = line.p1.x - (x = (this.top.p2.x - y2 * this.aspect)); 
            y1 = line.p1.y - (y = (this.top.p2.y + x2 * this.aspect));
            // is start of line below or to the right of the bottom and right edges
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }
            x1 = line.p2.x - x; 
            y1 = line.p2.y - y;
            // is end of line below or to the right of the bottom and right edges
            if(x2 * y1 - y2 * x1 > 0 || -y2 * y1 - x2 * x1 < 0){
                return false;
            }            
            return true;            

        },
        setTransform :function(ctx){   // temp location of this function
            var xa = new Vec(null,this.top.dir());
            ctx.setTransform(xa.x, xa.y, -xa.y * this.aspect, xa.x * this.aspect, this.top.p1.x, this.top.p1.y);
            return this;  // returns this.
        },    
        setTransformArea : function (width, height){ // temp location of this function
            var l = this.top.leng();
            var xa = new Vec(null,this.top.dir()).mult(l/width);
            var ya = new Vec(null,this.top.dir()).mult((l* this.aspect)/width);
            ctx.setTransform(xa.x, xa.y, -ya.y, ya.x, this.top.p1.x, this.top.p1.y);
            return this;  // returns this.
        },
        interceptingLineSeg : function (line, retLineSeg){ // returns the line segment that intercepts therectange
            var l,radius, dist, l1, vx,vy,cx,cy,foundStart, done; 
            
            // get center of rect  (cx,cy), top as vec (v1) and side as vec (v3)
            cx = this.top.p1.x + (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            cy = this.top.p1.y + (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            cx += v3.x = -v1.y * this.aspect;
            cy += v3.y = v1.x * this.aspect;
            // get bounding circle radius
            this._width = (l = Math.hypot(v1.x,v1.y)) * 2;
            radius = Math.hypot(l,l * this.aspect); 
            
            // get line as vec (v4)
            v4.x = line.p2.x - line.p1.x;
            v4.y = line.p2.y - line.p1.y;
            // get line length l1 and stash _leng for optimisation
            line._leng = l1 = Math.hypot(v4.y, v4.x);
            // get the distance from rect center to closest point on the line
            v5.x = cx - line.p1.x;
            v5.y = cy - line.p1.y;
            l = (v5.x * v4.x + v5.y * v4.y) / (l1 * l1);
            dist = Math.hypot(v4.x * l + line.p1.x - cx, v4.y * l + line.p1.y - cy);
            
            if(retLineSeg === undefined){
                retLineSeg = line.copy();
            }
            if(dist > radius){  // if the distance from bounding circle to line is greater than the circle radis then no intercep
                // return an empty line by setting the start to equal the end
                retLineSeg.p2.x = retLineSeg.p1.x;
                retLineSeg.p2.y = retLineSeg.p1.y;
                return retLineSeg
            }
            
            // the line may cross the rectange

            // flag if first point found
            foundStart = false;
            
            // flag for all poits found
            done = false; 
           
            // return the vecs for top and left to full lengths
            v3.x *= 2;
            v3.y *= 2;
            v1.x *= 2;
            v1.y *= 2;
            
            // copy the top line to reduce code complexity
            v2.x = this.top.p1.x;
            v2.y = this.top.p1.y;
            v5.x = this.top.p2.x;
            v5.y = this.top.p2.y;
            
            // get cross products
            var cross = v1.x * v4.y - v1.y * v4.x;
            var crossLine  = line.p1.x * line.p2.y - line.p1.y * line.p2.x;
            var cross1  = v2.x * v5.y - v2.y * v5.x;

            // get intercept of line with tp[
            va.x = ((vx = crossLine * v1.x) - cross1 * v4.x) / cross;
            va.y = ((vy = crossLine * v1.y) - cross1 * v4.y) / cross;
               
            // get distance of intercept from rect center            
            if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                foundStart = true;
                retLineSeg.p1.x = va.x;
                retLineSeg.p1.y = va.y;
            };

            
            // move top line to bottom
            v2.x += v3.x;
            v2.y += v3.y;
            v5.x += v3.x;
            v5.y += v3.y;
            
            // get bottom line cross product

            cross1  = v2.x * v5.y - v2.y * v5.x;       
            
            // get intercept of line with bottom
            va.x = (vx - cross1 * v4.x) / cross;
            va.y = (vy - cross1 * v4.y) / cross;                        

            // get distance of intercept from rect center  and add point is on rect permiter    
            if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                if(foundStart){
                    retLineSeg.p2.x = va.x;
                    retLineSeg.p2.y = va.y;
                    done = true;
                }else{
                    foundStart = true;
                    retLineSeg.p1.x = va.x;
                    retLineSeg.p1.y = va.y;
                }
            };
            
            // dont text any more if two points found
            if (!done) {
                // get left line
                v2.x = this.top.p1.x;
                v2.y = this.top.p1.y;
                v5.x = v2.x + v3.x;
                v5.y = v2.y + v3.y;             
                
                // caculate cross
                cross = v3.x * v4.y - v3.y * v4.x;
                cross1  = v2.x * v5.y - v2.y * v5.x;   
                
                // get intercept of line with left
                va.x = ((vx = crossLine * v3.x) - cross1 * v4.x) / cross;
                va.y = ((vy = crossLine * v3.y) - cross1 * v4.y) / cross;                          

                // get distance of intercept from rect center  and add point is on rect permiter    
                if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                    if(foundStart){
                        retLineSeg.p2.x = va.x;
                        retLineSeg.p2.y = va.y;
                        done = true;
                    }else{
                        foundStart = true;
                        retLineSeg.p1.x = va.x;
                        retLineSeg.p1.y = va.y;
                    }
                }
                
                // dont text any more if two points found
                if (!done) {
                
                    // get right line
                    v2.x += v1.x;
                    v2.y += v1.y;
                    v5.x += v1.x;
                    v5.y += v1.y;        

                    // caculate cross
                    cross1  = v2.x * v5.y - v2.y * v5.x;   
                    
                    // get intercept of line with left
                    va.x = (vx - cross1 * v4.x) / cross;
                    va.y = (vy - cross1 * v4.y) / cross;                           
                 
                    // get distance of intercept from rect center  and add point is on rect permiter    
                    if (Math.hypot(va.x- cx, va.y - cy) <= radius) {
                        if(foundStart){
                            retLineSeg.p2.x = va.x;
                            retLineSeg.p2.y = va.y;
                            done = true;
                        }else{
                            foundStart = true;
                            retLineSeg.p1.x = va.x;
                            retLineSeg.p1.y = va.y;
                        }
                    }
                }
            }
            
            if(!done){ 
                // line does not cross rect perimiter so return empty line
                retLineSeg.p2.x = retLineSeg.p1.x;
                retLineSeg.p2.y = retLineSeg.p1.y;
                return retLineSeg;                
            }
            
            // now just need to make sure the new line is in the correct direction
            v2.x = retLineSeg.p2.x - retLineSeg.p1.x;
            v2.y = retLineSeg.p2.y - retLineSeg.p1.y;
            
            if(v2.x * v4.x - v2.y * - v4.y < 0){ 
                // line seg is the wrong way around so swap
                cx = retLineSeg.p1;
                retLineSeg.p1 = retLineSeg.p2;
                retLineSeg.p2 = cx;
            }
            
            // all done return the line segment        
            return retLineSeg;
            
        },
        pointAt : function(point,vec){  // point is a relative unit coordinate on the rectangle
                                    // uses v1,v2
            if(vec === undefined){
                vec = new Vec(this.top.p1);
            }else{
                vec.x = this.top.p1.x;
                vec.y = this.top.p1.y;
            }
            v2.y = (v1.x = this.top.p2.x - this.top.p1.x) * this.aspect * point.y;
            v2.x = -(v1.y = this.top.p2.y - this.top.p1.y) * this.aspect * point.y;
            vec.x += v1.x * point.x + v2.x;
            vec.y += v1.y * point.x + v2.y;
            return vec;
        },
        localPoint : function(vec){
            var dy = this.top.distFromDir(vec);
            var dx = this.leftLine().distFromDir(vec);
            var lw = this.top.leng();
            var lh = lw * this.aspect;
            return new Vec(dx/lw,dy/lh);
        },
        scaleToFitIn : function(obj){
            if(obj.type === "rectangel"){
                return this;
            }
            if(obj.type === "box"){
                return this;
            }
            if(obj.type === "circle"){
                return this;
            }
        },
        scale : function(scale){
            this.top.p1.x *= scale;
            this.top.p1.y *= scale;
            this.top.p2.x *= scale;
            this.top.p2.y *= scale;
            return this; // returns this
        },
        translate : function(vec){
            this.top.p1.x += vec.x;
            this.top.p1.y += vec.y;
            this.top.p2.x += vec.x;
            this.top.p2.y += vec.y;
            return this; // returns this
        },
        rotate : function(rotation){
            var dx = Math.cos(rotation);
            var dy = Math.sin(rotation);
            var x = this.top.p1.x;
            var y = this.top.p1.y;
            this.top.p1.x = x * dx + y * -dy;
            this.top.p1.y = x * dy + y * dx;
            x = this.top.p2.x;
            y = this.top.p2.y;
            this.top.p2.x = x * dx + y * -dy;
            this.top.p2.y = x * dy + y * dx;                 
            return this; // returns this
        },
        transform : function(transform){
            return this; // returns this
        },
    }
    Box.prototype = {
        top : 0,
        bottom : 0,
        left : 0,
        right : 0,
        type : "Box",
        copy : function (){
            return new Box (this.left,this.top,this.right,this.bottom);
        },
        setAs : function(box){
            this.top = box.top;
            this.left = box.left;
            this.right = box.right;
            this.bottom = box.bottom;
            return this; // returns this.
        },      
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env(this.left,this.top);
            box.env(this.right,this.bottom);
            return box;
        },      
        isVecInside : function(vec){
            if(vec.x >= this.left && vec.x <= this.right && vec.y >= this.top && vec.y <= this.bottom){
                return true;
            }
            return false;
        },
        isVecArrayInside : function(vecArray){
            var inside = true;
            var me = this;
            
            vec.each(function(vec){
                if(!me.isVecInside(vec)){
                    inside = false;
                    return false;  // break from itteration
                }
            });
            return inside;
        },
        isLineInside : function(line){
            return (this.isVecInside(line.p1) && this.isVecInside(line.p2));
            return false;
        },
        isRectangleInside : function(rectange){
            return this.isVectArrayInside(rectangle.getCorners());
        },
        isCircleInside : function(circle){
            var vec = circle.center;
            var r = circle.radius;
            if(vec.x >= this.left + r && vec.x <= this.right - r && vec.y >= this.top + r && vec.y <= this.bottom - r){
                return true;
            }
            return false;
        },
        isBoxInside : function(box){
            if(box.left >= this.left && box.right <= this.right && box.top >= this.top && box.bottom <= this.bottom){
                return true;
            }
            return false;           
        },
        isInside : function(primitive){
            var call = this["is"+primitive.type+"Inside"];
            if(call !== undefined){
                return call(primitive);
            }
            return false;
        },
        isEmpty : function(){
            if(this.top >= this.bottom || this.left >= this.right){
                return true;
            }
            return false;
        },
        asRectange : function () {
            var a = (this.bottom- this.top)  / (this.right- this.left);
            return new Rectangle ( new Line( new Vec(this.left,this.top)), a)
        },
        normalise : function (){
            var t,r,l,b;
            t = Math.min(this.top,this.bottom);
            b = Math.max(this.top,this.bottom);
            l = Math.min(this.left,this.right);
            r = Math.max(this.left,this.right);
            this.top = t;
            this.bottom = b;
            this.left = l;
            this.right = r;
            return this; // returns this.
        },
        max : function () {
            this.top = -Infinity;
            this.bottom = Infinity;
            this.left = -Infinity;
            this.right = Infinity;
            return this; // returns this.
        },
        irrate : function () {
            this.top = Infinity;
            this.bottom = -Infinity;
            this.left = Infinity;
            this.right = -Infinity;
            return this; // returns this.
        },
        env : function ( x, y){
            if(y !== undefined && y !== null){
                this.top = Math.min(y,this.top);
                this.bottom = Math.max(y,this.bottom);
            }
            if(x !== undefined && x !== null){
                this.left = Math.min(x,this.left);
                this.right = Math.max(x,this.right);
            }
            return this; // returns this.
        },
        envBox : function (box){
            this.top = Math.min(box.top,this.top);
            this.bottom = Math.max(box.bottom,this.bottom);
            this.left = Math.min(box.left,this.left);
            this.right = Math.max(box.right,this.right);
            return this; // returns this.
        },
        envelop : function (obj){
            if(geomInfo.isGeom(obj)){
                this.envBox(obj.asBox());
            }
            return this; // returns this.
        } 
    }
    Transform.prototype = {
        xa : undefined,
        ya : undefined,
        o : undefined,
        type:"Transform",
        copy : function(){
            return new Transform(this.xa.copy(),this.ya.copy(),this.o.copy());
        },
        setAs : function (transform) {
            xa.setAs(transform.xa);
            ya.setAs(transform.ya);
            o.setAs(transform.o);
            return this;
        },
        setCtx : function(){
            ctx.setTransform(this.xa.x,this.xa.y,this.ya.x,this.ya.y,this.o.x,this.o.y);
            return this;
        },
        setOrigin : function(vec){
            this.o.x = vec.x;
            this.o.y = vec.y;
        },
        setXAxis : function(vec){
            this.xa.x = vec.x;
            this.ya.y = vec.y;
        },
        setYAxis : function(vec){
            this.ya.x = vec.x;
            this.ya.y = vec.y;
        },
    }

    geom.init();
    return geom
})();

