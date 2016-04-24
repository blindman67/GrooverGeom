"use strict";
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
    Math.angleBetween = function(x,y,x1,y1){
        var l = Math.hypot(x,y);
        x /= l;
        y /= l;
        l = Math.hypot(x1,y1);
        x1 /= l;
        y1 /= l;
        if(x * -x1 - y * y1 < 0){
            l = x * y1 - y * x1;
            if(l < 0){
                return -(Math.PI + Math.asin(l));
            }
            return (Math.PI - Math.asin(l));
            
        }
        return Math.asin(x * y1 - y * x1);
    }
    Math.unitDistOnLine = function(px,py,l1x,l1y,l2x,l2y){
        var v1x,v1y,v2x,v2y,l;
        v1x = l2x - l1x;
        v1y = l2y - l1y;
        l = Math.hypot(v1y,v1x);
        v2x = px - l1x;
        v2y = py - l1y;
        return (v2x * v1x + v2y * v1y)/(l * l);
    }
    Math.unitDistOnVec = function(px,py,v1x,v1y){
        return (px * v1x + py * v1y)/(v1y * v1y + v1x * v1x);     
    }    
    Math.dist2Line = function(px,py,l1x,l1y,l2x,l2y){
        var v1x,v1y,v2x,v2y,l,c;
        v1x = l2x - l1x;
        v1y = l2y - l1y;
        l = Math.hypot(v1y,v1x);
        v2x = px - l1x;
        v2y = py - l1y;
        c = (v2x * v1x + v2y * v1y)/(l * l);
        return Math.hypot(v1x * c - v2x, v1y * c - v2y);        
    }
    Math.dist2Vector = function(px,py,v1x,v1y){
        var c;
        c = (px * v1x + py * v1y)/(v1y * v1y + v1x * v1x);
        return Math.hypot(v1x * c - px, v1y * c - py);        
    }    
    Math.circle = {};  
    Math.sphere = {};    
    Math.circle.area = function(radius){
        return radius * radius * MPI2;
    }    
    Math.circle.circumferance = function(radius){
        return radius * MPI2;
    }
    Math.circle.radiusFromArea = function(area){
        return Math.sqrt(area / MPI2);
    }
    Math.circle.radiusFromCircumferance = function(circumferance){
        return circumferance / MPI2;
    }
    Math.sphere.area = function(radius){
        return radius * radius * 2 * MPI2;
    }
    Math.sphere.radiusFromArea = function(area){
        return Math.sqrt(area / (2 * MPI2));
    }    
    Math.sphere.volume = function(radius){
        return radius * radius * radius * (4/3) * Math.PI;
    }
    Math.sphere.radiusFromVolume = function(volume){
        return Math.pow(volume / ((4/3) * Math.PI), 1 / 3);
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
    
    // Closure Vars for internal optimistion and now public under the term registers
    // Geom.registers has V1 to V5 and the function get(name) to get a,b,c,u,c1,u1
    // The meaning of register values is dependent on the last call to any of Geom withing this scope
    // DO NOT rely on these registers after you have reliquished your current JavasSript context execution 

    // the following are to aid in optimisation. Rather than create new primitives when needed these should be used instead
    // Do not return them.
    var v1,v2,v3,v4,v5,va,vb,vc,vd,ve,vr1,vr2; // Vec registers
    var vx,vy,v1x,v1y,u,u1,c,c1,a,b,d,e;  
    var l1; //,l2,l3,l4,l5,la,lb,lc,ld,le,lr1,lr2;  //  have not found these usefull as yet may return them but want to keep the number of closure variable as low as possible
    
    // NOTE dropping this....
    /*const REGS_LEN = 5; // used in Vec._asVec  Internal uses only and experiment 
    // reg for regerstry
    var regl,regv; // line and vec stack for quick access to optimisition var
                   // these arrays can act like a stack, quew, random access, or cyclic access
 
    var reglSP, regvSP; // stack pos*/
    // NOTE dropping this.... END
    
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
        /*l2 = new Line();
        l3 = new Line();
        l4 = new Line();
        l5 = new Line(); 
        la = new Line();
        lb = new Line();
        lc = new Line();
        ld = new Line();
        le = new Line();
        lr1 = new Line();
        lr2 = new Line();*/
        /*For removal */  
        /* regl = [l1,l2,l3,l4,l5];
        regv = [v1,v2,v3,v4,v5];
        reglSP = 0;
        regvSP = 0;*/
        this.registers = {
            v1 : v1,
            v2 : v2,
            v3 : v3,
            v4 : v4,
            v5 : v5,
            l1 : l1,
            get : function(name){
                switch(name){
                    case "c":
                       return c;
                    case "u":
                       return u;
                    case "a":
                       return u;  
                    case "b":
                       return u;
                    case "c1":
                       return c1;
                    case "u1":
                       return u1;
                    case "vx":
                       return vx;
                    case "vy":
                       return vy;
                }
                return undefined;
            }
        };
        this.primitiveTypes = [
            "PrimitiveArray",
            "Vec",
            "VecArray",
            "Line",
            "Triangle",
            "Rectangle",
            "Circle",
            "Arc",
            "Box",
            "Empty",
            "Bezier",
            "Transform",
        ];
        this.objectNames = [
            "PrimitiveArray",
            "Vec",
            "VecArray",
            "Line",
            "Triangle",
            "Rectangle",
            "Circle",
            "Arc",
            "Box",
            "Empty",
            "Bezier",
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
            VecArray: ["vecs","length","type"],
            PrimitiveArray: ["primitives","length","type"],
            Transform: ["xa","ya","o","type"],
            Triangle : ["p1","p2","p3","type"],
            Bezier : ["p1","p2","cp1","cp2","type"],         
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
        this.Bezier = Bezier;
        this.VecArray = VecArray;
        this.PrimitiveArray = PrimitiveArray;
        this.Geom = Geom;
        this.Empty = Empty;

    }
    Geom.prototype = {
        extentions : {},
        defaultPrecision : 4,
        setDefaultPrecision : function(value){
            this.defaultPrecision = value;
        },
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
        isEmpty : function (obj){
            if(this.isPrimitive(obj)){
                if(typeof obj.isEmpty === "function"){
                    return obj.isEmpty();
                }
            }
            return undefined;
        },
        validatePrimitive : function(obj){
            if(typeof obj === "object"){
                if(typeof obj.type === "string"){
                    if(primitiveTypes.indexOf(obj.type) > -1){
                        var temp = new Geom[obj.type];
                        for(var i in temp){
                            if(typeof temp[i] !== typeof obj[i]){
                                if(typeof temp[i] === "number" && typeof obj[i] === "string"){
                                    if(isNaN(obj[i])){
                                        return false;
                                    }
                                    obj[i] = Number(ob[i]);
                                }else
                                if(typeof temp[i] === "string" && typeof obj[i] !== "function"  && typeof obj[i].toString === "function"){
                                    obj[i] = obj[i].toString();
                                }else{
                                    return false;
                                }
                            }
                        }
                        return true;
                    }
                }
            }
            return false;
        },
        isPrimitive : function (obj){
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
                var cLines = [];
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
            var data = [];
             
            this.objectNames.forEach(function(n){
                var st,f,ii;
                var desc = "## " + n + newLine;
                var methods = "Functions."+newLine;
                var propDesc = "Properties."+newLine;
                var pr = s.properties[n];
                var extentions = {};
                var dat = {};
                dat.name = n;
                dat.properties = [];
                dat.methods = [];
                dat.extensions = [];
                
                
                for(var i in s[n].prototype){
                   
                    if(typeof s[n].prototype[i] === "function"){
                        var ce = "";
                        var ext;
                        for(var k in s.extentions){
                            if(s.extentions[k].functions.indexOf(i) > -1){
                                if(extentions[k] === undefined){
                                    extentions[k] = k + " extention."+newLine;
                                    dat.extensions.push({
                                        name : k,
                                        methods : []
                                    });
                                }
                                for(ii = 0; ii < dat.extensions.length; ii ++){
                                    if(dat.extensions[ii].name === k){
                                        ext = dat.extensions[ii];
                                        break;
                                        
                                    }
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
                            ext.methods.push(i + f);
                            if(com.length > 0){
                                extentions[ce] += com.join("  "+newLine)+newLine;
                            }
                        }else{
                            methods += "- **"+n + "." + i+f + "**  " + newLine;
                            dat.methods.push(i + f);
                            if(com.length > 0){
                                methods += com.join("  "+newLine)+newLine;
                            }
                        }
                    }else
                    if(typeof s[n].prototype[i] === "string"){
                        st = s[n].prototype[i].toString();
                        propDesc += "- **"+n + "." + i+"** = '" +st+"'"+"  " + newLine;
                        dat.properties.push(i);
                    }else{
                        st = typeof s[n].prototype[i];
                        dat.properties.push(i);
                        propDesc += "- **"+n + "." + i+"** = " +st+"  " + newLine;
                    }
                }
                str += desc + newLine;
                str += propDesc + newLine;
                str += methods + newLine;
                for(var k in extentions){
                    str += extentions[k] + newLine;
                }
                data.push(dat);
                str += "[Back to top.](#contents)"+newLine+newLine
            });
            console.log(str)
            data.string = str;
            return data;
        }

    }

    function Helpers(){}; // for stuff that does not fit any catagory
    function Empty(){};
    function PrimitiveArray(array){ // array can be an array of primitives. No vetting is done so you must ensure that the array only contains geom primitives compatable objects
        if(array === undefined){
            this.primitives = [];
        }else
        if(Array.isArray(array)){
            this.primitives = array;
            this.normalise();
        }else{
            this.primitives = [];
        }
    };
    function Vec(x,y){ // creates a vector x and y are both optional and can be various types
        // if x and y are undefined then an empty vec is created
        // if x is a vec and y is undefined then the vector x is copied
        // if x and y are vecs then the vec x.sub(x) is created
        // if y is undefined and none of the above then vec has both x,y set to the argument x
        // if x is undefined and none of the above then vec is set to the unit vec at angle y in radians
        // else vec is set tp x, and y
        if(x === undefined && y === undefined){
            this.x = this.y = Infinity;

        }else
        if(y === undefined && x !== undefined && x.x !== undefined ){
            this.x = x.x;
            this.y = x.y
        }else
        if(x !== undefined && x.x !== undefined && y !== undefined && y.y !== undefined){
            this.x = y.x - x.x;
            this.y = y.y - x.y;
        }else
        if(y === undefined){
            this.x = x;
            this.y = x;
        }else
        if(x === undefined ){
            this.x = Math.cos(y);
            this.y = Math.sin(y);        
        }else{
            this.x = x;
            this.y = y;
        }
    };
    function VecArray(array){ // array can be an array of vectors. No vetting is done so you must ensure that the array only contains vec compatable objects
        if(array === undefined){
            this.vecs = [];
        }else
        if(Array.isArray(array)){
            this.vecs = array;
            this.normalise();
        }else{
            this.vecs = [];
        }
    };
    function Triangle(p1,p2,p3){
        this.p1 = p1;
        this.p2 = p2;
        this.p3 = p3;
    };
    function Line(vec1,vec2){  
        if(vec1 === undefined && vec2 === undefined){
            this.p1 = new Vec(0,0);
            this.p2 = new Vec(); // vec defualts to unit vec
        }else
        if(vec1 !== undefined && vec1.type === "Vec" && vec2 !== undefined && vec2.type === "Vec"){
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
    function Arc(circle,start,end,direction){
        this.circle = circle === undefined || circle === null ? new Circle() : circle;
        if(start === undefined && end === undefined){
            start = 0;
            end = Math.PI * 2;
        }else
        if(end === undefined){
            end = start + Math.PI;
        }else
        if(start.type === "Vec"){
            this.startFromVec(start);
            if(end.type === "Vec"){
                this.endFromVec(end);
            }else{
                this.end = end;
            }
        }else{
            this.start = start;
            this.end = end;
        }
        this.direction = direction;
    };
    function Rectangle(top,v2Aspect,aspect){
        if(top !== undefined && v2Aspect !== undefined && aspect !== undefined){
            if(top.type === "Vec" && top.v2Aspect.type === "Vec"){
                top = new Line(top,v2Aspect);
                v2Aspect = aspect;
            }
        }
                
        this.top = top === undefined || top === null ? new Line() : top;
        this.aspect = v2Aspect === undefined || v2Aspect === null ? 1 : v2Aspect;
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
    function Bezier(p1,p2,cp1,cp2){
        this.p1 = p1;
        this.p2 = p2;
        this.cp1 = cp1;
        this.cp2 = cp2;
    }
    function Transform(xAxis,yAxis,origin){
        this.xAxis = xAxis === undefined?new Vec() : xAxis;
        this.yAxis = yAxis === undefined?new Vec(0,1) : yAxis;
        this.origin = origin === undefined?new Vec(0,0) : origin;
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
    PrimitiveArray.prototype = {
        primitives : [],
        type : "PrimitiveArray",
        length : 0,
        push : function(primitive){
            if(primitive.type === "PrimitiveArray"){
                throw Error("Can not push a PrimitiveArray onto the PrimitiveArray.\nThis is to prvent infinite recursion. Use pushUnsafe if you are feeling lucky.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length; 
            return this;
        },
        pushUsafe : function(primitive){
            if(primitive.type === "PrimitiveArray"){
                console.log("Warning pushing PrimitiveArray onto the PrimitiveArray may create infinite loops.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length; 
            return this;
        },
        pushI : function(primitive){
            if(primitive.type === "PrimitiveArray"){
                throw Error("Can not pushI a PrimitiveArray onto the PrimitiveArray.\nThis is to prvent infinite recursion. Use pushIUnsafe if you are feeling lucky.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length; 
            return this.length - 1;
        },
        pushIUnsafe : function(primitive){
            if(primitive.type === "PrimitiveArray"){
                console.log("Warning pushing PrimitiveArray onto the PrimitiveArray may create infinite loops.");
            }
            this.primitives.push(primitive);
            this.length = this.primitives.length; 
            return this.length - 1;
        },
        clear : function(){  // removes all primitives from the list
            this.length = this.primitives.length = 0;
            return this;  // returns this
        },
        reset : function(){  // I know a little crazzzzy clear,empty, and reset all doing the same but I have yet to decied which it will be and will keep empty, but reset or clear may go.
            this.length = this.primitives.length = 0;
            return this; 
        },
        empty : function(){ // removes all primitives from list
            this.length = this.primitives.length = 0;
            return this;
        },        
        isEmpty : function(){ // returns true if no objects in the array
            return this.primitives.length === 0;
        },
        normalise : function(){  // set everything correctly. use after manualy manipulating this object
          this.length = this.primitives.length;  
          return this;
        },
        transform : function(transform){
            this.each(function(prim){
                transform["applyTo"+prim.type](prim);
            });
            return this;
        },
        asBox : function(box){
            if(box === undefined){
                box = new Box();
            }
            this.each(function(prim){
                prim.asBox(box);
            });
            return box;
        },            
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            this.each(function(prim){
                prim.asVecArray(vecArray, instance);
            });
            return vecArray;
        },       
        each : function (callback,dir,start){ 
            var i;
            var l = this.primitives.length;      
            if(start === undefined || start === null){
                start = 0;
            }
            if(dir){
                l -= 1;
                l -= start;
                for(i = l; i >= 0; i --){
                    if(callback(this.primitives[i],i) === false){
                        break;
                    }
                }
            }else{
                for(i = start; i < l; i ++){
                    if(callback(this.primitives[i],i) === false){
                        break;
                    }
                }
            }
            return this; // returns this
        },  
        
    }
    VecArray.prototype =  {
        vecs : [],
        items : undefined,
        type :"VecArray",
        length : 0,
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
                    this.length = this.vecs.length; 
                }
            }
            this.length = this.vecs.length; 
            return this;  // returns this
        },
        toString : function(precision, lineFeed){ // return a string representing this object. 
                                       // The {olineFeed} can insert a lineFeed after each vec. For example for console output add call with lineFeed = "\n". 
                                       // the {oprecision} can also be changed. The default is 6;
            var str;
            var l = this.label === undefined ? "": "'"+this.label+"' ";
            if(this.isEmpty()){
                return "VecArray: "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "VecArray : "+l+"("+ this.vecs.length+" vecs" + lineFeed
            this.each(function(vec,i){
                str += "index "+i+" : "+vec.toString(precision)+lineFeed;
            });
            str += ")";
            return str; // returns String
        },
        lerp : function(from,dest,amount){
            var i,len = Math.min(from.vecs.length, dest.vecs.length);
            var v = this.vecs;
            var d = dest.vecs;
            var f = from.vecs;
            for(i = 0; i < len; i++){
                v[i].x = (d[i].x - f[i].x) * amount + f[i].x;
                v[i].y = (d[i].y - f[i].y) * amount + f[i].y;
            }
            return this;
        },
        clear : function(){  // removes all vecs from the list
            this.length = this.vecs.length = 0;
            return this;  // returns this
        },
        reset : function(){  // I know a little crazzzzy clear,empty, and reset all doing the same but I have yet to decied which it will be and will keep empty, but reset or clear may go.
            this.length = this.vecs.length = 0;
            return this; 
        },
        empty : function(){ // removes all vecs from list
            this.length = this.vecs.length = 0;
            return this;
        },        
        isEmpty : function(){
            return this.vecs.length === 0;
        },
        normalise : function(){  // set everything correctly. use after manualy manipulating this object
          this.length = this.vecs.length;  
          return this;
        },
        reverse : function(){
            this.vecs.reverse();
            return this; // returns this
        },
        remove : function(index){
            if(index >= 0 && index < this.vecs.length){
                this.vecs.splice(index,1);
            }
            this.length = this.vecs.length; 
            return this;
        },
        removeById : function(id){ // remove the vert with id. ID should be unique but I will assume that people will incorrectly use ids so to keep the structure consistant and not effect correct use (appart from cpu load) this function will look through all items. id can be a single number or an array of numbers
            if(this.vecs.length > 0){
                if(Array.isArray(id)){
                    for(c = 0; c < this.vecs.length; c ++){ 
                        if(id.indexOf(this.vecs[c].id) > -1){
                            this.vecs.splice(c,1);
                            c -= 1;
                        }
                    }                    
                }else{
                    for(c = 0; c < this.vecs.length; c ++){ 
                        if(this.vecs[c].id === id){
                            this.vecs.splice(c,1);
                            c -= 1;
                        }
                    }
                }
                this.length = this.vecs.length;
            }
            return this;
        },        
        isIdInArray : function (id){
            for(c = 0; c < this.vecs.length; c ++){ 
                if(this.vecs[c].id === id){
                    return true;
                }
            }
            return false;
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
            this.length = this.vecs.length;             
            return this;  // returns this
        },
        pushI : function (vec){ // Push the {avec} onto the array of vecs returning the index of the vec
            this.vecs[this.vecs.length] = vec;
            this.length = this.vecs.length;             
            return this.vecs.length-1;  // returns the index of the pushed vec
        },
        append : function(vecArray){  // append the {avecArray} to the end of the list of vecs
            var me = this;
            vecArray.each(function(vec){  
                me.push(vec);
            })
            this.length = this.vecs.length;             
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
               vec1.add(vec);
            });
            return this; // returns this
        },
        sum : function (){ // returns a vec that is the sum of all vecs
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
        findClosestIndex : function(vec, limit, retangular){ // returns the index of the point closest to the {avec}{olimit} defines the threshold if defined. Points further away than {olimit} are igonred
                                                             // For want of a better name retangular if true uses the largest x or y diferance to determin distance. This in effect makes selection of a point by a box of 2*lime size around the vec
            if(this.vecs.length === 0){
                return -1;
            }
            var minDist = limit = undefined ? Infinity : limit;
            var index = -1;
            var dist = 0;
            if(retangular){
                this.each(function(vec1,ind){
                    dist = Math.max(Math.abs(vec1.x-vec.x),Math.abs(vec1.y-vec.y));
                    if(dist < minDist){
                        minDist = dist;
                        index = ind;
                    }                
                });
            }else{
                this.each(function(vec1,ind){
                    dist = vec.distTo(vec1);
                    if(dist < minDist){
                        minDist = dist;
                        index = ind;
                    }                
                });
            }
            return index;
        },
        findClosest : function(vec,limit, retangular){ // returns the referance to the point closest to the {avec} {olimit} defines the threshold if defined. Points further away than {olimit} are igonred
            if(this.vecs.length === 0){
                return new Empty();
            }
            var ind = this.findClosestIndex(vec,limit);
            if(ind === -1){
                return new Empty();                
            }
            return this.vecs[ind];
        },
        findInsideBox : function(box, vecArray, invVecArray){ // returns a vecArray containing points inside the box. Creates a new vecArray if not supplied or empties the supplied one and fills it. If invVecArray is given and is a VecArray then this is emptied and filled with the vecs that are outside the box
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            a = box.left;
            b = box.right;
            u = box.top;
            u1 = box.bottom;
            vx = vecArray.vecs;
            vx.length = 0;
            if(invVecArray !== undefined && invVecArray.type === "VecArray"){
                vy = invVecArray.vecs;
                vy.length = 0;
                for(c = 0; c < this.vecs.length; c ++){
                    c1 = this.vecs[c];
                    if(c1.x >= a && c1.x <= b && c1.y >= u && c1.y <= u1){
                        vx[vx.length] = c1;
                    }else{
                        vy[vy.length] = c1;
                    }
                }
                invVecArray.normalise();
            }else{
                for(c = 0; c < this.vecs.length; c ++){
                    c1 = this.vecs[c];
                    if(c1.x >= a && c1.x <= b && c1.y >= u && c1.y <= u1){
                        vx[vx.length] = c1;
                    }
                }
            }
            vecArray.normalise();   
            return vecArray;
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
            if(this._empty || this.p1 === undefined || this.p2 === undefined || this.p2 === undefined){
                return true;
            }
            if(this.p1.isEmpty() || this.p1.isEmpty() || this.p1.isEmpty()){
                return true;
            }
            return false;
        },
        empty : function(){ //
            this.p1.x = this.p1.y = this.p2.x = this.p2.y = this.p3.x = this.p3.y = Infinity;
            return this;
        },
        toString : function(precision){
            var str;
            var l = this.label === undefined ? "": "'"+this.label+"' ";
            if(this.isEmpty()){
                return "Triangle: "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Triangle : "+l+"(";
            str += "Point 1 : "+ this.p1.toString(precision) + ", ";
            str += "Point 2 : "+ this.p2.toString(precision) + ", ";
            str += "Point 3 : "+ this.p3.toString(precision) ;
            str += ")";
            return str; // returns String
        },
        area : function(){
            return Math.abs( this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1) );
        },
        perimiter: function(){
            return this.p1.distFrom(this.p2) + this.p2.distFrom(this.p3) + this.p3.distFrom(this.p1);
        },
        lerp : function(from, dest, amount){
            this.p1.x = (dest.p1.x - from.p1.x) * amount + from.p1.x;
            this.p1.y = (dest.p1.y - from.p1.y) * amount + from.p1.y;
            this.p2.x = (dest.p2.x - from.p2.x) * amount + from.p2.x;
            this.p2.y = (dest.p2.y - from.p2.y) * amount + from.p2.y;
            this.p3.x = (dest.p3.x - from.p3.x) * amount + from.p3.x;
            this.p3.y = (dest.p3.y - from.p3.y) * amount + from.p3.y;
            return this;
        },        
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.p1).push(this.p2).push(this.p3);                
                return vecArray;                
            }            
            vecArray.push(this.p1.copy()).push(this.p2.copy()).push(this.p3.copy());
            return vecArray;
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
        angles : function(array){
            var a = this.p2.copy().sub(this.p1).leng();
            var b = this.p3.copy().sub(this.p2).leng();
            var c = this.p1.copy().sub(this.p3).leng();
            if(array === undefined){
                return [
                    Math.triPh(a,c,b),
                    Math.triPh(b,a,c),
                    Math.triPh(c,b,a)            
                ];
            }
            array[0] = Math.triPh(a,c,b);
            array[1] = Math.triPh(b,a,c);
            array[2] = Math.triPh(c,b,a);
            return array;
            
        },
        center : function(){
            v1.x = (this.p1.x + this.p2.x + this.p3.x ) / 3;
            v1.y = (this.p1.y + this.p2.y + this.p3.y ) / 3;
            if(retVec === undefined){
                return new Vec(v1);
            }
            retVec.x = v1.x;
            retVec.y = v1.y;
            return retVec;
        },
        sumCross : function(){
            return  this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1);
        },
        isVecInside : function(vec){
            var x,y,x1,y1,c; // use the cross product of the vec and each line to find it the point is left off all lines
            v1.x = vec.x - this.p1.x;
            v1.y = vec.y - this.p1.y;
            v2.x = this.p2.x-this.p1.x;
            v2.y = this.p2.y-this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0){
                return false;
            }
            v1.x = vec.x - this.p2.x;
            v1.y = vec.y - this.p2.y;
            v3.x = this.p3.x-this.p2.x;
            v3.y = this.p3.y-this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0){
                return false;
            }
            v1.x = vec.x - this.p3.x;
            v1.y = vec.y - this.p3.y;
            v4.x = this.p1.x-this.p3.x;
            v4.y = this.p1.y-this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0){
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
        isCircleInside : function(circle){ // return true is circle is inside triangle. Only valid for clockwise triangles
            if(!this.isVecInside(circle.center)){
                return false;
            }
            v1.x = circle.center.x;
            v1.y = circle.center.y;
            a = circle.radius;
            if(a > Math.dist2Vector(v1.x - this.p1.x, v1.y - this.p1.y, v2.x, v2.y)){
                return false;                
            }
            if(a > Math.dist2Vector(v1.x - this.p2.x, v1.y - this.p2.y, v3.x, v3.y)){
                return false;                
            }
            if(a > Math.dist2Vector(v1.x - this.p3.x, v1.y - this.p3.y, v4.x, v4.y)){
                return false;                
            }
            return true;
        },
        isArcInside : function(arc){ // not finnished
            if(!this.isVecInside(arc.circle.center)){
                return false;
            }
            
            return undefined;
        },
        isRectangleInside : function(rectangle){
            if(!this.isVecInside(rectangle.top.p1)){
                return false;
            }
            if(!this.isVecInside(rectangle.top.p2)){
                return false;
            }
            rectangle.heightVec(v5);
            va.x = rectangle.top.p1.x + v5.x;
            va.y = rectangle.top.p1.y + v5.y;
            if(!this.isVecInside(va)){
                return false;
            }
            va.x = rectangle.top.p2.x + v5.x;
            va.y = rectangle.top.p2.y + v5.y;
            if(!this.isVecInside(va)){
                return false;
            }
            return true;
        },
        isBoxInside : function(box){
            v1.x = box.left - this.p1.x;
            v1.y = box.top - this.p1.y;
            v2.x = this.p2.x-this.p1.x;
            v2.y = this.p2.y-this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0){
                return false;
            }
            v1.x = box.left - this.p2.x;
            v1.y = box.top - this.p2.y;
            v3.x = this.p3.x-this.p2.x;
            v3.y = this.p3.y-this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0){
                return false;
            }
            v1.x = box.left - this.p3.x;
            v1.y = box.top - this.p3.y;
            v4.x = this.p1.x-this.p3.x;
            v4.y = this.p1.y-this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0){
                return false;
            }          
            
            v1.x = box.right - this.p1.x;
            v1.y = box.top - this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0){
                return false;
            }
            v1.x = box.right - this.p2.x;
            v1.y = box.top - this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0){
                return false;
            }
            v1.x = box.right - this.p3.x;
            v1.y = box.top - this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0){
                return false;
            }            
            v1.x = box.right - this.p1.x;
            v1.y = box.bottom - this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0){
                return false;
            }
            v1.x = box.right - this.p2.x;
            v1.y = box.bottom - this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0){
                return false;
            }
            v1.x = box.right - this.p3.x;
            v1.y = box.bottom - this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0){
                return false;
            }               
            v1.x = box.left - this.p1.x;
            v1.y = box.bottom - this.p1.y;
            if((v2.x * v1.y - v2.y * v1.x) < 0){
                return false;
            }
            v1.x = box.left - this.p2.x;
            v1.y = box.bottom - this.p2.y;
            if((v3.x * v1.y - v3.y * v1.x) < 0){
                return false;
            }
            v1.x = box.left - this.p3.x;
            v1.y = box.bottom - this.p3.y;
            if((v4.x * v1.y - v4.y * v1.x) < 0){
                return false;
            }               
            return true;
        },
        isTriangleInside : function(triangle){
            if(!this.isVecInside(triangle.p1)){
                return false;
            }
            if(!this.isVecInside(triangle.p2)){
                return false;
            }
            return this.isVecInside(triangle.p3)
        },
        isLineTouching : function(line){
            if(this.isVecInside(line.p1) || this.isVecInside(line.p2)){
                return true;
            }
            l1.p1.x = this.p1.x;
            l1.p1.y = this.p1.y;
            l1.p2.x = this.p2.x;
            l1.p2.y = this.p2.y;           
            if(line.isLineSegsIntercepting(l1)){
                return true;
            }
            l1.p1.x = this.p3.x;
            l1.p1.y = this.p3.y;
            if(line.isLineSegsIntercepting(l1)){
                return true;
            }
            l1.p2.x = this.p1.x;
            l1.p2.y = this.p1.y;
            if(line.isLineSegsIntercepting(l1)){
                return true;
            }
            return false;            
        },
        isCircleTouching : function(circle){ // returns true is the circle touches the triangle; currently only valid for clockwise triangles
            if(this.isVecInside(circle.center)){ // is center inside
                return true;
            }
            // create short quick acess
            v1.x = circle.center.x;
            v1.y = circle.center.y;
            u1 = circle.radius;
            // are any triangle vertex inside circle
            if(u1 > Math.hypot(v1.x - this.p1.x, v1.y - this.p1.y)){
                return true;
            }
            if(u1 > Math.hypot(v1.x - this.p2.x, v1.y - this.p2.y)){
                return true;
            }
            if(u1 > Math.hypot(v1.x - this.p3.x, v1.y - this.p3.y)){
                return true;
            }
            // is circle within radius of each line
            v2.x = this.p2.x - this.p1.x;
            v2.y = this.p2.y - this.p1.y;            
            a = Math.unitDistOnVec(v1.x - this.p1.x, v1.y - this.p1.y, v2.x, v2.y);
            if(a >= 0 && a <= 1){
                if(u1 > Math.dist2Vector(v1.x - this.p1.x, v1.y - this.p1.y, v2.x, v2.y)){
                    return true;
                }
            }
            v2.x = this.p3.x - this.p2.x;
            v2.y = this.p3.y - this.p2.y;            
            a = Math.unitDistOnVec(v1.x - this.p2.x, v1.y - this.p2.y, v2.x, v2.y);
            if(a >= 0 && a <= 1){
                if(u1 > Math.dist2Vector(v1.x - this.p2.x, v1.y - this.p2.y, v2.x, v2.y)){
                    return true;
                }
            }      
            v2.x = this.p1.x - this.p3.x;
            v2.y = this.p1.y - this.p3.y;            
            a = Math.unitDistOnVec(v1.x - this.p3.x, v1.y - this.p3.y, v2.x, v2.y);
            if(a >= 0 && a <= 1){
                if(u1 > Math.dist2Vector(v1.x - this.p3.x, v1.y - this.p3.y, v2.x, v2.y)){
                    return true;
                }
            }             
            return false;            
        },
        isArcTouching : function(arc){
            return undefined;            
        },
        isBoxTouching : function(box){
            return undefined;            
        },
        isRectangleTouching : function(rectangle){
            return undefined;            
        },
        isTriangleTouching : function(triangle){
            return undefined;            
        },
        isClockwise : function(){
            return  this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1)> 0 ? true : false;
        },
        isRight : function(){ // returns true if this is a right triangle. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(c > a && c > b){
                if(Math.abs(a + b - c) < EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(Math.abs(c + b - a) < EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(Math.abs(c + a - b) < EPSILON){
                    return true;
                }
            }
            if(a < EPSILON || b < EPSILON || c < EPSILON){ // degenerate right triangle
                return true;
            }                
            return false; // not a right triangle
        },
        isOblique : function(){ // returns true if this triangle is Oblique. This function uses EPSILON to filter out any floating point error.
            return ! this.isRight();  
        },
        isDegenerate : function(){
            this.lengthAllQuick2();
            if(a < EPSILON || b < EPSILON || c < EPSILON){ // degenerate right triangle
                 return true;
            }else
            if(c > a && c > b){
                if(Math.abs(-1 - (c - (a + b) / (-2 * Math.sqrt(a) * Math.sqrt(b)))) < EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(Math.abs(-1 - (a - (c + b) / (-2 * Math.sqrt(c) * Math.sqrt(b)))) < EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(Math.abs(-1 - (b - (a + c) / (-2 * Math.sqrt(a) * Math.sqrt(c)))) < EPSILON){
                    return true;
                }
            }
            return false;            
        },
        isObtuse : function(){ // returns true if this is a obtuse triangle. Has a corner greater than 90deg. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(c > a && c > b){
                if(c - a + b > EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(a - c + b > EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(b - a + c > EPSILON){
                    return true;
                }
            }            
            return false; // not a Obtuse triangle        
        },
        isAcute : function(){ // returns true if this is a acute triangle. Has all corners less than 90deg. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();
            if(c > a && c > b){
                if(a + b - c > EPSILON){
                    return true;
                }
            }else
            if(a > c && a > b){
                if(c + b - a > EPSILON){
                    return true;
                }
            }else
            if(b > c && b > a){
                if(a + c - b > EPSILON){
                    return true;
                }
            }            
            return false; // not a acute triangle        
        },
        isEquilateral : function(){ // returns true is this is an equilateral triangle all angle and length are equal. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();        
            if(Math.abs(a - b) < EPSILON && Math.abs(b - c) < EPSILON && Math.abs(c - a) < EPSILON){
                return true;
            }
            return false;
        },
        isIsosceles : function(){ // returns true is this is an isosceles triangle two sides and two angles are equal. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();        
            u = Math.abs(a - b); // use extra registers to save time calculating the differance
            u1 = Math.abs(b - c);
            c1 = Math.abs(c - a);
            if(u < EPSILON && u1 < EPSILON && c1 > EPSILON){
                return true;
            }else
            if(u < EPSILON && u1 > EPSILON && c1 < EPSILON){
                return true;
            }else
            if(u > EPSILON && u1 < EPSILON && c1 < EPSILON){
                return true;
            }
            return false;
        },
        isScalene : function(){ // returns true is this is a scalene triangle all sides and all angles are not equal. This function uses EPSILON to filter out any floating point error.
            this.lengthAllQuick2();        
            if(Math.abs(a - b) > EPSILON && Math.abs(b - c) > EPSILON && Math.abs(c - a) > EPSILON){
                return true;
            }
            return false;
        },
        description : function(){  // returns a simple text description of the triangle with any of the following words if applicable right,obtuse,acute,equilateral,isosceles,scalene,degenerate,oblique
            this.lengthAllQuick2();
            var tf = this.lengthAllQuick2();
            this.lengthAllQuick2 = function(){}; // temp replace this function. MUST FIND OUT HOW THIS EFFECT OPTIMISATION on different browsers
            var name = [];
            this.isRight() ? name.push("right") : name.push("oblique");
            this.isDegenerate() ? name.push("degenerate") :"" ;
            this.isObtuse() ? name.push("obtuse") : "";
            this.isAcute() ? name.push("acute") : "";
            this.isEquilateral() ? name.push("equilateral") : "";
            this.isIsosceles() ? name.push("isosceles") :"";
            this.isScalene() ? name.push("scalene") :"";
            this.isEquilateral() ? name.push("Equilateral") :"";
            this.lengthAllQuick2 = tf;
            return name.join(",");
        },
        isInside : function(primitive){ // returns true if this is inside the primitive primitive
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
        circumcenter : function(vec){ //returns the circumcenter as a vec of this triangle or an empty vec if the triangle is colinear. vec is optional and if supplied will be set to the cirumcenter else a new vec will be returned. This function uses Circle.fromVec3
           // This function uses the registers b and v1
           // b is the circle that fits the three points on the triangle if any
           // v1 is the center
           // set Circle.fromVec3 for deatail on more registers being used.
           b = new Circle().fromVec3(this.p1, this.p2, this.p3);
           if(vec === undefined){
               vec = new Vec();
           }
           if(b.center.x === Infinity){
               return vec.empty();               
           }
           vec.x = v1.x;
           vec.y = v1.y;
           return vec;        
        },
        meanCenter : function(vec){ // the center of mass (Though I could be wrong as I can not find this formular to confirm it to be but I need this and as I am at aloss as what to call it for now it is the mean center)
            if(vec === undefined){
                vec = new Vec();
            }
            vec.x = (this.p1.x + this.p2.x + this.p3.x) / 3;
            vec.y = (this.p1.y + this.p2.y + this.p3.y) / 3;
            return vec;
        },
        isSimilar : function(triangle){// returns true if supplied triangle is a similar to this triangle. A similar triangle has the same ratio betwwen the sides though the sides may be rotated within the point p1,p2,p3
            u = this.angleAll();
            u1 = triangle.angleAll();
            c1 = function(a,b){return a-b;};
            u.sort(c1);
            u1.sort(c1);
            if(Math.abs(u[0] - u1[0]) <= EPSILON && Math.abs(u[1] - u1[1]) <= EPSILON && Math.abs(u[2] - u1[2]) <= EPSILON){
                return true;
            }
            return false;        
        },
        reverse : function(swap){ // if swap is supplied then swaps that point and the next. Defualts to 0 if not given. swap === 0 then swap p1,p2 swap === 1 swaps p2,p3 and swap === 3 swaps p3,p1
            if(swap === undefined || swap === 0){
                v1.x  = this.p1.x;
                v1.y  = this.p1.y;
                this.p1.x = this.p2.x,
                this.p1.y = this.p2.y,
                this.p2.x = v1.x;
                this.p2.y = v1.y;
            }else
            if(swap === 1){
                v1.x  = this.p2.x;
                v1.y  = this.p2.y;
                this.p2.x = this.p3.x,
                this.p2.y = this.p3.y,
                this.p3.x = v1.x;
                this.p3.y = v1.y;
            }else{
                v1.x  = this.p3.x;
                v1.y  = this.p3.y;
                this.p3.x = this.p1.x,
                this.p3.y = this.p1.y,
                this.p1.x = v1.x;
                this.p1.y = v1.y;
            }
            return this;
        },
        makeClockwise : function(swap){ // ensures the triangle is clockwise. if swap is supplied then swaps that point and the next swap === 0 then swap p1,p2 swap === 1 swaps p2,p3 and swap === 3 swaps p3,p1
            if(this.p1.cross(this.p2) + this.p2.cross(this.p3) + this.p3.cross(this.p1) < 0){
                this.reverse(swap);
            }
            return this;
        },
        lengthAllQuick2 : function(){ // sets registers a,b,c to the square length of the sides. Returns this;
            a = Math.pow(this.p2.x - this.p1.x, 2) * Math.pow(this.p2.y - this.p1.y, 2);
            b = Math.pow(this.p3.x - this.p2.x, 2) * Math.pow(this.p3.y - this.p2.y, 2);
            c = Math.pow(this.p1.x - this.p3.x, 2) * Math.pow(this.p1.y - this.p3.y, 2);
            return this;
        },
        lengthAllQuick : function(){ // sets registers a,b,c to the length of the sides. Returns this;
            a = Math.hypot(this.p2.x - this.p1.x, this.p2.y - this.p1.y);
            b = Math.hypot(this.p3.x - this.p2.x, this.p3.y - this.p2.y);
            c = Math.hypot(this.p1.x - this.p3.x, this.p1.y - this.p3.y);
            return this;
        },
        lengthAll : function(array){ // returns an array containg the length of each side if array supplied the first three items are set
            if(array === undefined){
                array = [];
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = this.p3.x - this.p2.x;
            v2.y = this.p3.y - this.p2.y;
            v3.x = this.p1.x - this.p3.x;
            v3.y = this.p1.y - this.p3.y;
            array[0] = Math.hypot(v1.x,v1.y);
            array[1] = Math.hypot(v2.x,v2.y);
            array[2] = Math.hypot(v3.x,v3.y);
            return array;
        },
        angleAll : function(array){ // returns an array containg the angles at each pount if array supplied the first three items are set
            if(array === undefined){
                array = [];
            }
            this.lengthAllQuick();
            array[0] = Math.triPh(a,c,b)
            array[1] = Math.triPh(a,b,c)
            array[2] = Math.triPh(b,c,a)
            return array;
        },        
        inflate : function(amount){ // only currently for for clockwise triangles need to use a different approch to correcyly mitter and should be quicker
            // create vectors for each side
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = this.p3.x - this.p2.x;
            v2.y = this.p3.y - this.p2.y;
            v3.x = this.p1.x - this.p3.x;
            v3.y = this.p1.y - this.p3.y;
            // find length of each side
            a = Math.hypot(v1.x,v1.y);
            b = Math.hypot(v2.x,v2.y);
            c = Math.hypot(v3.x,v3.y);
            // normalise each side
            v1.x /= a;
            v1.y /= a;
            v2.x /= b;
            v2.y /= b;
            v3.x /= c;
            v3.y /= c;
            // one at time get the angle starting at point p1 and caculate the mitter
            u = Math.triPh(a,c,b) / 2; // need half the angle
            u1 = Math.cos(u) * amount / Math.sin(u); // the length to add to the line to get to the miter point
            this.p1.x -= v1.x * u1;  // move the point
            this.p1.y -= v1.y * u1;            
            u = Math.triPh(b,a,c) / 2; // need half the angle
            u1 = Math.cos(u) * amount / Math.sin(u); // the length to add to the line to get to the miter point
            this.p2.x -= v2.x * u1;  // move the point
            this.p2.y -= v2.y * u1;                 
            u = Math.triPh(b,c,a) / 2; // need half the angle
            u1 = Math.cos(u) * amount / Math.sin(u); // the length to add to the line to get to the miter point
            this.p3.x -= v3.x * u1;  // move the point
            this.p3.y -= v3.y * u1;  
            // now move the points alone the line norm to offset by amount            
            this.p1.x += v1.y * amount;
            this.p1.y -= v1.x * amount;
            this.p2.x += v2.y * amount;
            this.p2.y -= v2.x * amount;
            this.p3.x += v3.y * amount;
            this.p3.y -= v3.x * amount;
            // all done
            return this;
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
            transform.applyToTriangle(this)
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
                                // the precision can also be changed. The default is 6;
            var l = this.label === undefined ? "": "'"+this.label+"' ";                                
            if(this.isEmpty()){
                return "Vec : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;
            }
            return "Vec: "+l+"("+ this.x.toFixed(precision) + ", "+this.y.toFixed(precision) + ")"; // returns String
        },        
        setAs : function(vec,num){  // Sets this vec to the values in the {avec} or if two args then assumed to be numbers x and y
            if(num === undefined){
                this.x = vec.x;
                this.y = vec.y;
            }else{
                this.x = vec;
                this.y = num;
            }
            return this;  // Returns the existing this
        }, 
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this);                
                return vecArray;                
            }
            vecArray.push(this.copy());
            return vecArray;
        }, 
        asBox : function(box){  // returns the bounding box that envelops this vec
            if(box === undefined){
                var box = new Box();  // {obox} is created if not supplied
            }
            box.env (this.x, this.y);
            return box;  // returns box
        },
        isEmpty : function (){  // returns true if undefined or infinit
            if(this.x === undefined || this.y === undefined || 
                this.x === Infinity || this.y === Infinity || 
                this.x === -Infinity || this.y === -Infinity ||
                isNaN(this.x) || isNaN(this.y)){
                    return true;
            }
            return false;  
        },
        empty : function(){
            this.y = this.x = Infinity;
            return this;
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
        lerp : function(from,dest,amount){
            this.x = (dest.x-from.x) * amount + from.x;
            this.y = (dest.y-from.y) * amount + from.y;
            return this;
        },
        vectorToPolar : function(){
            v1.x = this.x;
            v1.y = this.y;
            this.x = Math.hypot(v1.y,v1.x);
            this.y = Math.atan2(v1.y,v1.x);            
            return this;
        },
        polarToVector : function(){
            v1.x = this.x;
            v1.y = this.y;
            this.x = Math.cos(v1.y) * v1.x;
            this.y = Math.sin(v1.y) * v1.x;            
            return this;            
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
        dotUnit : function(vec){  // returns the dot product of this and vec divided by the magnitude of this
            return (this.x * vec.x + this.y * vec.y) / (this.x * this.x + this.y * this.y);
        },
        cross : function(vec){ // get the cross product of this and the {avec}
            return this.x * vec.y - this.y * vec.x; // returns number
        },
        crossUnit : function(vec){  // returns the dot product of this and vec divided by the magnitude of this
            return (this.x * vec.y - this.y * vec.x) / (this.x * this.x + this.y * this.y);
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
        direction : undefined, // defaults to undefined which is the same as false and means clockwise, if true makes the are anticlockwise. This is an late addition and thus makes all of arc a little obsolete but for rendering this is needed.
        type : "Arc",
        copy : function(){
            return new Arc(this.circle.copy(), this.start, this.end, this.direction);
        },
        setAs : function (arc){
            this.circle.setAs(arc.circle);
            this.start = arc.start;
            this.end = arc.end;
            this.direction = arc.direction;
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
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.circle.center);                
                return vecArray;                
            }                        
            vecArray.push(this.circle.center.copy());
            return vecArray;
        },          
        isEmpty : function(){
            if(this.start === this.end || 
                    this.start === Infinity || this.end === Infinity || 
                    this.start === -Infinity || this.end === -Infinity || 
                    this.start === undefined || this.end === undefined ||
                    isNaN(this.start) || isNaN(this.end) ||
                    this.circle.isEmpty()){
                return true;
            }
            return false;
        },
        empty : function(){
            this.start = Infinity;
            this.end = Infinity;
        },
        toString : function(precision){
            var l = this.label === undefined ? "": "'"+this.label+"' ";  
            if(this.isEmpty()){
                return "Arc : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;
            }
            var str =  "Arc : "+l+"( "+this.circle.toString(precision)+", ";
            str += "Start : " + this.start.toFixed(precision) + ", "
            str += "End : " + this.end.toFixed(precision) + ", "
            str += this.direction ? "Clockwise" : "Anticlockwise";
            str += ")";
            return str;
            
        },
        asCircle : function(){
            return this.circle.copy();
        },
        asTriangles : function(sides,sector,array){
            sides = sides === undefined || sides === null ? 8 : Math.max(4,Math.floor(sides));
            var steps = (this.end - this.start)/sides;
            var i,cx,cy,x,y,xx,yy,c,a,px,py,r;
            px = cx = this.circle.center.x;
            py = cy = this.circle.center.y;
            r = this.circle.radius;
            x = cx + Math.cos(this.start) * r;
            y = cy + Math.sin(this.start) * r;                
            if(sector !== true){
                px = (x + cx + Math.cos(this.end) * r) /2;
                py = (y + cy + Math.sin(this.end) * r) /2; 
            }
            if(array === undefined){
                array = [];
            }
            c = 0;
            x = cx + Math.cos(this.start) * r;
            y = cy + Math.sin(this.start) * r;
            for(i = this.start + steps; i < this.end + steps/2; i += steps,c++){
                xx = cx + Math.cos(i) * r;
                yy = cy + Math.sin(i) * r;
                a = array[c];
                if(a === undefined){
                    array[c] = new Triangle(new Vec(px,py),new Vec(x,y),new Vec(xx,yy));
                }else{
                    a.p1.x = px;
                    a.p1.y = py;
                    a.p2.x = x;
                    a.p2.y = y;
                    a.p3.x = xx;
                    a.p3.y = yy;
                }
                x = xx;
                y = yy;
            }
            return array;

            
        },    
        lerp : function(from, dest, amount){
            this.circle.center.x = (dest.circle.center.x - from.circle.center.x) * amount + from.circle.center.x;
            this.circle.center.y = (dest.circle.center.y - from.circle.center.y) * amount + from.circle.center.y;
            this.circle.radius = (dest.circle.radius - from.circle.radius) * amount + from.circle.radius;
            this.start = (dest.start - from.start) * amount + from.start;
            this.end = (dest.end - from.end) * amount + from.end;
            return this;
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
            var pa = this.circle.intercept(circle);
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
        fromVec3 : function (vec1, vec2, vec3){ // creates an arc that fits the three vectors if posible If points are on a line then an empty arc is returned
            // This function uses Geom registers v1
            // v1 is the center of the circle if return is not empty 
            this.circle.fromVec3(vec1, vec2, vec3);
            if(this.circle.radius !== Infinity){
                this.start = a = ((Math.atan2(vec1.y - v1.y, vec1.x - v1.x) % MPI2) + MPI2) % MPI2;  // start
                b = ((Math.atan2(vec2.y - v1.y, vec2.x - v1.x) % MPI2) + MPI2) % MPI2;
                this.end = c = ((Math.atan2(vec3.y - v1.y, vec3.x - v1.x) % MPI2) + MPI2) % MPI2;  // end
                if(a > c){
                    a -= MPI2;
                }
                if(b > a && b < c){ // based on the assumption that this quicker than || or !(b > a && b < c)
                }else{
                    b -= MPI2;
                    if(b > a && b < c){ // based on the assumption that this quicker than ||
                    }else{
                        this.start = c;
                        this.end = a;
                    }
                }
            }else{
                this.start = Infinity;
                this.end = Infinity;
            }
            return this;
        },
        fromTriangle : function (triangle){// positions and sets radius to fit all 3 points of the triangle if posible. If not returns empty circle
            return this.fromVec3(triangle.p1,triangle.p2,triangle.p3);
        },       
        fitToCircles : function(cir1,cir2,rule){ // fits this arc to the two circle 
            this.circle.fitToCircles(cir1,cir2,rule);
            if(!this.circle.isEmpty()){
                this.startFromVec(cir1.center).endFromVec(cir2.center);
            }
            return this;
        },
        swap : function(direction){ // start and end points, or is direction is true then swaps the direction between clockwise and anti clockwise
            if(direction){
                this.direction = ! this.direction;
                return this;
            }
            c = this.start;
            this.start = this.end;
            this.end = c;
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
        addToRadius : function ( number ){
            this.circle.radius += number;
            return this; // returns this.            
        },
        multiplyRadius : function ( number ){
            this.circle.radius *= number;
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
        endsAsVec : function(vecArray, vecEnd) {  // if vecArray is array then vecEnd is ignored if vecArray is a vec then vecEnd nust be included or only start vec is returned
            if(vecArray === undefined){
                vecArray = new VecArray();
            }
            if(vecArray.type === "VecArray"){
                vecArray.push(new Vec(this.circle.center.x + Math.cos(this.start) * this.circle.radius,this.circle.center.y + Math.sin(this.start) * this.circle.radius))
                        .push(new Vec(this.circle.center.x + Math.cos(this.end) * this.circle.radius,this.circle.center.y + Math.sin(this.end) * this.circle.radius))
                return vecArray;   
            }
            vecArray.x = this.circle.center.x + Math.cos(this.start) * this.circle.radius;
            vecArray.y = this.circle.center.y + Math.sin(this.start) * this.circle.radius;     
            if(vecEnd !== undefined){
                vecEnd.x = this.circle.center.x + Math.cos(this.end) * this.circle.radius;
                vecEnd.y = this.circle.center.y + Math.sin(this.end) * this.circle.radius;               
            }
            return  vecArray;    
        },
        startAsVec : function(vec) { 
            if(vec === undefined){
                return new Vec(this.circle.center.x + Math.cos(this.start) * this.circle.radius,this.circle.center.y + Math.sin(this.start) * this.circle.radius);;
            }
            vec.x = this.circle.center.x + Math.cos(this.start) * this.circle.radius;
            vec.y = this.circle.center.y + Math.sin(this.start) * this.circle.radius;
            return vec;
        },
        endAsVec : function(vec) { 
            if(vec === undefined){
                return new Vec(this.circle.center.x + Math.cos(this.end) * this.circle.radius,this.circle.center.y + Math.sin(this.end) * this.circle.radius);
            }
            vec.x = this.circle.center.x + Math.cos(this.end) * this.circle.radius;
            vec.y = this.circle.center.y + Math.sin(this.end) * this.circle.radius;
            return vec
        },
        startFromVec : function(vec){ // sets the start as the angle from this arcs center to vec
            this.start = Math.atan2(vec.y - this.circle.center.y,vec.x - this.circle.center.x);
            return this;
        },
        endFromVec : function(vec){ // sets the start as the angle from this arcs center to vec
            this.end = Math.atan2(vec.y - this.circle.center.y,vec.x - this.circle.center.x);
            return this;
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
        clockwise : function(){
            this.direction = false;
            return this;
        },
        anticlockwise : function(){
            this.direction = true;
            return this;
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
        fitCornerConstrain : function(line1,line2,cornerUnknown,constraint,data){ // set Circle.fitCornerConstrain for full details as this function calls that function
            this.circle.fitCornerConstrain(line1,line2,cornerUnknown,constraint,data);
            if(this.circle.center.x !== Infinity){ // if the solution is found        
                v4.x = v3.x + v1.x * c1; // contact point on line1
                v4.y = v3.y + v1.y * c1;
                v5.x = v3.x + v2.x * c1; // contact point on line2
                v5.y = v3.y + v2.y * c1;
                if(b < 0){  // swap start and end depending corner is left inside or right inside
                    this.start = Math.atan2(v4.y-this.circle.center.y,v4.x-this.circle.center.x);
                    this.end = Math.atan2(v5.y-this.circle.center.y,v5.x-this.circle.center.x);
                    this.direction = true; // make this anti-clockwise
                    //this.swap(true).swap();
                }else{
                    this.start = Math.atan2(v4.y-this.circle.center.y,v4.x-this.circle.center.x);
                    this.end = Math.atan2(v5.y-this.circle.center.y,v5.x-this.circle.center.x);
                    this.direction = false; // make this clockwise
                }
                    
            }            
            return this;
        },
        fitCorner : function(line1,line2,cornerUnknown){ // set Circle.fitCorner for full details as this function calls that function
            // This uses Geom.registers v1,v2,v3,v4,v5,a,b,c1,c
            // v1,v2,v3 if cornerUnknown is true may be invalid if return circle is empty, all other cases they will be valid
            // v1 is the vector of line1 in the directio away from the corner
            // v2 is the vector of line2 in the directio away from the corner
            // v3 is the corner location           
            // v4 and v5 are set only if the is a valid solution is found for this.circle.fitCorner
            // v4 is contact point on line1;
            // v5 is contact point on line2;
            // if result is not empty or cornerUnknow is undefined or false then a,b,c,c1 will be valid
            // a distance along the normal from line2 to center of circle (can be + or -)
            // b the cross product of the outgoing and incoming lines
            // c half the the angle in radians between the incoming and out going lines
            // c1 distance from the corner point v3 along the vectors V1,v2 to the tangent points
            this.circle.fitCorner(line1,line2,cornerUnknown);
            if(this.circle.center.x !== Infinity){ // if the solution is found
                v4.x = v3.x + v1.x * c1; // contact point on line1
                v4.y = v3.y + v1.y * c1;
                v5.x = v3.x + v2.x * c1; // contact point on line2
                v5.y = v3.y + v2.y * c1;
                if(b < 0){  // swap start and end depending corner is left inside or right inside
                    this.start = Math.atan2(v4.y-this.circle.center.y,v4.x-this.circle.center.x);
                    this.end = Math.atan2(v5.y-this.circle.center.y,v5.x-this.circle.center.x);
                    this.direction = true; // make this anti-clockwise
                    //this.swap(true).swap();
                }else{
                    this.start = Math.atan2(v4.y-this.circle.center.y,v4.x-this.circle.center.x);
                    this.end = Math.atan2(v5.y-this.circle.center.y,v5.x-this.circle.center.x);
                    this.direction = false; // make this clockwise
                }
                    
            }

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
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.center);                
                return vecArray;                
            }             
            vecArray.push(this.center.copy());
            return vecArray;
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
        toString : function (precision){
            var l = this.label === undefined ? "": "'"+this.label+"' ";              
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            return "Circle: "+l+"Center ("+this.center.toString(precision)+") Radius "+this.radius.toFixed(precision);
        },
        asTriangles : function(sides,array){
            sides = sides === undefined || sides === null ? 8 : Math.max(4,Math.floor(sides));
            var steps = MPI2/sides;
            var i,cx,cy,x,y,xx,yy,c,a;
            x = (cx = this.center.x) + this.radius;
            y = cy = this.center.y;
            if(array === undefined){
                array = [];
            }
            c = 0;
            for(i = steps; i < MPI2 + steps/2; i += steps,c++){
                xx = cx + Math.cos(i) * this.radius;
                yy = cy + Math.sin(i) * this.radius;
                a = array[c];
                if(a === undefined){
                    array[c] = new Triangle(new Vec(cx,cy),new Vec(x,y),new Vec(xx,yy));
                }else{
                    a.p1.x = cx;
                    a.p1.y = cy;
                    a.p2.x = x;
                    a.p2.y = y;
                    a.p3.x = xx;
                    a.p3.y = yy;
                }
                x = xx;
                y = yy;
            }
            return array;  
        },
        lerp : function(from, dest, amount){
            this.center.x = (dest.center.x - from.center.x) * amount + from.center.x;
            this.center.y = (dest.center.y - from.center.y) * amount + from.center.y;
            this.radius = (dest.radius - from.radius) * amount + from.radius;
            return this;
        },        
        isEmpty : function(){  // returns true for empty circle
            if( this.center.x === Infinity || // many cases see a divid by zero the result will have both x and y as Infinity. This assumes this empty circle is more common than a radius === infinity. It also alows better performance and conveniance by having the function Circle.empty set this.center.x to infinity rather than radius which many times is requiered to be preserved despite the circle center being unknown
                    this.radius === 0 ||                    
                    this.radius === Infinity || 
                    this.radius === -Infinity ||
                    isNaN(this.radius) ||
                    this.center === undefined || 
                    this.center.isEmpty()){
                return true;
            }
            return false;
        },
        empty : function(){
            this.center.x = Infinity;
            return this;
        },
        setRadius : function (r){
            this.radius = r;
            return this;
        },
        addToRadius : function ( number ){
            this.radius += number;
            return this; // returns this.            
        },
        multiplyRadius : function ( number ){
            this.radius *= number;
            return this; // returns this.            
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
        fromVec2 : function (vec1, vec2, method){
            if(method === undefined || method === "radius"){
                this.center.x = vec1.x;
                this.center.y = vec1.y;
                this.radius = Math.hypot(vec1.x - vec2.x,vec1.y - vec2.y);
                return this;
            }
            this.center.x = (vec1.x + vec2.x) / 2;
            this.center.y = (vec1.y + vec2.y) / 2;
            this.radius = Math.hypot(vec1.x - vec2.x,vec1.y - vec2.y)/2;
            return this;
        },
        fromVec3 : function (vec1, vec2, vec3){ // positions and sets radius to fit all 3 points if posible. If not returns empty circle
            // This function uses Geom registers v1,c,c1u
            // v1 is the center of the circle if not empty
            // Code Notes
            // Other functions rely on v1 being the circle center if return is not empty
            
            c = (vec2.x - vec1.x) / (vec1.y - vec2.y); // slope of vector from vec 1 to vec 2
            c1 = (vec3.x - vec2.x) / (vec2.y - vec3.y); // slope of vector from vec 2 to vec 3
            if (c === c1)  { // Both are vector  so if slope is the same they must be on the same line
                return this.empty();  // points are in a line 
            }            
            // locate the center
            if(vec1.y === vec2.y){   // special case with vec1 and 2 have same y 
                v1.x = ((vec1.x + vec2.x) / 2);
                v1.y = c1 * v1.x + (((vec2.y + vec3.y) / 2) - c1 * ((vec2.x + vec3.x) / 2));  
            }else
            if(vec2.y === vec3.y){ // special case with vec2 and 3 have same y 
                v1.x = ((vec2.x + vec3.x) / 2);
                v1.y = c * v1.x + (((vec1.y + vec2.y) / 2) - c * ((vec1.x + vec2.x) / 2));  
            } else{
                v1.x = ((((vec2.y + vec3.y) / 2) - c1 * ((vec2.x + vec3.x) / 2)) - (u = ((vec1.y + vec2.y) / 2) - c * ((vec1.x + vec2.x) / 2))) / (c - c1);
                v1.y = c * v1.x + u;
            }
            this.radius = Math.hypot(vec1.x - (this.center.x = v1.x), vec1.y - (this.center.y = v1.y));
            return this;
        },
        fromArea : function(area){
            this.radius = Math.sqrt(area / (Math.PI * 2));
        },
        fromTriangle : function (triangle){// positions and sets radius to fit all 3 points of the triangle if posible. If not returns empty circle
            return this.fromVec3(triangle.p1,triangle.p2,triangle.p3);
        },
        fromCircumference  : function(leng){
            this.radius = leng / (Math.PI * 2);
        },
        isTouching : function(circle){ // returns true if this circle is in contact with circle false if not
            if(this.center.copy().sub(circle.center).leng() > this.radius + circle.radius){
                return false;
            }
            return true;
        },
        isTouchingLine : function(line){ // returns true is this circle is in contact with the line false if not
            if(line.distFrom(this.center) > this.radius){
                return false
            }
            return true;
        },
        isRectangleInside : function(rectangle){ // return true if rectangle is inside the circle false if not
            // This function uses V1 and v2
            // Only if this function can v1 and v2 be considered valid
            // v1 is the bottom lefy corner of the rectangle only if true returned
            // v2 is the bottom right corner of the rectangle only if true returned 
            // Note though it is posible for v2 to hold the correct value it can not be termined from this function alone,
            // but v2 will be writen to thus looking for a change can be used at your own risk
            if(Math.hypot(rectangle.top.p1.x - this.center.x, rectangle.top.p1.y - this.center.y) < this.radius &&
                    Math.hypot(rectangle.top.p2.x - this.center.x, rectangle.top.p2.y - this.center.y) < this.radius){
                 v1.x = rectangle.top.p2.x - (v2.x = rectangle.top.p1.x);
                 v1.y = rectangle.top.p2.y - (v2.y = rectangle.top.p1.y);
                 v2.x += -v1.y * rectangle.aspect;
                 v2.y += v1.x * rectangle.aspect;
                 if(Math.hypot(v2.x - this.center.x, v2.y - this.center.y) < this.radius && 
                        Math.hypot((v1.x += v2.x) - this.center.x,(v1.y += v2.y) - this.center.y) < this.radius){
                       return true;
                 }
            }
            return false;
        },
        isCircleInside : function(circle){ // returns true is circle is inside this circle
            return (Math.hypot(this.center.x - circle.center.x,this.center.y - circle.center.y)-this.radius + circle.radius < 0);
        },
        isLineInside : function(line){ // returns true is the line segment line is inside the circle
            // using the ? is a little quicker then returning the contional result as ? will return if the first point fails while the conditional method always does both tests
            return (
                Math.hypot(this.center.x - line.p1.x,this.center.y - line.p1.y) < this.radius &&
                Math.hypot(this.center.x - line.p2.x,this.center.y - line.p2.y) < this.radius ) ? true : false;
            
        },
        isVecInside : function(vec){
            return  Math.hypot(this.center.x - vec.x,this.center.y - vec.y) < this.radius;
        },        
        isPointInside : function(vec){
            return  Math.hypot(this.center.x - vec.x,this.center.y - vec.y) < this.radius;
        },
        distFrom : function(vec){ // returns the distance from the circle circumferance to the point vec
            return  Math.hypot(this.center.x - vec.x,this.center.y - vec.y)-this.radius;
        },
        fitToCircles : function(circle1, circle2, rule){ // fits this circle so that it touches circle1 and circle2 using the rules in rule
            // rule = "left"  will fit this circle to the left of the line from circle1 to circle 2
            // rule = "limit" will limit the circle to not cross the line between circle1 and circle 2
            // rule = "grow" if included will grow the radius of to fit if needed
            if(rule === undefined){
                rule = "";
            }else{
                rule = rule.toLowerCase();
            }
            v1.x = circle2.center.x - circle1.center.x;
            v1.y = circle2.center.y - circle1.center.y;
            a = Math.hypot(v1.x,v1.y);  // get the length of the lines between all three
            b = circle1.radius + this.radius;  // must touch so add radiuss
            c = circle2.radius + this.radius;
            if(rule.indexOf("limit") > -1){
                // need to find a solution that limits te circle to the left or Right of the center line
                var B = circle2.radius
                var A = circle1.radius
                var C = a;
                // Need to find radius of this circle. but first where on the line between cir1 and cir2 the circle touches
                // u1 + u2 = C  where C is the length of the line between circles u1 is from fisrt u2 for second to the point where this circle will touch
                // r = (u1 * u1 - A * A) / (2 * A) first cir
                // r = (u2 * u2 - B * B) / (2 * B) second cir
                // r = ((u1 * u1) - (A * A)) / (2 * A) = ((u2 * u2) - (B * B))/ (2 * B)
                // Two unknowns u1 and u2 so in terms of u2 = C - u1 to give one unknown thus solve the following
                // I know u2 = C - u1 to give one unknown thus solve the following
                // 0 = ((u1 * u1) - (A * A)) / (2 * A) - ((C - u1) * (C - u1)) - (B * B)) / (2 * B)
                // Is quadratic so use quadratic rule to solve positive solution only and get radius using first circle
                var r = (Math.pow( (-((2 * C * A) / B) + Math.sqrt(((2 * C * A) / B) * ((2 * C * A) / B) - (4 - 4 * A / B) * -(- B * A + A * A + (C * C * A) / B))) / -(2 -  2 * A / B), 2) - A * A) / (2 * A);
                this.radius = r;
                b = circle1.radius + r;
                c = circle2.radius + r;

            }else
            if(a > b + c){ // gap is too large can not fit
                if(rule.indexOf("grow") > -1){
                    this.radius += u = (a - (b+c))/2;
                    b += u;
                    c += u;
                }else{
                    this.empty();
                    return this;
                }
            }
            u = Math.sin(u1 = Math.triPh(a,b,c));
            // u1 is dist from c1 to point on line then out from there at norm  u to line to find center
            v2.x = v1.x / a; // normalise line between 
            v2.y = v1.y / a;
            u1 = Math.cos(u1);
            v3.x = v2.x * b * u1;
            v3.y = v2.y * b * u1;
            if(rule.indexOf("left") > -1){
                v3.y -= v2.x * b * u;
                v3.x += v2.y * b * u;
            }else{
                v3.y += v2.x * b * u;
                v3.x -= v2.y * b * u;
            }
            this.center.x = circle1.center.x + v3.x;
            this.center.y = circle1.center.y + v3.y;
            return this;
        },
        closestPoint : function(vec,retVec){  // legacy calls closestPointToVec
            return this.closestPointToVec(vec,retVec);
        },
        closestPointToLine : function(line,retVec){ // only valid if the line is not touching the circle
            return this.closestPointToVec(line.closestPoint(this.center,va),retVec);
        },
        closestPointToVec : function(vec,retVec){ // returns the closest point on the circle to the point vec
            v1.x = vec.x - this.center.x;
            v1.y = vec.y - this.center.y;
            var u = this.radius / Math.hypot(v1.x,v1.y);
            if(retVec === undefined){
                retVec = new Vec();
            }
            retVec.x = this.center.x + (v1.x *= u);
            retVec.y = this.center.y + (v1.y *= u);
            return  retVec;
        },
        clipLine : function(line,retLine){ // returns a new line that is clipped to inside the circle.
            // returns a line. If retLine is given then that line is set with the result and returned. If retLine is not given then a new Line is created.
            // If no intercepts are found then an empty line is returned. Use Line.isEmpty to determin if a line is empty
            // If one or more intercepts are found then the line is returned in the same direction as the input line.
            // The returned line may have zero length 
            
            // this function uses v1, v2, v3, v4
            // v1 is the line as a vector
            // v2 is the vector from the line start to the circle center
            // v3.x is the unit distance from the line start to the first intercept point
            // v3.y is this unit distance from the line start to the second intercept point 
            // v3 Both x, and y  may === Infinity or both !== Infinity
            // v4.x distance squared from circle center of line start
            // v4.y distance from circle center of line end

            if(retLine === undefined){
                retLine = line.copy();
            }        
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            v2.x = line.p1.x - this.center.x;
            v2.y = line.p1.y - this.center.y;
            v4.y = Math.hypot(line.p2.x - this.center.x, line.p2.y - this.center.y);
            v4.x = v2.x * v2.x + v2.y * v2.y;
            if(Math.sqrt(v4.x) < this.radius){                
                retLine.p1.x = line.p1.x;
                retLine.p1.y = line.p1.y;
                if(v4.y < this.radius){
                    retLine.p2.x = line.p2.x;
                    retLine.p2.y = line.p2.y;
                    return retLine;
                }else{
                    retLine.p2.empty();
                }
            }else{
                retLine.p1.empty();
                if(v4.y < this.radius){
                    retLine.p2.x = line.p2.x;
                    retLine.p2.y = line.p2.y;
                }else{
                    retLine.p2.empty();
                }                  
            }                

            
            c = 2 * (v1.x * v1.x + v1.y * v1.y);
            var b = -2 * (v1.x * v2.x + v1.y * v2.y);
            var d = Math.sqrt(b * b - 2 * c * (v4.x  - this.radius * this.radius));
            if(isNaN(d)){ // no intercept
                v3.x = v3.y = Infinity;
            }else{
                v3.x = (b - d) / c;
                v3.y = (b + d) / c;
                // Add second point first incase the line being set is the same line pased as first argument
                if(v3.y <= 1 && v3.y >= 0){  
                    retLine.p2.x = line.p1.x + v1.x * v3.y;
                    retLine.p2.y = line.p1.y + v1.y * v3.y;
                }
                if(v3.x <= 1 && v3.x >= 0){  
                    retLine.p1.x = line.p1.x + v1.x * v3.x;
                    retLine.p1.y = line.p1.y + v1.y * v3.x;
                }
                return retLine;
            }
            return retLine.empty();
            
        
        },
        interceptLineSeg : function(line, retLine){ // Finds if they exist the intercepts of a line segment and this circle
            // returns a line. If retLine is given then that line is set with the result and returned. If retLine is not given then a new Line is created.
            // If no intercepts are found then an empty line is returned. Use Line.isEmpty to determin if a line is empty
            // If one or more intercepts are found then the line is returned in the same direction as the input line.
            // The returned line may have zero length 
            
            // this function uses v1, v2, v3
            // v1 is the line as a vector
            // v2 is the vector from the line start to the circle center
            // v3.x is the unit distance from the line start to the first intercept point
            // v3.y is this unit distance from the line start to the second intercept point 
            // v3 Both x, and y  may === Infinity or both !== Infinity

            if(retLine === undefined){
                retLine = line.copy();
            }        
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            v2.x = line.p1.x - this.center.x;
            v2.y = line.p1.y - this.center.y;
            var b = (v1.x * v2.x + v1.y * v2.y);

            
            c = 2 * (v1.x * v1.x + v1.y * v1.y);
            b *= -2;
            var d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - this.radius * this.radius));
            if(isNaN(d)){ // no intercept
                v3.x = v3.y = Infinity;
            }else{
                v3.x = (b - d) / c;
                v3.y = (b + d) / c;
                // Add second point first incase the line being set is the same line pased as first argument
                if(v3.y <= 1 && v3.y >= 0){  
                    retLine.p2.x = line.p1.x + v1.x * v3.y;
                    retLine.p2.y = line.p1.y + v1.y * v3.y;
                }else{
                    retLine.p2.x = retLine.p2.y = undefined;
                }
                if(v3.x <= 1 && v3.x >= 0){  
                    retLine.p1.x = line.p1.x + v1.x * v3.x;
                    retLine.p1.y = line.p1.y + v1.y * v3.x;
                }else{
                    retLine.p1.x = retLine.p1.y = undefined;
                }
                return retLine;
            }
            return retLine.empty();
        },
        interceptLine : function(line, retLine){// find the points if any where this circle intercepts the line
            // returns a line. If retLine is given then that line is set with the result and returned. If retLine is not given then a new Line is created.
            // If no intercepts are found then an empty line is returned. Use Line.isEmpty to determin if a line is empty
            // If intercepts are found then the line is returned in the same direction as the input line.
            // The returned line may have zero length 
            
            // This function uses v1,v2,v3,v4;  NOTE that this function differs from interceptLineSeg
            // v1 will hold the vector from the center the cord between the intercepts to the furthest intercept or if no intercept see line.distFrom for value of v2
            // v2 will hold the center of the cord between the intercepts or if no intercept see line.distFrom for value of v2
            // v3 Unchanged from line.distFrom(this.center) see that function for details
            // v4.x is the distance from the center to the line
            if(retLine === undefined){
                retLine = line.copy();
            }        

            var d;
            v4.x =  line.distFrom(this.center); // dist from line
            if(v4.x <= this.radius){
                v2.x = v3.x + line.p1.x; // v3 is from function line.distFrom
                v2.y = v3.y + line.p1.y;
                var d = Math.sqrt(this.radius*this.radius- v4.x * v4.x) / line._leng;
                v1.x *= d;
                v1.y *= d;

                retLine.p1.x = v2.x - v1.x;
                retLine.p1.y = v2.y - v1.y;
                retLine.p2.x = v2.x + v1.x;
                retLine.p2.y = v2.y + v1.y;
                return retLine;
            }
            return retLine.empty();
        },
        interceptLineSelect : function(line,which,limit, retVec){// find a point if any where the line intercets the circle. which indicates which point, limit tells what to do when intercept is outside the line seg
            // which === 0 [defualt] means the closest point from the start (for limit 0,1) and end (for limit -1)
            // which === 1 means the furerest point from the line start  (for limit 0,1) and end (for limit -1)
            // limit === 0 [defualt] means only points on the line segment
            // limit === 1 means only points infront of and including start
            // limit === -1 means only points behind of and including end
            
            
            // This function uses v1,v2;  
            // v1 is the line as a vector
            // v2 is the vector from the line start to the circle center
            
            
            if(retVec === undefined){
                retVec = new Vec();
            }        
      
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            v2.x = line.p1.x - this.center.x;
            v2.y = line.p1.y - this.center.y;
            var b = (v1.x * v2.x + v1.y * v2.y);

            
            c = 2 * (v1.x * v1.x + v1.y * v1.y);
            b *= -2;
            var d = Math.sqrt(b * b - 2 * c * (v2.x * v2.x + v2.y * v2.y - this.radius * this.radius));
            if(isNaN(d)){ // no intercept
                v3.x = v3.y = Infinity;
            }else{
                u = (b - d) / c;
                u1 = (b + d) / c;
                // Add second point first incase the line being set is the same line pased as first argument
                if(which === 0 || which === undefined){
                    if(limit === 0 || limit === undefined){
                        if(u >= 0 && u1 >= 0 && u<= 1 && u1 <= 1){
                            c = Math.min(u,u1);
                        }else
                        if(u >= 0 && u<= 1){
                            c = u;
                        }else
                        if(u1 >= 0 && u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                    }else
                    if(limit === 1){
                        if( u >= 0 && u1 >= 0){
                            c = Math.min(u,u1);
                        }else
                        if( u >= 0 ){
                            c = u;
                        }else
                        if( u1 >= 0){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                     }else{
                        if( u <= 1 && u1 <= 1){
                            c = Math.max(u,u1);
                        }else
                        if( u <= 1 ){
                            c = u;
                        }else
                        if( u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }                           
                     }      
                }else{
                    if(limit === 0 || limit === undefined){
                        if(u >= 0 && u1 >= 0 && u<= 1 && u1 <= 1){
                            c = Math.max(u,u1);
                        }else
                        if(u >= 0 && u<= 1){
                            c = u;
                        }else
                        if(u1 >= 0 && u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                    }else
                    if(limit === 1){
                        if( u >= 0 && u1 >= 0){
                            c = Math.max(u,u1);
                        }else
                        if( u >= 0 ){
                            c = u;
                        }else
                        if( u1 >= 0){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }
                     }else{
                        if( u <= 1 && u1 <= 1){
                            c = Math.min(u,u1);
                        }else
                        if( u <= 1 ){
                            c = u;
                        }else
                        if( u1 <= 1){
                            c = u1;
                        }else{
                            return retVec.empty();
                        }                           
                     }      
                }
                retVec.x = line.p1.x + v1.x * c;
                retVec.y = line.p1.y + v1.y * c;
                return retVec;
            }
            return retVec.empty();
        },
        intercept : function(circle){ // find the points if any where this circle and circle intercept
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
        tangentLineAtVec : function(vec,retLine ){
            this.closestPointToVec(vec,va);
            if(retLine === undefined){
                return new Line(va.copy(),new Vec(va.x - v1.y,va.y + v1.x));                
            }
            retLine.p1.x = va.x;
            retLine.p1.y = va.y;
            retLine.p2.x = va.x - v1.y;
            retLine.p2.y = va.y + v1.x;
            return retLine;
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
                .push(new Vec(undefined,a1-a).mult(this.radius).add(this.center))
                .push(new Vec(undefined,a1+a).mult(this.radius).add(this.center))
        },
        reflectLine : function(line){ // WTF sorry will fix in time
            var va = new VecArray();
            var pa = this.interceptLine(line);
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
        fitCornerConstrain : function(line1,line2,cornerUnknown,constraint,data){ // fits the corner with constraints
            // set this.fitCorner for details
            // constraint is optional and of not defined returns the same as fitCorner
            // constraint is a command string, 
            // data is extra data requiered to complet the commands
            // data is optional and dependent on the command string
            // commands are case insensitive
            // "limit" Limits the distance from the corner that the circle can be. It will reduce or increase the radius to fit this limit
            //    if
            //       "max" limit is on the max line length
            //       "min" limit is on the min line length            
            //    else 
            //        the limit is on the average line length
            //
            //    if
            //       "half" is halves the limit length
            //       "quarter" quarters the limit
            //    else
            //       if data then use data as a scale
            //       else do not change the line length;
            //    The circle is now changed to fit the corner with limit
            //
            this.fitCorner(line1,line2,cornerUnknown);
            if(this.center.x === Infinity){
                return this;
            }
            if(constraint === undefined){
                return this;
            }else{
                constraint = constraint.toLowerCase();
            }
            if(constraint.indexOf("limit") >= -1){
                if(constraint.indexOf("max") >= -1){
                    d = Math.max(u1,u);
                }else
                if(constraint.indexOf("min") >= -1){
                    d = Math.min(u1,u);
                }else{
                    d = (u1 + u)/2;
                }
                    
                if(constraint.indexOf("half") >= -1){
                    d /= 2;
                }else
                if(constraint.indexOf("quarter") >= -1){
                    d /= 4;
                }else{
                    if(data !== undefined){
                        d *= data;
                    }
                }
                // move the circle and adjust center to not go past the limit
                if( c1 > d){
                    a *= d/c1;
                    this.radius *= d/c1;
                    c1 = d;
                    this.center.x = v3.x + v2.x * c1 - v2.y * a;
                    this.center.y = v3.y + v2.y * c1 + v2.x * a;
                }                    
            }
            
            return this;
            
        },
        fitCorner : function(line1,line2,cornerUnknown){ // fits this circle, keeping its radius to the corner made by the two lines where the end of l1 is the start of line2
                                            // it is made to fit so that the lines become tagents at the ponits of contact
                                            // The optional argument. cornerUnknown if set true means that it is unknown which point is the corner
                                            // thus this function will find it for you. If cornerUnknown and no points are within EPSILON to each other then this can not resolve the problem and will return this as an empty circle;
                                            
            // this function uses registers v1,v2,v3,u,u1,c,c1,b
            // if cornerUnknown and the corner is not found returning empty circle then no registers can be relied onLine
            // v1 is the normalised vector of line2 from corner point
            // v2 is the normalised vector of line2 from corner point
            // v3 is the corner points takend from line2 if cornerUnknown is true then this will be the corner if falsy then the corner may not be the true corner but the start of line2
            // u is the length of line 1
            // u1 is the length of line 2
            // c is half the angle between the lines
            // c1 is the distance from the corner to where the circle touches
            // a is the magnitude of the normal from line2 to the circle center
            // b is the cross product of the vectors v1 and v2 and its sign indicates the side (+left -right) of the line the circle is
            if(cornerUnknown){ // find corner can be one of four cases
                // line1 end and line2 start
                c = Math.hypot(line1.p2.x - line2.p1.x,line1.p2.y - line2.p1.y); // dist 
                if(c <= EPSILON){
                    v1.x = line1.p1.x - line1.p2.x; // reverse incoming line
                    v1.y = line1.p1.y - line1.p2.y;
                    v2.x = line2.p2.x - (v3.x = line2.p1.x);
                    v2.y = line2.p2.y - (v3.y = line2.p1.y);
                }else{
                    // line1 end and line2 end
                    c = Math.hypot(line1.p2.x - line2.p2.x,line1.p2.y - line2.p2.y); // dist 
                    if(c <= EPSILON){
                        v1.x = line1.p1.x - line1.p2.x; // reverse incoming line
                        v1.y = line1.p1.y - line1.p2.y;
                        v2.x = line2.p1.x - (v3.x = line2.p2.x);
                        v2.y = line2.p1.y - (v3.y = line2.p2.y);
                    }else{
                        // line1 start and line2 start
                        c = Math.hypot(line1.p1.x - line2.p1.x,line1.p1.y - line2.p1.y); // dist 
                        if(c <= EPSILON){
                            v1.x = line1.p2.x - line1.p1.x; // reverse incoming line
                            v1.y = line1.p2.y - line1.p1.y;
                            v2.x = line2.p2.x - (v3.x = line2.p1.x);
                            v2.y = line2.p2.y - (v3.y = line2.p1.y);
                        }else{
                            // line1 start and line2 end
                            c = Math.hypot(line1.p1.x - line2.p2.x,line1.p1.y - line2.p2.y); // dist 
                            if(c <= EPSILON){
                                v1.x = line1.p2.x - line1.p1.x; // reverse incoming line
                                v1.y = line1.p2.y - line1.p1.y;
                                v2.x = line2.p1.x - (v3.x = line2.p2.x);
                                v2.y = line2.p1.y - (v3.y = line2.p2.y);
                            }else{   
                                // can not resolve corner so return empty circle
                                this.center.x = Infinity;
                            }
                        }
                    }
                }
            } else {            
                v1.x = line1.p1.x - line1.p2.x; // reverse incoming line
                v1.y = line1.p1.y - line1.p2.y;
                v2.x = line2.p2.x - (v3.x = line2.p1.x);
                v2.y = line2.p2.y - (v3.y = line2.p1.y);
            }
            // normalise both vectors
            u = Math.hypot(v1.x,v1.y);
            u1 = Math.hypot(v2.x,v2.y);
            v1.x /= u;
            v1.y /= u;
            v2.x /= u1;
            v2.y /= u1;
            c = Math.asin(b=(v2.x * v1.y - v2.y * v1.x)); // cross product as angle
            c1 = v2.y * v1.y - -v2.x * v1.x;  //
            if(c1 < 0){ // is the angle greater the -90 or 90
                if(c < 0){  // is negative?
                    c = MPI + c;
                    a = -this.radius; // move left of line2
                }else{
                    c = MPI - c;
                    a = this.radius; // // move right of line2
                }                    
            }else{
                if(c < 0){
                    a = -this.radius; // move left of line2                    
                    c = -c;
                }else{
                    a = this.radius; // move right of line2
                }
            }
            // the circle is on the line midway between both lines so div angle by two
            c = c/2;
            // find dist from line2 start to point of circle touching
            c1 = this.radius * Math.cos(c) / Math.sin(c);
            // move center along line2 and then away along the normal of line two
            this.center.x = v3.x + v2.x * c1 - v2.y * a;
            this.center.y = v3.y + v2.y * c1 + v2.x * a;
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
        setEnds : function(vec1, vec2){
            this.p1.x = vec1.x;
            this.p1.y = vec1.y;
            this.p2.x = vec2.x;
            this.p2.y = vec2.y;
            return this;
        },
        isEmpty : function(){ // line is empty if either points are undefined or the length is 0 or any point has Infinity or any point has NaN
            var t;
            if(this.p1 === undefined ||  this.p2 === undefined || 
                    this.p1.x === undefined || this.p1.y === undefined || this.p2.x === undefined || this.p2.y === undefined ||
                    ((this.p1.x - this.p2.x) === 0 &&  (this.p1.y - this.p2.y) === 0) ||
                    (t = Math.abs(this.p1.x + this.p1.y + this.p2.x + this.p2.y)) === Infinity ||
                    isNaN(t)){
                return true;
            }
            return false;
        },
        empty : function (){
            this.p1.x = this.p1.y = this.p2.x = this.p2.y = Infinity;
            return this;
        },
        toString : function (precision){
            var l = this.label === undefined ? "": "'"+this.label+"' ";
            if(this.isEmpty()){
                return "Line: "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            return "Line: "+l+"( "+this.p1.toString(precision)+", "+this.p2.toString(precision)+" )";
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
        lerp : function(from, dest, amount){
            this.p1.x = (dest.p1.x - from.p1.x) * amount + from.p1.x;
            this.p1.y = (dest.p1.y - from.p1.y) * amount + from.p1.y;
            this.p2.x = (dest.p2.x - from.p2.x) * amount + from.p2.x;
            this.p2.y = (dest.p2.y - from.p2.y) * amount + from.p2.y;
            return this;
        },
        asVec : function(vec){  // creates a new vec or uses the supplied ref vec to return the vector representation of line
            if(vec === undefined){
                return new Vec(this.p1,this.p2);
            }
            vec.x = this.p2.x - this.p1.x;
            vec.y = this.p2.y - this.p1.y;
            return vec;
        },
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.p1).push(this.p2);    
                return vecArray;                
            }             
            vecArray.push(this.p1.copy()).push(this.p2.copy());
            return vecArray;
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
        asRectangle : function(height,rect){ // creates a rectangle with the center aligned to this line and width equal to the length of this line and the aspect set to give the requested height
            if(rect === undefined){
                rect = new Rectangle();
            }
            var w;
            w = Math.hypot(v1.y = this.p2.y - this.p1.y, v1.x = this.p2.x - this.p1.x);
            
            v1.x /= w;
            v1.y /= w;
            rect.top.p1.x = this.p1.x + v1.y * (height / 2);
            rect.top.p1.y = this.p1.y - v1.x * (height / 2);
            rect.top.p2.x = rect.top.p1.x + v1.x * w;
            rect.top.p2.y = rect.top.p1.y + v1.y * w;
            rect.aspect = height / w;
            return rect;           

        },
        isVecLeft : function(vec){ // Is the {avec} to the left of this line. Left is left of screen when looking at it and the line moves down.
            if((this.p2.x - this.p1.x) * (vec.y - this.p1.y) - (this.p2.y - this.p1.y) * (vec.x - this.p1.x) < 0){
                return true;
            }
            return false;
        },
        isLineLeft : function(line){ // Is the {aline} to the left of this line. Left is left of screen when looking at it and the line moves down.
            v1.x = this.p2.x - (vx = this.p1.x);
            v1.y = this.p2.y - (vy = this.p1.y);
            v2.x = line.p1.x - vx;
            v2.y = line.p1.y - vy;
            if(v1.x * v2.y - v1.y * v2.y < 0){
                v2.x = line.p2.x - vx;
                v2.y = line.p2.y - vy;
                if(v1.x * v2.y - v1.y * v2.y < 0){
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
        leng2 : function(){ // length squared
            return Math.pow(this.p2.x-this.p1.x,2) + Math.pow(this.p2.y-this.p1.y,2);
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
            var l = Math.hypot(v1.x,v1.y);
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
            // this function uses V1,V2,V3,V4.y where
            // v1 is the vector of this line
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x is not used by this function and will have a random
            // v4.y is unit distance on this line to intercept. Will be undefined if not relevant
            if(rVec === undefined){
                rVec = new Vec();
            }
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than us EPSILON let small values through the result may be infinit but that is more true then no intercept
                v3.x = this.p1.x - line.p1.x; // vector of the differance between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;                
                v4.y = u = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on this line
                rVec.x = this.p1.x + v1.x * u;
                rVec.y = this.p1.y + v1.y * u;
            }else{
                v4.y = rVec.y = rVec.x = undefined;  // create an empty vector
            }
            return rVec;
        },
        interceptSeg : function(line,rVec){ // find the point of intercept between this line segment  and {aline}
            // this function uses V1,V2,V3,V4.y where
            // v1 is the vector of this line
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x is not used by this function and will have a random
            // v4.y is unit distance on this line to intercept. Will be undefined if not relevant           
            if(rVec === undefined){
                rVec = new Vec();
            }
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than us EPSILON let small values through 
                v3.x = this.p1.x - line.p1.x; // vector of the differance between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;
                v4.y = u = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on line
                if(u >= 0 && u <= 1){
                    rVec.x = this.p1.x + v1.x * u;
                    rVec.y = this.p1.y + v1.y * u;
                }else{
                    rVec.y = rVec.x = undefined;  // make an empty vector                         }
                }
            }else{
                rVec.y = rVec.x = v4.y = undefined; // incase V4 is needed && make an empty vector
            }
            return rVec;      
        },
        interceptSegs : function(line,rVec){ // find the point of intercept between this line segment and and the {aline} as a line segment
            // this function uses V1,V2,V3,V4 where
            // v1 is the vector of this line
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x is unit distance on line to intercept.  Will be undefined if not relevant
            // v4.y is unit distance on this line to intercept. Will be undefined if not relevant
            
            if(rVec === undefined){
                rVec = new Vec();
            }
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than us EPSILON let small values through 
                v3.x = this.p1.x - line.p1.x; // vector of the differance between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;
                v4.x = u = (v1.x * v3.y - v1.y * v3.x) / c; // unit distance of intercept point on line
                if(u >= 0 && u <= 1){
                    v4.y = u = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on this line
                    if(u >= 0 && u <= 1){
                        rVec.x = this.p1.x + v1.x * u;
                        rVec.y = this.p1.y + v1.y * u;
                    }else{
                        rVec.y = rVec.x = undefined;  // make an empty vector                    
                    }
                }else{
                    v4.y = rVec.y = rVec.x = undefined;  // make an empty vector                         }
                }
            }else{
                rVec.y = rVec.x = v4.x = v4.y = undefined; // incase V4 is needed && make an empty vector
            }
            return rVec;

        },
        isLineSegsIntercepting : function(line){ // Returns true if the {aline} intercepts this line segment
            // this function uses V1,V2,V3,V4 where
            // v1 is the vector of this line
            // v2 is the vector of line
            // v3 is the vector from the start of this line to the start of line
            // v4.x is unit distance on line to intercept.  Will be undefined if not relevant
            // v4.y is unit distance on this line to intercept. May be random if not relevant only us if return is true
            v1.x = this.p2.x - this.p1.x; // line to vector this line
            v1.y = this.p2.y - this.p1.y;
            v2.x = line.p2.x - line.p1.x; // line to vector arg line
            v2.y = line.p2.y - line.p1.y;
            var c = v1.x * v2.y - v1.y * v2.x; // cross of the two vectors
            if(c !== 0){  // rather than use EPSILON let small values through 
                v3.x = this.p1.x - line.p1.x; // vector of the differance between the starts of both lines;
                v3.y = this.p1.y - line.p1.y;
                v4.x = u = (v1.x * v3.y - v1.y * v3.x) / c; // unit distance of intercept point on line
                if(u >= 0 && u <= 1){
                    v4.y = u = (v2.x * v3.y - v2.y * v3.x) / c; // unit distance of intercept point on this line
                    if(u >= 0 && u <= 1){
                        v4.x = u;  // in case needed for caculating the position of the intercept
                        return true;
                    }else{
                        return false;
                    }
                }else{
                    return false
                }                    
            }
            v4.x = undefined;
            return false;  
        },
        distFrom : function(point){   // returns the distance from the line a point is
            // this function uses v1, v2, v3, v4.x is the closest point and sets this._leng
            // v1 is the vector of this line
            // v2 is the vector from this line start to point
            // v3 is the vector from the line start to the closes point. To get the coordinates add the start of the line to this vec;
            // this._leng is the length of this line;
            // v4.x is unit dist along this line for close point. That means v4.x <0 or v4.y > 0 and the point is not on this line segment
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = Math.hypot(v1.y,v1.x);
            v2.x = point.x - this.p1.x;
            v2.y = point.y - this.p1.y;
            v4.x = (v2.x * v1.x + v2.y * v1.y)/(this._leng * this._leng);
            v3.x = v1.x * v4.x;
            v3.y = v1.y * v4.x;
            return Math.hypot(v3.y - v2.y, v3.x - v2.x);
        },        
        distFromDir : function(point){ // same as distFrom but adds a sign to indicate if the line is left (negative) or right (positive)
            // this call fromDist Refer to that function for calc vars used.
            var d = this.distFrom(point);
            // WARNING this depends on vars set in distFrom
            c = v1.x * v2.y - v1.y * v2.x;
            return c < 0 ? -d : d;
        },
        lineTo : function(p, rLine){  // returns the line from vec p to the closest point on the line
            var l;
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
            var l;
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this._leng = l = Math.hypot(v1.y,v1.x);
            v2.x = vec.x - this.p1.x;
            v2.y = vec.y - this.p1.y;
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
        getNormalAsLine : function(retLine){
            if(retLine === undefined){
                retLine = new Line();
            }
            v1.x = this.p2.x - this.p1.x; // get the vector of the line
            v1.y = this.p2.y - this.p1.y;
            retLine.p2.x = retLine.p1.x = this.p1.x + v1.x / 2; // get the center as start of returned line
            retLine.p2.y = retLine.p1.y = this.p1.y + v1.y / 2; // get the center
            u = Math.hypot(v1.x,v1.y); // normalise the ve by geting length
            v1.x /= u;
            v1.y /= u;
            retLine.p2.x -= v1.y; // set the end point to the normalised distance from the line
            retLine.p2.y += v1.x;
            return retLine;
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
        centerOnStart : function(){ // moves the line back so that it is centered on its start
            // this function uses Geom registers v1
            // v1 is the vector of this line          
            this.p2.x = (this.p1.x += (v1.x = this.p2.x - this.p1.x)/2) + v1.x;
            this.p2.y = (this.p1.x += (v1.y = this.p2.y - this.p1.y)/2) + v1.y;
            return this; // returns this.
        },
        centerOnEnd : function(){ // moves the line forward so that it is centered where its end is now
            // this function uses Geom registers v1
            // v1 is the vector of this line  
            this.p1.x = (this.p2.x += (v1.x = this.p1.x - this.p2.x)/2) + v1.x;
            this.p1.y = (this.p2.x += (v1.y = this.p1.y - this.p2.y)/2) + v1.y;
            return this; // returns this.
        },
        centerOnVec : function(vec){ // moves the line  so that it is centered on vec
            // this function uses Geom registers v1
            // v1 is the vector of this line  
            this.p1.x = (this.p2.x = vec.x + (v1.x = this.p1.x - this.p2.x)/2) - v1.x;
            this.p1.y = (this.p2.x = vec.y + (v1.y = this.p1.y - this.p2.y)/2) - v1.y;
            return this; // returns this.
        },
        rotate90OnCenter : function(){ // rotates 90 deg clockwise on the center
            // this function uses Geom registers v1, v2
            // v1 is the vector of this line before rotation
            // v2 is the mid point of this line
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = this.p1.x + v1.x / 2;
            v2.y = this.p1.y + v1.y / 2;
            this.p2.x = (this.p1.x = v2.x + v1.y / 2) - v1.y;
            this.p2.y = (this.p1.y = v2.y - v1.x / 2) + v1.x;
            return this;            
        },
        rotate90OnStart : function(){ // rotates 90 deg clockwise on its start point
            // this function uses Geom registers v1.x
            // v1.x is the vector x component of this line before rotation
            v1.x = this.p2.x - this.p1.x;
            this.p2.x = this.p1.x - (this.p2.y - this.p1.y);
            this.p2.y = this.p1.y + v1.x;
            return this;            
            
        },
        rotate90OnEnd : function(){ // rotates 90 deg clockwise on its end point
            // this function uses Geom registers v1
            // v1 is the vector of this line before rotation
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            this.p1.x = this.p2.x + v1.y;
            this.p1.y = this.p2.y - v1.x;
            return this;                        
        },
        slide : function(distance){ // moves the line segment backwards (- distance) or forward (+distance)        
            // this function uses Geom registers v1
            // v1 is the vector of the distance moved;
            if(distance === 0){ // to avoid infinite move
                v1.x = v1.y = 0; // to give the register use consistance;
                return this;  
            }
            v1.x = this.p2.x - this.p1.x;
            v1.y = this.p2.y - this.p1.y;
            v2.x = distance / Math.hypot(v1.x,v2.y);
            this.p1.x += (v1.x /= v2.x);
            this.p1.y += (v1.y /= v2.x);
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
        },
        slideUnit : function(unitDistance){ // moves the line segment a unit distance backwards (- distance) or forward (+distance). The unit is the lines length, thus to move the line half its length forward pass a value of 0.5
            // this function uses Geom registers v1
            // v1 is the vector of the distance moved;
            v1.x = (this.p2.x - this.p1.x) * unitDistance;
            v1.y = (this.p2.y - this.p1.y) * unitDistance;
            this.p1.x += v1.x;
            this.p1.y += v1.y;
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
        },
        offset : function( distance ){ // moves the line along its normal (to the lines right) by distance
            // this function uses Geom registers v1
            // v1 is the vector of the distance moved;
            if(distance === 0){ // to avoid infinite move
                v1.x = v1.y = 0; // to give the register use consistance;
                return this;  
            }
            v1.y = this.p2.x - this.p1.x;
            v1.x = -(this.p2.y - this.p1.y);
            v2.x = distance / Math.hypot(v1.x,v1.y);
            this.p1.x += (v1.x *= v2.x);
            this.p1.y += (v1.y *= v2.x);
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
        },
        offsetUnit : function( unitDistance ){ // moves the line along its normal (to the lines right) by unitDistance. A unit is the length of the line
            // this function uses Geom registers v1
            // v1 is the vector of the distance moved;
            v1.y = (this.p2.x - this.p1.x) * unitDist;
            v1.x = (-this.p2.y - this.p1.y) * unitDist;
            this.p1.x += v1.x;
            this.p1.y += v1.y;
            this.p2.x += v1.x;
            this.p2.y += v1.y;
            return this;
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
            if(this.aspect <= 0 || this.aspect === Infinity || this.aspect === -Infinity || isNaN(this.aspect) || this.top === undefined || this.top.isEmpty()){
                return true;
            }
            return false;
        },
        toString : function(precision){
            var str;
            var l = this.label === undefined ? "": "'"+this.label+"' ";
            if(this.isEmpty()){
                return "Rectangle : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Rectangle : "+l+"(";
            str += "Top : "+ this.top.toString(precision) + ", ";
            str += "Aspect : "+ this.aspect;
            str += ")";
            return str; // returns String
        },        
        empty : function(){
            this.aspect = Infinity;
            return this;
        },
        width : function (){
            return  Math.hypot(this.top.p2.y - this.top.p1.y, this.top.p2.x - this.top.p1.x);
        },
        height : function () {
            return Math.hypot(this.top.p2.y-this.top.p1.y,this.top.p2.x-this.top.p1.x) * this.aspect;
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
        lerp : function(from, dest, amount){
            this.top.p1.x = (dest.top.p1.x-from.top.p1.x) * amount + from.top.p1.x;
            this.top.p1.y = (dest.top.p1.y-from.top.p1.y) * amount + from.top.p1.y;
            this.top.p2.x = (dest.top.p2.x-from.top.p2.x) * amount + from.top.p2.x;
            this.top.p2.y = (dest.top.p2.y-from.top.p2.y) * amount + from.top.p2.y;
            this.aspect = (dest.aspect - from.aspect) * amount + from.aspect;
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
        heightVec : function(vec){ // returns the vector from top to bottom. If vec is undefined a new vec is created else the supplied vec is used
            if(vec === undefined){
                vec = new Vec();
            }
            vec.x = -(this.top.p2.y - this.top.p1.y) * this.aspect;
            vec.y = (this.top.p2.x - this.top.p1.x) * this.aspect;
            return vec;
        },     
        corners : function (vecArray) { // returns an vec array containing the corners from top left top right bottom roght bottom left. If vecArray is passed then the first 4 vecs are set to the new points
            // this function uses the Geom registers v1
            // v1 is the vector representing the side (height) from top to bottom
            if(vecArray === undefined){
                c = (vecArray = new VecArray()).vecs;
                c[0] = new Vec(this.top.p1);
                c[1] = new Vec(this.top.p2);
                v1.y = (c[1].x - c[0].x) * this.aspect;
                v1.x = -(c[1].y - c[0].y) * this.aspect;
                c[2] = new Vec(this.top.p2);
                c[3] = new Vec(this.top.p1);
            }else{
                c = vecArray.vecs;
                v1.y = ((c[2].x = c[1].x = this.top.p2.x) - (c[3].x = c[0].x = this.top.p1.x)) * this.aspect;
                v1.x = -((c[2].y = c[1].y = this.top.p2.y) - (c[3].y = c[0].y = this.top.p1.y)) * this.aspect;
            }
            c[2].x += v1.x;
            c[2].y += v1.y;  
            c[3].x += v1.x;
            c[3].y += v1.y;
            return vecArray;
        },
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.top.p1).push(this.top.p2);    
                return vecArray;                
            }             
            
            vecArray.push(this.top.p1.copy()).push(this.top.p2.copy());
            return vecArray;
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
        asCircle : function(circle){ // returns a bounding circle
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
        asInnerCircle : function(circle){  // returns the largest circle that can fit inside
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
        asTriangles : function(diagonal,array){ // if diagonal is false then the triangles meet at the line from top right to bottom left, else its top left to bottom right
            var newP = false; // flag to indicate if points need to be copied
            var c = this.corners();
            if(array === undefined){
                array = [];
            }
            var p0 = 0;
            var p1 = 1;
            var p2 = 2;
            if(diagonal === false){
                p2 = 3;                
            }
            if(array[0] !== undefined){
                array[0].p1.x = c.vecs[p0].x;
                array[0].p1.y = c.vecs[p0].y;
                array[0].p2.x = c.vecs[p1].x;
                array[0].p2.y = c.vecs[p1].y;
                array[0].p3.x = c.vecs[p2].x;
                array[0].p3.y = c.vecs[p2].y;
            }else{
                array[0] = new Triangle(c.vecs[p0],c.vecs[p1],c.vecs[p2]);
                newP = true;
            }
            p0 = 2;
            p1 = 3;
            p2 = 0;
            if(diagonal === false){
                p0 = 1;
                p1 = 2;
                p2 = 3;                
            }
            if(array[1] !== undefined){
                array[1].p1.x = c.vecs[p0].x;
                array[1].p1.y = c.vecs[p0].y;
                array[1].p2.x = c.vecs[p1].x;
                array[1].p2.y = c.vecs[p1].y;
                array[1].p3.x = c.vecs[p2].x;
                array[1].p3.y = c.vecs[p2].y;
            }else{
                if(newP){
                    array[1] = new Triangle(c.vecs[p0].copy(),c.vecs[p1],c.vecs[p2].copy());
                }else{
                    array[1] = new Triangle(c.vecs[p0],c.vecs[p1],c.vecs[p2]);
                }
            }
            return array;
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
            var lw,lh,a,r,b,l;
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
            var l = Math.hypot(this.top.p2.y - this.top.p1.y, this.top.p2.x - this.top.p1.x);
            return l * l * this.aspect;
        },
        inflate : function(units){ // Increases or decreases the rectange size keeping the same center so that all sides are moved units in or out. For rectangles that have a aspect !== 1 the aspect will change
            var w,h,ww,hh;
            h = (w = Math.hypot(v1.y = this.top.p2.y - this.top.p1.y, v1.x = this.top.p2.x - this.top.p1.x)) * this.aspect;
            v1.x /= w;
            v1.y /= w;
            ww = w + units * 2;
            hh = h + units * 2;
            this.top.p1.x -= v1.x * units - v1.y * units;
            this.top.p1.y -= v1.y * units + v1.x * units;
            this.top.p2.x = this.top.p1.x + ww * v1.x;
            this.top.p2.y = this.top.p1.y + ww * v1.y;
            this.aspect = hh / ww;
            return this;
            
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
        isCircleInside : function (circle){  // need improvment
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
        isCircleTouching : function (circle){
            var w;
            // get center
            vc.x = this.top.p1.x + (v1.x = (this.top.p2.x - this.top.p1.x) / 2);
            vc.y = this.top.p1.y + (v1.y = (this.top.p2.y - this.top.p1.y) / 2);
            vc.x += -v1.y * this.aspect;
            vc.y += v1.x * this.aspect;
            // get width
            w = Math.hypot(v1.x,v1.y)

            // make circle center relative to rectange center
            v2.x = circle.center.x - vc.x;
            v2.y = circle.center.y - vc.y;

            // dot product of horizontal center line and circle center div length of line 
            // goves distance from vetical center line
            if(Math.abs((v2.x * v1.x + v2.y * v1.y) / w ) > circle.radius + w){
                return false;
            }
            // do same for vertical line
            if(Math.abs((v2.x * -v1.y + v2.y * v1.x) / w ) > circle.radius + w  * this.aspect){
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
        isLineTouching : function(line){
             var rll,rlb,rlr;
            if(this.top.isLineSegIntercepting(line)){
                return true;
            }
            if(this.leftLine().isLineSegIntercepting(line)){
                return true;
            }
            if(this.bottomLine().isLineSegIntercepting(line)){
                return true;
            }
            if(this.rightLine().isLineSegIntercepting(line)){
                return true;
            }
            return this.isLineInside(line);
            
        },
        setTransform :function(ctx){   // temp location of this function
            if(ctx === undefined || ctx === null){
                if(typeof this.getCTX === "function"){
                    ctx = this.getCTX()
                }else{
                    return this;
                }
            }
            var xa = new Vec(null,this.top.dir());
            ctx.setTransform(xa.x, xa.y, -xa.y * this.aspect, xa.x * this.aspect, this.top.p1.x, this.top.p1.y);
            return this;  // returns this.
        },    
        setTransformArea : function (ctx, width, height){ // temp location of this function
            if(ctx === undefined || ctx === null){
                if(typeof this.getCTX === "function"){
                    ctx = this.getCTX()
                }else{
                    return this;
                }
            }            var l = this.top.leng();
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
        asVecArray : function(vecArray){ // nothing to add to the vecArray
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            return vecArray;
        },          
        lerp : function(from, dest, amount){
           this.top = (dest.top - from.top) * amount + from.top;  
           this.right = (dest.right - from.right) * amount + from.right;  
           this.left = (dest.left - from.left) * amount + from.left;  
           this.bottom = (dest.bottom - from.bottom) * amount + from.bottom;  
           return this;
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
            if(isNaN(this.top) || isNaN(this.left) || isNaN(this.right) || isNaN(this.bottom)){
                return true;
            }
            return false;
        },
        empty : function(){
            return this.irrate();
        },
        toString : function(precision){
            var str;
            var l = this.label === undefined ? "": "'"+this.label+"' ";
            if(this.isEmpty()){
                return "Box : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Box : "+l+"(";
            str += "Top : "+ this.top + ", ";
            str += "Left : "+ this.left + ", ";
            str += "Right : "+ this.right + ", ";
            str += "Bottom : "+ this.bottom ;
            str += ")";
            return str; // returns String
        },   
        add : function(vec){
            this.top += vec.y;
            this.bottom += vec.y;
            this.left += vec.x;
            this.right += vec.x;
            return this;
        },   
        pad : function(amount){  // pads the box by amount. Amount can be negative.The box may be irrate meaningless as a result of negative amount
            this.top -= amount;
            this.bottom += amount;
            this.left -= amount;
            this.right += amount;
            return this;
        },        
        asRectange : function (retRect) {  // returns a rectangle. If retRect is supplied then sets that else creates a new rectangle
            a = (this.bottom- this.top)  / (this.right- this.left);
            if(retRect === undefined){
                return new Rectangle ( new Line( new Vec(this.left,this.top),new Vec(this.right,this.top)), a)
            }
            retRect.p1.x = this.left;
            retRect.p2.y = retRect.p1.y = this.top;
            retRect.p2.x = this.right;
            retRect.aspect = a;
            return retRect;
        },
        center : function(vec){ // returns the center as a vec. If vec supplied then use that, else creates a new vec
            if(vec === undefined){
                vec = new Vec();
            }
            vec.x = (this.left + this.right)/2;
            vec.y = (this.top + this.bottom)/2;
            return vec;
            
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
            if(geomInfo.isPrimitive(obj)){
                this.envBox(obj.asBox());
            }
            return this; // returns this.
        } 
    }
    Bezier.prototype = {
        p1 : undefined,
        p2 : undefined,
        cp1 : undefined,
        cp2 : undefined,
        type : "Bezier",
        copy : function(){
            return new Bezier(this.p1, this.p2, this.cp1, this.cp2);
        },
        toString : function(precision){
            var str;
            var l = this.label === undefined ? "": "'"+this.label+"' ";
            if(this.isEmpty()){
                return "Bezier : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Bezier : "+l+"(";
            str += " API incomplete )";
            return str; // returns String
        },
        empty : function(){
            this.p1.x = this.p1.y = this.p2.x = this.p2.y = Infinity;
            return this;
        },
        isEmpty : function(){
            if(this.p1 === undefined || this.p2 === undefined || this.cp1 === undefined){
                return true;
            }
            if(this.p1.isEmpty() || this.p2.isEmpty() || this.cp1.isEmpty()){
                return true;
            }            
        },
        lerp : function(from, dest, amount){
            this.p1.x = (dest.p1.x - from.p1.x) * amount + from.p1.x;
            this.p1.y = (dest.p1.y - from.p1.y) * amount + from.p1.y;
            this.p2.x = (dest.p2.x - from.p2.x) * amount + from.p2.x;
            this.p2.y = (dest.p2.y - from.p2.y) * amount + from.p2.y;
            this.cp1.x = (dest.cp1.x - from.cp1.x) * amount + from.cp1.x;
            this.cp1.y = (dest.cp1.y - from.cp1.y) * amount + from.cp1.y;
            if(this.cp2 !== undefined){
                this.cp2.x = (dest.cp2.x - from.cp2.x) * amount + from.cp2.x;
                this.cp2.y = (dest.cp2.y - from.cp2.y) * amount + from.cp2.y;
            }
            return this;
        },          
        isQuadratic : function(){
            if(this.cp2 === undefined && !this.isEmpty()){
                return true;
            }
            return false;
        },
        isCubic : function(){
            if(!this.cp2.isEmpty() && !this.isEmpty()){
                return true;
            }            
            return false;
        },
        asVecArray : function(vecArray, instance){
            if(vecArray === undefined){
                vecArray =  new VecArray();
            }
            if(instance){
                vecArray.push(this.p1).push(this.p2).push(this.cp1);
                if(this.cp2 !== undefined){
                    vecArray.push(this.cp2);
                }
                return vecArray;                
            }             
            
            vecArray.push(this.p1.copy()).push(this.p2.copy()).push(this.cp1.copy());
            if(this.cp2 !== undefined){
                vecArray.push(this.cp2.copy());
            }
            return vecArray;
        },          
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.p1.x, this.p1.y);
            box.env ( this.p2.x, this.p2.y);
            box.env ( this.cp1.x, this.cp1.y);
            if(this.cp2 !== undefined){
                box.env ( this.cp2.x, this.cp2.y);
            }
            return box;
        },
        asQuadratic : function(){
            if(this.cp2 === undefined){
                return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy());
            }
            v1.x = (this.cp1.x + this.cp2.x)/2;
            v1.y = (this.cp1.y + this.cp2.y)/2;
            return new Bezier(this.p1.copy(), this.p2.copy(), v1.copy());
        },
        asCubic : function(extraVec){ // this is just a stub for now untill I workout the best solution for the missing point
            if(this.cp2 === undefined){
                if(extraVec === undefined){
                    var v = this.p2.copy().sub(this.p1).mult(1/3);
                    v = this.p2.copy().sub(v).sub(v.r90());
                    return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy(), v);
                }
                return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy(), extraVec);
            }
             return new Bezier(this.p1.copy(), this.p2.copy(), this.cp1.copy(), this.cp2.copy());
        },
        fromCircle : function(circle){ // stub
            return this;
        },
        fromArc : function(arc){ // stub
            return this;
        },
        fromVecArray : function(vecArray){ // stub
            return this;
        },
        fromTriangle : function(triangle){ // stub
            return this;
        },
        fromRectangle : function(rectangle){ // stub
            return this;
        },
        fromBox : function(box){ // stub
            return this;
        },
        vecAt : function(position,vec){
            if(vec === undefined){
                vec = new Vec();
            }
            if(position <= 0){
                vec.x = this.p1.x;
                vec.y = this.p1.y;
                return vec;
            }else
            if(position >= 1){
                vec.x = this.p2.x;
                vec.y = this.p2.y;
                return vec;
            }
                
            v1.x = this.p1.x;
            v1.y = this.p1.y;
            c = position;
            if(this.cp2 === undefined){
                v2.x = this.cp1.x;
                v2.y = this.cp1.y;
                v1.x += (v2.x - v1.x) * c;
                v1.y += (v2.y - v1.y) * c;
                v2.x += (this.p2.x - v2.x) * c;
                v2.x += (this.p2.y - v2.y) * c;
                vec.x = v1.x + (v2.x - v1.x) * c;
                vec.y = v1.y + (v2.x - v1.x) * c;
                return vec;
            }
            v2.x = this.cp1.x;
            v2.y = this.cp1.y;
            v3.x = this.cp2.x;
            v3.y = this.cp2.y;
            v1.x += (v2.x - v1.x) * c;
            v1.y += (v2.y - v1.y) * c;
            v2.x += (v3.x - v2.x) * c;
            v2.y += (v3.y - v2.y) * c;
            v3.x += (this.p2.x - v3.x) * c;
            v3.y += (this.p2.y - v3.y) * c;
            v1.x += (v2.x - v1.x) * c;
            v1.y += (v2.y - v1.y) * c;
            v2.x += (v3.x - v2.x) * c;
            v2.y += (v3.y - v2.y) * c;
            vec.x = v1.x + (v2.x - v1.x) * c;
            vec.y = v1.y + (v2.x - v1.x) * c;
            return vec;                    
        },
        approxLength : function(resolution){
            if(resolution === undefined || resolution === Infinity){
                resolution = 100;
            }
            u = 1/Math.abs(resolution);
            u1 = 0;
            a = 1 + u/2; // to ensure that the for loop  does not miss 1 because of floating point error
            v4.x = this.p1.x;
            v4.y = this.p1.y;
            for(c1 = u; c1 <= a; c1 += u){
                this.vecAt(c1,v5);
                u1 += Math.hypot(v5.x - v4.x, v5.y - v4.y);
                v4.x = v5.x;
                v4.y = v5.y;
            }
            return u1;
        },
        lengthChange_Just_messing_about : function(resolution, vecArray , timer = 0){
            var create = false;
            if(vecArray === undefined){
                vecArray = new VecArray();
                create = true;
            }

            if(resolution === undefined || resolution === Infinity){
                resolution = 100;
            }
            var l,ll, i = 0;
            u = 1/Math.abs(resolution);
            u1 = 0;
            a = 1 + u/2; // to ensure that the for loop  does not miss 1 because of floating point error
            v4.x = this.p1.x;
            v4.y = this.p1.y;
            for(c1 = u; c1 <= a; c1 += u){
                this.vecAt(c1,v5);
                u1 += l = Math.hypot(v5.x - v4.x, v5.y - v4.y);
                if(ll !== undefined){
                    if(create || vecArray.vecs[i] === undefined){
                        vecArray.push( new Vec(200-(ll - l)*500,i * 4));
                    }else{
                        var ang = c1 * Math.PI * 2 + timer /400; 

                        vecArray.vecs[i].x = Math.cos(ang)* (100 +(ll - l)*250) + 200;
                        vecArray.vecs[i].y = Math.sin(ang)* (100 +(ll - l)*250) + 200;;
                    }
                    i ++;
                }
                ll = l
                v4.x = v5.x;
                v4.y = v5.y;
            }
            vecArray.normalise();
            return vecArray;
        },
            
    }
    Transform.prototype = {
        xAxis : undefined,
        yAxis : undefined,
        origin : undefined,
        type:"Transform",
        copy : function(){
            return new Transform(this.xAxis.copy(),this.yAxis.copy(),this.origin.copy());
        },
        reset : function(){  // sets the matrix to the identity matrix
            this.xAxis.x = this.yAxis.y = 1;
            this.xAxis.y = this.yAxis.x = this.origin.x = this.origin.y = 0;
            return this;
        },
        toString : function(precision){
            var str;
            var l = this.label === undefined ? "": "'"+this.label+"' ";
            if(this.isEmpty()){
                return "Transform : "+l+"( Empty )";
            }
            if(precision === undefined || precision === null){
                precision = geom.defaultPrecision;;
            }
            str = "Transform : "+l+"(";
            str += "X axis : "+ this.xAxis.toString() + ", ";
            str += "Y axis : "+ this.yAxis.toString() + ", ";
            str += "Origin : "+ this.origin.toString() + ", ";
            str += ")";
            return str; // returns String
        },  
        setIdentity : function(){  // sets the matrix to the identity matrix
            this.xAxis.x = this.yAxis.y = 1;
            this.xAxis.y = this.yAxis.x = this.origin.x = this.origin.y = 0;
            return this;
        },
        isEmpty : function(){
            if(this.xAxis === undefined || this.yAxis === undefined || this.origin === undefined){
                return true;                
            }
            if(this.xAxis.isEmpty() || this.yAxis.isEmpty() || this.origin.isEmpty()){
                return true;
            }
            return false;            
        },
        empty : function(){ 
            this.xAxis.empty();
            this.yAxis.empty();
            this.origin.empty();
            return this;            
        },
        asVecArray : function(va, instance) { // currently this just returns a new or passed vecArray with the origin only. Though may consider passing the axis
            if(va === undefined){
                va = new VecArray();
            }
            if(instance){
                va.push(this.origin);                
                return va;                
            }
            va.push(this.origin.copy());
            return va;
        },
        applyToCoordinate : function(x, y, point){
            if(point !== undefined){
                point.x = x * this.xAxis.x + y * this.yAxis.x + this.origin.x;
                point.y = x * this.xAxis.y + y * this.yAxis.y + this.origin.y;
                return point;
            }
            return {
                x : x * this.xAxis.x + y * this.yAxis.x + this.origin.x,
                y : x * this.xAxis.y + y * this.yAxis.y + this.origin.y
            };
        },
        applyToVec : function(vec){
            vx = vec.x * this.xAxis.x + vec.y * this.yAxis.x + this.origin.x;
            vec.y = vec.x * this.xAxis.y + vec.y * this.yAxis.y + this.origin.y;
            vec.x = vx;
            return vec;
        },
        applyToLine : function(line){
            v1x = line.p1;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = line.p2;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return line;
        },
        applyToRectangle : function(rectangle){
            v1x = rectangle.line.p1;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = rectangle.line.p2;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return rectangle;
        },
        applyToCircle : function(circle){
            v1x = circle.center;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return circle;
        },
        applyToArc : function(arc){ // need to define what this should do. So does nothing ATM
            return arc;
        },
        applyToTriangle : function(triangle){
            v1x = triangle.p1;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = triangle.p2;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            v1x = triangle.p3;
            vx = v1x.x * this.xAxis.x + v1x.y * this.yAxis.x + this.origin.x;
            v1x.y = v1x.x * this.xAxis.y + v1x.y * this.yAxis.y + this.origin.y;
            v1x.x = vx;
            return triangle;
        },
        applyToVecArray : function(vecArray){
            var i,len = vecArray.length;
            var xdx,xdy,ydx,ydy,ox,oy;
            xdx = this.xAxis.x;
            xdy = this.xAxis.y;
            ydx = this.yAxis.x;
            ydy = this.yAxis.y;
            ox = this.origin.x;
            oy = this.origin.y;
            for(i = 0; i < len; i ++){
                v1x = vecArray.vecs[i];
                vx = v1x.x * xdx + v1x.y * ydx + ox;
                v1x.y = v1x.x * xdy + v1x.y * ydy + oy;
                v1x.x = vx;
            }
            
            return vecArray;
        },
        applyToPrimitiveArray : function(primitiveArray){ // Not yet implemented. returns the primitive array
            return primitiveArray;
        },
        fitRectange : function(rectangle,width,height){ // create a transform that will fit width and height 
                                                        // within the rectangle so that transformed 0,0 is rectangle top left
                                                        // and width, height is at rectangle bottom right
            v1.x = rectangle.top.p2.x - rectangle.top.p1.x;
            v1.y = rectangle.top.p2.y - rectangle.top.p1.y;
            this.xAxis.x = v1.x / width;
            this.xAxis.y = v1.y / width;
            this.yAxis.x = (-v1.y * rectangle.aspect) / height;
            this.yAxis.y = (v1.x * rectangle.aspect) / height;
            this.origin.x = rectangle.top.p1.x;
            this.origin.y = rectangle.top.p1.y;
            return this;
        },
        fitLine : function(line,length,height){ // create a transform that fits length to a line where
                                                // the origin (0,0) is at the line start and (length,0) is
                                                // at the line end.
                                                // -height/2 is above the line and height/2 is below
                                                // Can be used to fit an image to a line.
            v1.x = line.p2.x - line.p1.x;
            v1.y = line.p2.y - line.p1.y;
            this.xAxis.x = v1.x / length;
            this.xAxis.y = v1.y / length;
            this.yAxis.x = (-v1.y / 2) / height;
            this.yAxis.y = (v1.x / 2) / height;            
            this.origin.x = line.p1.x;
            this.origin.y = line.p1.y;           
        },
        mirrorX : function(){ // mirror the transform along its xAxis. 
            this.xAxis.x = -this.xAxis.x;
            this.xAxis.y = -this.xAxis.y;        
            return this;
        },
        mirrorY : function(){ // mirror the transform along its yAxis. 
            this.yAxis.x = -this.yAxis.x;
            this.yAxis.y = -this.yAxis.y;        
            return this;
        },
        mirrorXY : function(){ // mirror the transform along its a and y Axis. 
            this.xAxis.x = -this.xAxis.x;
            this.xAxis.y = -this.xAxis.y;        
            this.yAxis.x = -this.yAxis.x;
            this.yAxis.y = -this.yAxis.y;        
            return this;
        },
        rotate90 :function(){ // rotates the transform 90 deg clockwise
            v1.x = this.xAxis.x;
            v1.y = this.xAxis.y;        
            this.xAxis.x = -this.yAxis.y;
            this.xAxis.y = this.yAxis.x;        
            this.yAxis.x = -v1.y;
            this.yAxis.y = v1.x;        
            return this;
        },
        isometric : function(){  // creates an isometric projection keeps the origin
            this.xAxis.x = 1;
            this.xAxis.y = 0.5;
            this.yAxis.x = -1;
            this.yAxis.y = 0.5;        
            return this;
        },
        normalisePixelArea : function(){ // scales the transformation so that the area of a pixel
                                         // is 1
            var scale = 1 / Math.sqrt(
                 (xAxis.x * ( xAxis.y + yAxis.y ) + ( xAxis.x + yAxis.x ) * yAxis.y) - 
                 (xAxis.y * ( xAxis.x + yAxis.x ) + ( xAxis.y + yAxis.y ) * yAxis.x)
            );
            xAxis.x *= scale;
            xAxis.y *= scale;
            yAxis.x *= scale;
            yAxis.y *= scale;
            return this;
                                         
        },
        isIdentity : function(){
            if(Math.abs(this.origin.x) > EPSILON){ return false; }
            if(Math.abs(this.origin.y) > EPSILON){ return false; }
            if(Math.abs(this.xAxis.y) > EPSILON){ return false; }
            if(Math.abs(this.yAxis.x) > EPSILON){ return false; }
            if(Math.abs(this.xAxis.x - 1) > EPSILON){ return false; }
            if(Math.abs(this.yAxis.y - 1) > EPSILON){ return false; }
            return true;            
        },
        setFastlerp : function(from, dest){ // sets up fast lerp by pre decomposing from and destination transforms.
            var fl = this.fastLerp = [];
            fl[0] = Math.atan2(from.xAxis.y,from.xAxis.x)
            fl[1] = Math.atan2(-from.yAxis.x,from.yAxis.y) - fl[0];
            fl[2] = Math.hypot(from.xAxis.y,from.xAxis.x);
            fl[3] = Math.hypot(from.yAxis.y,from.yAxis.x);
            fl[4] = from.origin.x;
            fl[5] = from.origin.y;
            fl[6] = Math.atan2(dest.xAxis.y,dest.xAxis.x)
            fl[7] = (Math.atan2(-dest.yAxis.x,dest.yAxis.y) - fl[6]) - fl[1];
            fl[6] -= fl[0];
            fl[8] = Math.hypot(dest.xAxis.y,dest.xAxis.x)- fl[2];
            fl[9] = Math.hypot(dest.yAxis.y,dest.yAxis.x) - fl[3];
            fl[10] = dest.origin.x - fl[4];
            fl[11] = dest.origin.y - fl[5];
            return this;
        },
        fastLerp : function(amount){
            var fl = this.fastLerp;
            if(fl === undefined){
                return this;
            }
            v1.x = fl[0] + fl[6] * amount;
            v1.y = v1.x + fl[1] + fl[7] * amount;
            v2.x = fl[2] + fl[8] * amount;
            v2.x = fl[3] + fl[9] * amount;
            this.xAxis.x = Math.cos(v1.x) * v2.x;
            this.xAxis.y = Math.sin(v1.x) * v2.x;
            this.yAxis.x = -Math.sin(v1.y) * v2.y;
            this.yAxis.y = Math.cos(v1.y) * v2.y;
            this.origin.x = fl[4] + fl[10] * amount;
            this.origin.y = fl[4] + fl[11] * amount;     
            return this;            
        },
        lerp : function(from, dest, amount){
            var fromComp = from.decompose();
            var destComp = dest.decompose();
            this.recompose( {
                rotation : fromComp.rotation + (destComp.rotation - fromComp.rotation) * amount,
                skew : fromComp.skew + (destComp.skew - fromComp.skew) * amount,
                scaleX : fromComp.scaleX + (destComp.scaleX - fromComp.scaleX) * amount,
                scaleY : fromComp.scaleY + (destComp.scaleY - fromComp.scaleY) * amount,
                originX : fromComp.originX + (destComp.originX - fromComp.originX) * amount,
                originY : fromComp.originY + (destComp.originY - fromComp.originY) * amount
            });
            return this;
        },
        asInverseTransform : function(transform){  // creates a new or uses supplied transform to return the inverse of this matrix
            var cross =  this.xAxis.x * this.yAxis.y - this.xAxis.y * this.yAxis.x;
            v1.x = this.yAxis.y / cross;
            v1.y = -this.xAxis.y / cross;
            v2.x = -this.yAxis.x / cross;
            v2.y = this.xAxis.x / cross;
            v3.x = (this.yAxis.x * this.origin.y - this.yAxis.y * this.origin.x) / cross;
            v3.y = -(this.xAxis.x * this.origin.y - this.xAxis.y * this.origin.x) / cross;
            if(transform === undefined){
                transform = new Transform();
                this.xAxis = v1.copy();
                this.yAxis = v2.copy();
                this.origin = v3.copy();
                return transform;
            }
            transform.xAxis.x = v1.x;
            transform.xAxis.y = v1.y;
            transform.yAxis.x = v2.x;
            transform.yAxis.y = v2.y;
            transform.origin.x = v3.x;
            transform.origin.y = v3.y;
            return transform;
            
        },
        invert: function() {
            var cross =  this.xAxis.x * this.yAxis.y - this.xAxis.y * this.yAxis.x;
            v1.x = this.yAxis.y / cross;
            v1.y = -this.xAxis.y / cross;
            v2.x = -this.yAxis.x / cross;
            v2.y = this.xAxis.x / cross;
            v3.x = (this.yAxis.x * this.origin.y - this.yAxis.y * this.origin.x) / cross;
            v3.y = -(this.xAxis.x * this.origin.y - this.xAxis.y * this.origin.x) / cross;
            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            this.origin.x = v3.x;
            this.origin.y = v3.y;
            return this;
        },        
        mult : function(transform){
            var tt = transform;
            var t = this;
            v1.x = tt.xAxis.x * t.xAxis.x + tt.yAxis.x * t.xAxis.y;
            v1.y = tt.xAxis.y * t.xAxis.x + tt.yAxis.y * t.xAxis.y;
            v2.x = tt.xAxis.x * t.yAxis.x + tt.yAxis.x * t.yAxis.y;
            v2.y = tt.xAxis.y * t.yAxis.x + tt.yAxis.y * t.yAxis.y;
            v3.x = tt.xAxis.x * t.origin.x + tt.yAxis.x * t.origin.y + tt.origin.x;
            v3.y = tt.xAxis.y * t.origin.x + tt.yAxis.y * t.origin.y + tt.origin.y;
            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            this.origin.x = v3.x;
            this.origin.y = v3.y;
            return this;
        },
        rotate : function(angle){
            var xdx = Math.cos(angle);
            var xdy = Math.sin(angle);
            
            v1.x = xdx * this.xAxis.x + (-xdy) * this.xAxis.y;
            v1.y = xdy * this.xAxis.x +  xdx * this.xAxis.y;
            v2.x = xdx * this.yAxis.x + (-xdy) * this.yAxis.y;
            v2.y = xdy * this.yAxis.x +  xdx * this.yAxis.y;
            v3.x = xdx * this.origin.x + (-xdy) * this.origin.y;
            v3.y = xdy * this.origin.x +  xdx * this.origin.y;           

            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            this.origin.x = v3.x;
            this.origin.y = v3.y;
            return this;
        },
        scaleUniform : function(scale){
            this.xAxis.x *= scale;
            this.xAxis.y *= scale;
            this.yAxis.x *= scale;
            this.yAxis.y *= scale;
            this.origin.x *= scale;
            this.origin.y *= scale;
            return this;            
        },
        scale : function(scaleX,scaleY){
            this.xAxis.x *= scaleX;
            this.xAxis.y *= scaleY;
            this.yAxis.x *= scaleX;
            this.yAxis.y *= scaleY;
            this.origin.x *= scaleX;
            this.origin.y *= scaleY;
            return this;                        
        },
        scaleX : function(scaleX){
            this.xAxis.x *= scaleX;
            this.yAxis.x *= scaleX;
            this.origin.x *= scaleX;
            return this;                        
        },
        scaleY : function(scaleY){
            this.xAxis.y *= scaleY;
            this.yAxis.y *= scaleY;
            this.origin.y *= scaleY;
            return this;                        
        },
        shear : function(sx, sy){
            v1.x = this.xAxis.x + this.yAxis.x * sy;
            v1.y = this.xAxis.y + this.yAxis.y * sy;
            v2.x = this.xAxis.x * sx + this.yAxis.x;
            v2.y = this.xAxis.y * sx + this.yAxis.y;
            this.xAxis.x = v1.x;
            this.xAxis.y = v1.y;
            this.yAxis.x = v2.x;
            this.yAxis.y = v2.y;
            return this;
        },
        shearX : function(sx){
            this.yAxis.x += this.xAxis.x * sx;
            this.yAxis.y += this.xAxis.y * sx;
            return this;
        },
        shearY : function(sy){
            this.xAxis.x += this.yAxis.x * sy;
            this.xAxis.y += this.yAxis.y * sy;
            return this;
        },
        translate : function(x,y){
            this.origin.x +=  x;
            this.origin.y +=  y;
            return this;            
        },
        translateX : function(x){
            this.origin.x += x;
            return this;            
        },
        translateY : function(y){
            this.origin.y += y;
            return this;            
        },
        setAs : function (transform) {
            this.xAxis.setAs(transform.xAxis);
            this.yAxis.setAs(transform.yAxis);
            this.origin.setAs(transform.origin);
            return this;
        },
        setContextTransform : function(ctx){
            ctx.setTransform(this.xAxis.x,this.xAxis.y,this.yAxis.x,this.yAxis.y,this.origin.x,this.origin.y);
            return this;
        },
        multiplyContextTransform : function(ctx){
            ctx.transform(this.xAxis.x,this.xAxis.y,this.yAxis.x,this.yAxis.y,this.origin.x,this.origin.y);
            return this;
        },
        setOrigin : function(vec){
            this.origin.x = vec.x;
            this.origin.y = vec.y;
            return this;
        },
        negateOrigin : function(){
            this.origin.x = -this.origin.x;
            this.origin.y = -this.origin.y;
            return this;
        },
        setXAxis : function(vec){
            this.xAxis.x = vec.x;
            this.xAxis.y = vec.y;
            return this;
        },
        setYAxis : function(vec){
            this.yAxis.x = vec.x;
            this.yAxis.y = vec.y;
            return this;
        },
        setAxisAngles : function(angleX, angleY){
            vx = Math.hypot(this.xAxis.x, this.xAxis.y);
            vy = Math.hypot(this.yAxis.x, this.yAxis.y);
            this.xAxis.x = Math.cos(angleX) * vx;
            this.xAxis.y = Math.sin(angleX) * vx;
            this.yAxis.x = Math.cos(angleY) * vy;
            this.yAxis.y = Math.sin(angleY) * vy;
            return this;
        },
        setXAxisAngle : function(angle){
            vx = Math.hypot(this.xAxis.x, this.xAxis.y);
            this.xAxis.x = Math.cos(angle) * vx;
            this.xAxis.y = Math.sin(angle) * vx;
            return this;
        },
        setYAxisAngle : function(angle){
            vy = Math.hypot(this.yAxis.x, this.yAxis.y);
            this.yAxis.x = Math.cos(angle) * vy;
            this.yAxis.y = Math.sin(angle) * vy;
            return this;
        },
        skew : function(){ // returns the skew angle
            return Math.atan2(-this.yAxis.x,this.yAxis.y) -  Math.atan2(this.xAxis.y,this.xAxis.x) ;            
        },
        setSkew : function(angle){ // sets the skew angle
            var scaleY = Math.hypot(this.yAxis.y, this.yAxis.x);
            var rot = Math.atan2(this.xAxis.y, this.xAxis.x) + MPI90 + angle;
            this.yAxis.x = Math.cos(rot) * scaleY;
            this.yAxis.y = Math.sin(rot) * scaleY;
            return this;
        },   
        recompose : function(composit){ // creates a matrix from a decomposed matrix
                                        // rotation (direction of xAxis)
                                        // skew (offset from +90deg of yAxis. ie skew = 0 then yAxis is 90deg from xAxis)
                                        // scaleX scale of xAxis
                                        // scaleY scale oy yAxis
                                        // originX,originY
            this.xAxis.x = Math.cos(composit.rotation) * composit.scaleX;
            this.xAxis.y = Math.sin(composit.rotation) * composit.scaleX;
            this.yAxis.x = -Math.sin(composit.rotation + composit.skew) * composit.scaleY;
            this.yAxis.y = Math.cos(composit.rotation + composit.skew) * composit.scaleY;
            this.origin.x = composit.originX;
            this.origin.y = composit.originY;
            return this;
            
        },
        decompose : function(){
            var r;
            return {
                rotation : (r = Math.atan2(this.xAxis.y,this.xAxis.x)),
                skew : Math.atan2(-this.yAxis.x,this.yAxis.y) - r,
                scaleX : Math.hypot(this.xAxis.y,this.xAxis.x),
                scaleY : Math.hypot(this.yAxis.y,this.yAxis.x),
                originX : this.origin.x,
                originY : this.origin.y
            };
        },
        asSVG : function(svgMatrix){
            if(svgMatrix === undefined){
                if( ! ( svgMatrix = document.createElementNS("http://www.w3.org/2000/svg", "svg").createSVGMatrix() )){
                    return undefined;
                }
            }else{
                // reset to identity. 
                svgMatrix.b = svgMatrix.c = svgMatrix.e = svgMatrix.f = 0;
                svgMatrix.a = svgMatrix.d = 1;
            }
            svgMatrix = svgMatrix.translate(this.origin.x, this.origin.y);
            svgMatrix = svgMatrix.rotate(Math.atan2(this.xAxis.y,this.xAxis.x) * MR2D);		// inDegress degrees
            svgMatrix = svgMatrix.scaleNonUniform(
                    Math.hypot(this.xAxis.y,this.xAxis.x), 
                    Math.hypot(this.yAxis.y,this.yAxis.x)
            );
            var skew = Math.atan2(-this.yAxis.x,this.yAxis.y);
            if(Math.abs(skew) > EPSILON){
                svgMatrix = svgMatrix.skewY(skew * MR2D); // in degrees
            } 
            return svgMatrix;
        }
    }
    Helpers.prototype = { // conceptual at the moment
        circleToLineContact : function(circle, deltaV, line){ // returns the point of contact if any of a circle moving along deltaV will make contact with the line 
            
        },
        circleToLineSegContact : function(circle, deltaV, lineSeg){ // returns the point of contact if any of a circle moving along deltaV will make contact with the lineSeg 
            
        },
        
        
    }
  
    var geom = new Geom();
    geom.Geom = Geom;  // add geom to geom object for use by extentions or anything that needs to 
                       // extend the prototype of Geom.    
    geom.init();
    return geom
})();

