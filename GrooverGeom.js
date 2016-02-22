var groover = {};
groover.geom = (function (){
    const MPI2 = Math.PI * 2;
    const MPI = Math.PI ;
    const MPI90 = Math.PI / 2;
    const MPI180 = Math.PI;
    const MPI270 = Math.PI * ( 3 / 2);
    const MPI360 = Math.PI * 2;
    const MR2D = 180 / MPI;
    Math.triPh = function(a,b,c){  
        return Math.acos((c * c - (a * a + b * b)) / (-2 * a * b));
    }
    Math.triCosPh = function(a,b,c){
        return (c * c - (a * a + b * b)) / (-2 * a * b);
    }
    Math.triLenC = function(a,b,pheta){
        return Math.sqrt(a * a + b * b - 2 * a * b * Math.cos(pheta));
    }
    Math.triLenC2 = function(a,b,pheta){
        return a*a + b*b - 2*a*b*Math.cos(pheta);
    }
    if(typeof Math.hypot !== "function"){
        Math.hypot = function(x, y){ return Math.sqrt(x * x + y * y);};
    }
        
    function Geom(){

        this.objectNames = [
            "Vec",
            "VecArray",
            "Line",
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
            Empty : ["type"],
        };
        this.Vec = Vec;
        this.Line = Line;
        this.Circle = Circle;
        this.Arc = Arc;
        this.Rectangle = Rectangle;
        this.Box = Box;
        this.Transform = Transform;
        this.VecArray = VecArray;
        this.Geom = Geom;
        this.Empty = Empty;
    }
    Geom.prototype = {
        isGeom : function (obj){
            if(obj !== undefined && typeof obj.type === "string"){
                if(this.types.indexOf(obj.type) > -1){
                    return true;
                }
            }        
            return false;
        },
        getDetails : function(){
            function getComments(lines,currentObj){
                cLines = [];
                lines.forEach(function(line){
                    if(line.indexOf("//") > -1){
                        var l = (line.split("//").pop().trim());
                        if(l !== ""){
                            l = l.replace( /\{a(.*?)\}/g, "requiered argument `$1`");
                            l = l.replace( /\{o(.*?)\}/g, "optional argument `$1`");
                            s.objectNames.forEach(function(n){
                                l = l.replace(new RegExp("("+n+")","gi"),"[$1](#"+n+")");
                            })
                            l = l.replace( /\`(this*?)`/g, "[$1](#"+currentObj+")");
                            l = l[0].toUpperCase() + l.substr(1);
                            cLines.push("    " +l);
                        }
                        
                    }
                });
                return cLines;
            }
            var s = this;
            var str = "";
             
            this.objectNames.forEach(function(n){
                var desc = "### " + n + "\n";
                var methods = "Functions.\n";
                var propDesc = "Properties.\n";
                var pr = s.properties[n];
                var extentions = {};
                
                
                for(var i in s[n].prototype){
                   
                    if(typeof s[n].prototype[i] === "function"){
                        var ce = "";
                        for(var k in s.extentions){
                            if(s.extentions[k].functions.indexOf(i) > -1){
                                if(extentions[k] === undefined){
                                    extentions[k] = k + " extention.\n"
                                }
                                ce = k;
                                break;
                            }
                        }
                        st = s[n].prototype[i].toString();
                        f = st.split("\n");
                        var com = getComments(f,n);
                        f = f.shift();
                        f = f.replace("function ","").replace("{","") ;
                        f = f.replace(/\/\/.*/g,"");

                        if(ce !== ""){
                            extentions[ce] += "- "+n + "." + i+f + "\n";
                            if(com.length > 0){
                                extentions[ce] += com.join("\n")+"\n";
                            }
                        }else{
                            methods += "- "+n + "." + i+f + "\n";
                            if(com.length > 0){
                                methods += com.join("\n")+"\n";
                            }
                        }
                    }else
                    if(typeof s[n].prototype[i] === "string"){
                        st = s[n].prototype[i].toString();
                        f = st.split("\n").shift();
                        propDesc += "- "+n + "." + i+" = '" +st+"'\n";
                    }else{
                        st = typeof s[n].prototype[i];
                        propDesc += "- "+n + "." + i+" = " +st+"\n";
                    }
                }
                str += desc + "\n";
                str += propDesc + "\n";
                str += methods + "\n";
                for(var k in extentions){
                    str += extentions[k] + "\n";
                }
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
        this.circle = circle;
        this.start = start;
        this.end = end;
    };
    function Rectangle(top,aspect){
        this.top = top;
        this.aspect = aspect;
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
        copy : function(){ return new Empty(); },
        asBox : function(box){
            if(box === undefined){
                box = new Box();
            }
            return box;
        },
        setAs : function(){
            return this;
        },
        isEmpty : function(){
            return true;
        },
    },
    VecArray.prototype =  {
        vecs : [],
        type :"VecArray",
        each : function (func){
            var i;
            var l = this.vecs.length; // do not be tempted to put length in the for statement
                                      // doing so will cause an infinit loop if appending to self
            for(i =0; i < l; i ++){
                if(func(this.vecs[i],i) === false){
                    break;
                }
            }
            return this;
        },
        cull : function (func){  // func return true to keep
            var i;
            var l = this.vecs.length; 
            for(i =0; i < l; i ++){
                if(func(this.vecs[i],i) === false){
                    this.vecs.splice(i,1);
                    i -= 1;
                    l -= 1;
                }
            }
            return this;
        },
        copy : function (){
            var va = new VecArray();
            this.each(function(vec){
                va.push(vec.copy());
            });
            return va;
        },
        setAs :function (vecArray){
            this.each(function(vec,i){
                vec.x = vecArray[i].x;
                vec.y = vecArray[i].y;
            });
            return this;
        },
        isEmpty : function (){
            if(this.vecs.length === 0){
                return true;
            }
            return false;
        },
        push : function (vec){
            this.vecs[this.vecs.length] = vec;
            return this;
        },
        append : function(vecArray){  // this is safe becasue each() only loops a set count
            vecArray.each(function(vec){
                this.push(vec);
            })
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            this.each(function(vec){
               box.env(vec.x,vec.y);
            });
            return box;
        },
        mult : function (num){
            this.each(function(vec){
               vec.mult(num);
            });
            return this;
        },
        add : function (v){
            this.each(function(vec){
               vec.add(v);
            });
            return this;
        },
        rotate : function(num){
            this.each(function(vec){
               vec.rotate(num); 
            });
            return this;
        },
        getLast : function(){
            return this.vecs[this.vecs.length-1];
        },
        getCount : function(){
            return this.vec.length;
        }
    }
    Vec.prototype = {
        x : 1,
        y : 0,
        type : "Vec",
        copy : function(){  // Creates a copy of this
            return new Vec(this.x,this.y);  // returns a new `this`
        },
        setAs : function(vec){  // Sets this vec to the values in the {avec}
            this.x = vec.x;
            this.y = vec.y;
            return this;  // Returns the existing `this`
        }, 
        asBox : function(box){  // returns the bounding box that envelops this vec
            if(box === undefined){
                var box = new Box();  // {obox} is created if not supplied
            }
            box.env (this.x, this.y);
            return box;  // returns `box`
        },
        isEmpty : function (){  // Vec can not be empty so always returns true
            return false;  
        },
        add : function(vec){ // adds {avec} to this.
            this.x += vec.x;
            this.y += vec.y;
            return this;    // returns `this`
        },
        sub : function(v){  // subtracts {avec} from this.
            this.x -= v.x;
            this.y -= v.y;
            return this;
        },
        mult : function(m){
            this.x *= m;
            this.y *= m;
            return this;
        },
        div : function(m){
            this.x /= m;
            this.y /= m;
            return this;
        },
        rev : function () {
            this.x = - this.x;
            this.y = - this.y;
            return this;
        },
        r90 : function(){
            var x = this.x;
            this.x = - this.y;
            this.y = x;
            return this;
        },
        rN90 : function(){
            var x = this.x;
            this.x = this.y;
            this.y = -x;
            return this;
        },
        r180 : function(){
            this.x = - this.x;
            this.y = - this.y;
            return this;
        },
        half : function(){
            this.x /= 2;
            this.y /= 2;
            return this;
        },
        setLeng : function(len){
            return this.norm().mult(len);
        },
        setDir : function(dir){
            var l = this.leng();
            this.x = Math.cos(dir);
            this.y = Math.sin(dir);
            return this.mult(l);
        },
        rotate : function(ang){
            return this.setDir(this.dir() + ang);
        },
        leng : function(){
            return Math.hypot(this.x,this.y);
        },
        leng2 : function(){
            return this.x*this.x + this.y * this.y;
        },
        dir : function(){
            return Math.atan2(this.y,this.x);
        },
        mid : function(v){
            return v.copy().norm().add(this.copy().norm()).div(2).norm().mult((this.leng()+v.leng())/2);
        },
        norm : function(){
            return this.div(this.leng());
        },
        dot : function(v){
            return this.x * v.x + this.y * v.y;
        },
        cross : function(v){
            return this.x * v.y - this.y * v.x;
        },
        dotNorm : function(v){
            return this.copy().norm().dot(v.copy().norm());
        },
        crossNorm : function(v){
            return this.copy().norm().cross(v.copy().norm());
        },
        angleBetween : function(v){
            return Math.asin(this.crossNorm(v));
        },
        distFrom : function(vec){
            return Math.hypot(this.x-vec.x,this.y-vec.y);
        },
        angleTo : function(vec){
            return Math.atan2(vec.y - this.y,vec.x-this.x);
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
            return this;            
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
        fromCircleIntercept : function(circle){
            var pa = this.circle.circleIntercept(circle);
            if(pa.vecs.length > 0){
                this.fromPoints(pa.vecs[0],pa.vecs[1]);
            }else{
                this.start = 0;
                this.end = 0;
            }
            return this;
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
            return this;
        },
        fromPoints : function(p1,p2,p3){
            if(p3 === undefined){
                this.start = this.circle.angleOfPoint(p1);
                this.end = this.circle.angleOfPoint(p2);
                return this;
            }
            var a1 = ((this.circle.angleOfPoint(p1) % MPI2) + MPI2) % MPI2;
            var a2 = ((this.circle.angleOfPoint(p2) % MPI2) + MPI2) % MPI2;
            var a3 = ((this.circle.angleOfPoint(p3) % MPI2) + MPI2) % MPI2;
            this.start = Math.min(a1,a2,a3);
            this.end = Math.max(a1,a2,a3);
            return this;
        },
        setRadius : function (r){
            this.circle.radius = r;
            return this;
        },
        setCenter : function (p){
            this.circle.center.x = p.x;
            this.circle.center.y = p.y;
            return this;
        },
        setCircle : function (c){
            this.circle.center.x = c.center.x;
            this.circle.center.y = c.center.y;
            this.circle.radius = c.radius;
            return this;
        },
        normalise : function(){
            this.start = ((this.start % MPI2) + MPI2) % MPI2;
            this.end = ((this.end % MPI2) + MPI2) % MPI2;
            return this;
        },
        towards : function(vec){
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
            return this.swap();
        },
        away : function(vec){
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
            return this;
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
            return this;
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
            return this;
        },
        minor : function(){
            this.great();
            var t = this.start;
            this.start = this.end;
            this.end = t;
            return this;
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
            
            return this;   
        },
        roundCorner : function(l1,l2){
            this.circle.fitCorner(l1,l2);
            this.fromTangentsToPoint(l1.p2).towards(l1.p2);
            return this;
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
        touching : function(c){
            if(this.center.copy().sub(c.center).leng() > this.radius + c.radius){
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
            
    }
    Line.prototype = {
        p1 : undefined,
        p2 : undefined,
        type : "Line",        
        copy : function(){
            return new Line(this.p1.copy(),this.p2.copy());
        },
        setAs : function(line){
            this.p1.setAs(line.p1);
            this.p2.setAs(line.p2);
            return this;
        },
        isEmpty : function(){
            if(this.leng === 0){
                return true;
            }
            return false;
        },
        createEmpty : function (){
            return new Line(this.p1.copy(),this.p1.copy());
        },
        swap : function(){
            var t = this.p1;
            this.p1 = this.p2;
            this.p2 = t;
            return this;
        },
        reverse : function(){
            return this.swap();
        },
        asVec : function(){
            return new Vec(this.p1,this.p2);
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
        leng : function(){
            return Math.hypot(this.p2.y-this.p1.y,this.p2.x-this.p1.x);
        },
        dir : function(){
            return Math.atan2(this.p2.y-this.p1.y,this.p2.x-this.p1.x);
        },
        extend : function(factor){
            this.setLeng(this.leng() * factor).centerOnStart();
            return this;
        },
        setLeng : function(len){
            var v1 = this.asVec().setLeng(len);
            this.p2.x = this.p1.x + v1.x;
            this.p2.y = this.p1.y + v1.y;
            return this;
        },
        setDir : function(num){
            var v1 = this.asVec().setDir(num);
            this.p2.x = this.p1.x + v1.x;
            this.p2.y = this.p1.y + v1.y;
            return this;
        },
        cross : function(){
            return this.p1.cross(this.p2);
        },
        crossBack : function(){
            return this.p2.cross(this.p1);
        },
        mult : function(num){
            this.p1.x *= num;
            this.p1.y *= num;
            this.p2.x *= num;
            this.p2.y *= num;
            return this;
        },
        add : function(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            return this;
        },
        translate : function(vec){
            this.p1.x += vec.x;
            this.p1.y += vec.y;
            this.p2.x += vec.x;
            this.p2.y += vec.y;
            return this;
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
            return this;
        },
        scale : function(num){
            this.p1.x *= num;
            this.p1.y *= num;
            this.p2.x *= num;
            this.p2.y *= num;
            return this;
        },
        midPoint : function(){
            return new Vec((this.p1.x + this.p2.x)/2,(this.p1.y + this.p2.y)/2);
        },
        unitAlong : function ( unitDist){
            return new Vec(
                (this.p2.x - this.p1.x) * unitDist + this.p1.x,
                (this.p2.y - this.p1.y) * unitDist + this.p1.y
            );
        },
        distanceAlong : function ( dist) {
            return this.unitAlong(dist/this.leng());
        },
        angleBetween : function (line){
            return Math.asin( this.asVec().crossNorm(line.asVec()));
        },
        angleFromNormal : function (line){
            var norm = Math.sin(this.asVect().r90().crossNorm(line.asVec()));
        },
        setTransformToLine :function(ctx){
            var xa = new Vec(null,this.dir());
            ctx.setTransform(xa.x, xa.y, -xa.y, xa.x, this.p1.x, this.p1.y)
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
            return this;
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
            return this;
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
            return this;
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
            return this;
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
            return this;
                
        },
        intercept : function(l2){
            var v1 = new Vec(this.p2,this.p1);
            var v2 = new Vec(l2.p2,l2.p1);
            var c = v1.cross(v2);
            var v3 = new Vec(this.cross(),l2.cross());
            return new Vec( v3.cross(new Vec(v1.x,v2.x))/c,v3.cross(new Vec(v1.y,v2.y))/c);
        },
        distFrom : function(p){
            var v = this.asVec();
            var pp = p.copy().sub(this.p1);
            return v.mult((pp.x * v.x + pp.y * v.y)/v.leng2()).add(this.p1).sub(p).leng();
        },
        distFromDir : function(p){ // 
            var v = this.asVec();
            var pp = p.copy().sub(this.p1);
            if(v.crossNorm(pp)>= 0){
                return v.mult((pp.x * v.x + pp.y * v.y)/v.leng2()).add(this.p1).sub(p).leng();
            }else{
                return -v.mult((pp.x * v.x + pp.y * v.y)/v.leng2()).add(this.p1).sub(p).leng();
            }
        },
        lineTo : function(p){
            var v = this.asVec();
            var pp = p.copy().sub(this.p1);
            return new Line(p.copy(), v.mult((pp.x * v.x + pp.y * v.y)/v.leng2()).add(this.p1));
        },
        getDistOfPoint : function(vec){
            var l = this.leng();
            var l1 = vec.distFrom(this.p1);
            var l2 = vec.distFrom(this.p2);
            if((l1 <= l && l2 <= l) || l1 > l2){
                return l1;
            }
            return -l1;
        },
        getUnitDistOfPoint : function(vec){
            var l = this.leng();
            var l1 = vec.distFrom(this.p1)/l;
            var l2 = vec.distFrom(this.p2)/l;
            if((l1 <= 1 && l2 <= 1) || l1 > l2){
                return l1;
            }
            return -l1;
        },
        getDistOfPointSafe : function(vec){
            var l = this.leng();
            var v1 = this.closestPoint(vec);
            var l1 = v1.distFrom(this.p1);
            var l2 = v1.distFrom(this.p2);
            if((l1 <= l && l2 <= l) || l1 > l2){
                return l1;
            }
            return -l1;
        },
        getUnitDistOfPointSafe : function(vec){
            var l = this.leng();
            var v1 = this.closestPoint(vec);
            var l1 = v1.distFrom(this.p1)/l;
            var l2 = v1.distFrom(this.p2)/l;
            if((l1 <= 1 && l2 <= 1) || l1 > l2){
                return l1;
            }
            return -l1;
        },    
        closestPoint : function(vec){
            var v = this.asVec();
            var pp = vec.copy().sub(this.p1);
            return v.mult((pp.x * v.x + pp.y * v.y)/v.leng2()).add(this.p1);
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
            
        }
    }
    Rectangle.prototype = {
        top : undefined,
        aspect : 1,
        type : "Rectangle",
        copy : function () {
            return new Rectangle(this.top.copy(),this.aspect);
        },
        setAs : function(rectange){
            this.top.setAs(rectange.top);
            this.aspect = rectange.aspect;
            return this;
        },
        isEmpty : function(){
            if(this.aspect === 0 || this.top.leng() === 0){
                return true;
            }
            return false;
        },
        width : function (){
            return this.top.leng();
        },
        height : function () {
            return this.top.leng() * this.aspect;
        },
        aspect : function (){
            return this.aspect;
        },
        setWidth : function (num){
            var h = this.top.leng() * this.aspect;
            this.top.setLeng(num);
            this.aspect = h / num;
        },
        setHeight : function (num){
            this.aspect = num / this.top.leng()
        },
        topLine : function(){
            return this.top.copy();
        },
        leftLine : function(){
            return new Line(this.top.p1.copy().add(this.top.asVec().r90().mult(this.aspect)),this.top.p1.copy());
        },
        rightLine : function(){
            return new Line(this.top.p2.copy(),this.top.p2.copy().add(this.top.asVec().r90().mult(this.aspect)));
        },
        bottomLine : function(){
            return this.top.copy().add(this.top.asVec().r90().mult(this.aspect)).reverse();
        },
        getCorners : function () {
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
        area : function () {
            var l = this.top.leng();
            return l * l * this.aspect;
        },
        heightFromArea : function (area){
            var l = this.top.leng();
            this.aspect  = (area / l) / l;
            return this;
        },
        widthFromArea : function (area){
            var l = this.top.leng() * this.aspect;
            this.top.setLeng(Math.sqrt(area / (l * l)) / l);
            return this;
        },
        perimiter : function() {
            var l = this.top.leng();
            return l * 2 + l* this.aspect * 2;
        },
        diagonalLength : function () {
            var l = this.top.leng();
            return Math.hypot(l,l* this.aspect);
        },
        getCenter : function () {
            var v = this.top.asVec().r90().mult(this.aspect * (1/2));
            return this.top.midPoint().add(v);
        },
        getDiagonalLine : function (){
            var v = this.top.asVec().r90().mult(this.aspect);
            return new Line(this.top.p1.copy(),this.top.p2.copy().add(v));
        },
        getBottomRight : function (){
            return this.top.p2.copy().add(this.top.asVec().r90().mult(this.aspect));
        },
        isPointInside : function (vec){
            var v = vec.copy().sub(this.getBottomRight());
            var v1 = vec.copy().sub(this.top.p1);
            var v2 = this.top.asVec();
            var c = v2.cross(v1);
            if(v2.cross(v1) >= 0 && v2.cross(v) <= 0 && v2.r90().cross(v1) <= 0 && v2.cross(v) >= 0){
                return true;
            }
            return false;
        },
        isLineInside : function (line){
            return (this.isPointInside(line.p1) && this.isPointInside(line.p2));
        },
        setTransform :function(ctx){   // temp location of this function
            var xa = new Vec(null,this.top.dir());
            ctx.setTransform(xa.x, xa.y, -xa.y * this.aspect, xa.x * this.aspect, this.top.p1.x, this.top.p1.y);
        },    
        setTransformArea : function (width, height){ // temp location of this function
            var l = this.top.leng();
            var xa = new Vec(null,this.top.dir()).mult(l/width);
            var ya = new Vec(null,this.top.dir()).mult((l* this.aspect)/width);
            ctx.setTransform(xa.x, xa.y, -ya.y, ya.x, this.top.p1.x, this.top.p1.y);
        },
        getPointAt : function(point){  // point is a relative unit coordinate on the rectangle
            var v = this.top.asVec();
            return this.top.p1.copy().add(v.copy().mult(point.x)).add(v.r90().mult(this.aspect * point.y));
        },
        getLocalPoint : function(vec){
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
        }
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
            return this;
        },      
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env(this.left,this.top);
            box.env(this.right,this.bottom);
            return box;
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
            return this;
        },
        max : function () {
            this.top = -Infinity;
            this.bottom = Infinity;
            this.left = -Infinity;
            this.right = Infinity;
            return this;
        },
        irrate : function () {
            this.top = Infinity;
            this.bottom = -Infinity;
            this.left = Infinity;
            this.right = -Infinity;
            return this;
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
            return this;
        },
        envBox : function (box){
            this.top = Math.min(box.top,this.top);
            this.bottom = Math.max(box.bottom,this.bottom);
            this.left = Math.min(box.left,this.left);
            this.right = Math.max(box.right,this.right);
            return this;
        },
        envelop : function (obj){
            if(geomInfo.isGeom(obj)){
                this.envBox(obj.asBox());
            }
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
        setYxis : function(vec){
            this.ya.x = vec.x;
            this.ya.y = vec.y;
        },
    }

    return geom
})();

