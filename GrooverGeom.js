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
            "Box",
            "Line",
            "Arc",
            "Circle",
            "Rectangle",
            "VecArray",
            "Transform",
        ];
        this.Vec = Vec;
        this.Line = Line;
        this.Circle = Circle;
        this.Arc = Arc;
        this.Rectangle = Rectangle;
        this.Box = Box;
        this.Transform = Transform;
        this.VecArray = VecArray;
        this.Geom = Geom;
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
            var s = this;
            var str = "";
            this.objectNames.forEach(function(n){
                str += "Object name: " + n + "\n";
                
                for(var i in s[n].prototype){
                    str += n + "." + i;
                    var st = s[n].prototype[i].toString();
                    var f = st.split("\n").shift();
                    if(f.indexOf("function") > -1){
                        
                        f = f.replace("function ","").replace("{","") ;
                        f = f.replace(/\/\/.*/g,"")
                        str += f + "\n";
                    }else{
                        str += " = '" +st+"'\n";
                    }
                }
            });
        }
    }
    var geom = new Geom();


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
    }
    function VecArray(){
        this.vecs = [];
    }
    function Line(vec1,vec2){
        if((vec1 === undefined || vec1 === null) && (vec2 === undefined || vec2 === null)){
            this.p1 = new Vec(0,0);
            this.p2 = new Vec(); // vec defualts to unit vec
        }else
        if(vec2.type !== undefined && vec2.type === "Vec" && vec2.type !== undefined && vec2.type === "Vec"){
            this.p1 = vec1;
            this.p2 = vec2;
        }else{
            this.p1 = new Vec(0,0);
            this.p2 = new Vec(); // vec defualts to unit vec            
        }
    }
    function Circle(vec,num){
        if((vec === undefined || vec === null) && (num === undefined || num === null)){
            this.p = new Vec(0,0);
            this.r = 1;
        }else 
        if(vec.type !== undefined && vec.type === "Vec" && typeof num === "number"){
            this.p = vec;
            this.r = num;
        }else{
            this.p = new Vec(0,0);
            this.r = 1;
        }
    }
    function Arc(circle,start,end){
        this.c = circle;
        this.s = start;
        this.e = end;
    }
    function Rectangle(top,aspect){
        this.t = top;
        this.a = aspect;
    }
    function Box(left,top,right,bottom){
        if((left === undefined || left === null) && (top === undefined || top === null)  && (right === undefined || right === null) && (bottom === undefined || bottom === null)){
            this.irrate();
            return;
        }
        this.l = left;
        this.t = top;
        this.r = right;
        this.b = bottom;
    }
    function Transform(xAxis,yAxis,origin){
        this.xa = xAxis;
        this.ya = yAxis;
        this.o = origin;
    }

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
        copy : function(){
            return new Vec(this.x,this.y);
        },
        setAs : function(v){
            this.x = v.x;
            this.y = v.y;
            return this;
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env (this.x, this.y);
            return box;
        },
        add : function(v){
            this.x += v.x;
            this.y += v.y;
            return this;
        },
        sub : function(v){
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
        c : undefined,
        s : undefined,
        e : undefined,
        type : "Arc",
        copy : function(){
            return new Arc(this.c.copy(),this.s,this.e);
        },
        setAs : function (arc){
            this.c.setAs(arc.c);
            this.s = arc.s;
            this.e = arc.e;
            return this;            
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            var a = this.copy().normalise();
            box.env (a.c.p.x + Math.cos(a.s) * a.c.r, a.c.p.y + Math.sin(a.s) * a.c.r );
            box.env (a.c.p.x + Math.cos(a.e) * a.c.r, a.c.p.y + Math.sin(a.e) * a.c.r );
            if(a.s <= 0 && a.e >= 0){
                box.env ( a.c.p.x + a.c.r)
            }
            if(a.s <= MPI && a.e >= MPI){
                box.env ( a.c.p.x - a.c.r);
            }
            if(a.s <= MPI90 && a.e >= MPI90){
                box.env (undefined, a.c.p.y + a.c.r)
            }
            if(a.s <= MPI270 && a.e >= MPI270){
                box.env (undefined, a.c.p.y - a.c.r)
            }
            return box;
        },
        asCircle : function(){
            return this.c.copy();
        },
        sweap : function (){
            var s  = ((this.s % MPI2) + MPI2) % MPI2;
            var e = ((this.e % MPI2) + MPI2) % MPI2;            
            if( s > e){
                s -= MPI2;
            }
            return (e-s);
        },
        fromCircleIntercept : function(circle){
            var pa = this.c.circleIntercept(circle);
            if(pa.vecs.length > 0){
                this.fromPoints(pa.vecs[0],pa.vecs[1]);
            }else{
                this.s = 0;
                this.e = 0;
            }
            return this;
        },
        areaOfPie : function (){
            var s  = ((this.s % MPI2) + MPI2) % MPI2;
            var e = ((this.e % MPI2) + MPI2) % MPI2;            
            if( s > e){
                s -= MPI2;
            }
            return this.c.r * this.c.r * (e-s);
        },
        areaOfSlice : function (){
            var s  = ((this.s % MPI2) + MPI2) % MPI2;
            var e = ((this.e % MPI2) + MPI2) % MPI2;            
            if( s > e){
                s -= MPI2;
            }
            var a = (e-s); // angle 
            var p =  this.c.r * this.c.r * a; // area of the pie shape
            var c = Math.sin(a/2) * this.c.r; // lenght of half the cord;
            var d = Math.sqrt(this.c.r * this.c.r - c * c); // length of line from center to cord
            return  p - c * d; // area is Pie area - triangle *2
        },
        swap : function(){
            var s = this.s;
            this.s = this.e;
            this.e = s;
            return this;
        },
        fromPoints : function(p1,p2,p3){
            if(p3 === undefined){
                this.s = this.c.angleOfPoint(p1);
                this.e = this.c.angleOfPoint(p2);
                return this;
            }
            var a1 = ((this.c.angleOfPoint(p1) % MPI2) + MPI2) % MPI2;
            var a2 = ((this.c.angleOfPoint(p2) % MPI2) + MPI2) % MPI2;
            var a3 = ((this.c.angleOfPoint(p3) % MPI2) + MPI2) % MPI2;
            this.s = Math.min(a1,a2,a3);
            this.e = Math.max(a1,a2,a3);
            return this;
        },
        setRadius : function (r){
            this.c.r = r;
            return this;
        },
        setCenter : function (p){
            this.c.p.x = p.x;
            this.c.p.y = p.y;
            return this;
        },
        setCircle : function (c){
            this.c.p.x = c.p.x;
            this.c.p.y = c.p.y;
            this.c.r = c.r;
            return this;
        },
        normalise : function(){
            this.s = ((this.s % MPI2) + MPI2) % MPI2;
            this.e = ((this.e % MPI2) + MPI2) % MPI2;
            return this;
        },
        towards : function(vec){
            var a = ((this.c.angleOfPoint(vec) % MPI2) + MPI2) % MPI2;
            var s = ((this.s % MPI2) + MPI2) % MPI2;
            var e = ((this.e % MPI2) + MPI2) % MPI2;
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
            var a = ((this.c.angleOfPoint(vec) % MPI2) + MPI2) % MPI2;
            var s = ((this.s % MPI2) + MPI2) % MPI2;
            var e = ((this.e % MPI2) + MPI2) % MPI2;
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
                .push(new Vec(this.c.p.x + Math.cos(this.s) * this.c.r,this.c.p.y + Math.sin(this.s) * this.c.r))
                .push(new Vec(this.c.p.x + Math.cos(this.e) * this.c.r,this.c.p.y + Math.sin(this.e) * this.c.r))
        },
        startAsVec : function() { 
            return new Vec(this.c.p.x + Math.cos(this.s) * this.c.r,this.c.p.y + Math.sin(this.s) * this.c.r);
        },
        endAsVec : function() { 
            return new Vec(this.c.p.x + Math.cos(this.e) * this.c.r,this.c.p.y + Math.sin(this.e) * this.c.r);
        },
        sweapLeng : function(){
            return (this.e - this.s) * this.c.r;
        },
        setcircumferanceLeng : function(leng){ 
            this.e = this.s  + (leng / (this.c.r ));
            return this;
        },
        cordLeng : function(){
            return Math.hypot(
                (this.c.p.x + Math.cos(this.s) * this.c.r) - (this.c.p.x + Math.cos(this.e) * this.c.r),
                (this.c.p.y + Math.sin(this.s) * this.c.r) - (this.c.p.y + Math.sin(this.e) * this.c.r)
            );
        },
        cordAsLine : function(){
            return new Line(
                new Vec(this.c.p.x + Math.cos(this.s) * this.c.r,this.c.p.y + Math.sin(this.s) * this.c.r),
                new Vec(this.c.p.x + Math.cos(this.e) * this.c.r,this.c.p.y + Math.sin(this.e) * this.c.r)
            );
        },
        great : function(){
            var s = ((this.s % MPI2) + MPI2) % MPI2;
            var e = ((this.e % MPI2) + MPI2) % MPI2;
            if(s > e){
                var ang = s - e;
                if(ang  < MPI){
                    this.s = s;
                    this.e = e;
                }else{
                    this.s = e;
                    this.e = s;
                }
            }else{
                var ang = e - s;
                if(ang  < MPI){
                    this.s = e;
                    this.e = s;
                }else{
                    this.s = s;
                    this.e = e;
                }
            }
            return this;
        },
        minor : function(){
            this.great();
            var t = this.s;
            this.s = this.e;
            this.e = t;
            return this;
        },
        isPointOn : function(p){
            var a = this.c.angleOfPoint(p1);
            if(a >= this.s && a <= this.e){
                return true;
            }
            return false;
            
        },
        fromTangentsToPoint : function(vec){
            var tp = this.c.tangentsPointsForPoint(vec);
            if(tp.length === 0){
                return this;
            }
            this.fromPoints(tp[0],tp[1]);
            
            return this;   
        },
        roundCorner : function(l1,l2){
            this.c.fitCorner(l1,l2);
            this.fromTangentsToPoint(l1.p2).towards(l1.p2);
            return this;
        },

    }
    Circle.prototype = {
        p : undefined,
        r : undefined,
        type : "Circle",
        copy : function(){
            return new Circle(this.p.copy(),this.r)
        },
        setAs : function (circle){
            this.p.setAs(circle.p);
            this.r = circle.r;
            return this;
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env (this.p.x - this.r,this.p.y - this.r);
            box.env (this.p.x + this.r,this.p.y + this.r);
            return box;
        },
        radius : function (r){
            this.r = r;
            return this;
        },
        circumferance : function(){
            return this.r * Math.PI * 2;
        },
        area : function(){
            return this.r * this.r * Math.PI * 2;
        },
        fromLine : function (line){
            this.fromPoints2(line.midPoint(),line.p2);
            return this
        },
        fromPoints2 : function (vec1, vec2){
            this.p.x = vec1.x;
            this.p.y = vec1.y;
            this.r = vec2.copy().sub(vec1).leng();
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
                this.p = new Vec(m1.x, f2 * m1.x + g2);  
            }else
            if(vec2.y == vec3.y){
                this.p = new Vec(m2.x, f1*m2.x + g1);
            } else{
                var x = (g2-g1) / (f1 - f2);
                this.p = new Vec(x, f1*x + g1);
            }

            this.r = vec1.copy().sub(this.p).leng();
            return this;
        },
        fromArea : function(area){
            this.r = Math.sqrt(area / (Math.PI * 2));
        },
        fromCircumferance : function(leng){
            this.r = leng / (Math.PI * 2);
        },
        touching : function(c){
            if(this.p.copy().sub(c.p).leng() > this.r + c.r){
                return false;
            }
            return true;
        },
        touchingLine : function(l){
            if(l.distFrom(this.p) > this.r){
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
            return (this.distFrom(circle.p) + circle.r < 0);
        },
        isLineInside : function(line){
            return (this.isPointInside(line.p1) && this.isPointInside(line.p2) );;
        },
        isPointInside : function(vec){
            return  this.p.distFrom(vec) < this.r;
        },
        distFrom : function(vec){
            return  this.p.distFrom(vec)-this.r;
        },
        closestPoint : function(vec){
            return  vec.copy().sub(this.p).setLeng(this.r).add(this.p);
        },
        lineSegInside : function(line){
            var pa = this.lineIntercept(line);
            if(pa.vecs.length > 0){
                var v1 = pa.vecs[0];
                var v2 = pa.vecs[1];
                var s = line.getUnitDistOfPoint(v1);
                var e = line.getUnitDistOfPoint(v2);
                if((s > 1 && e > 1) || (s < 0 && e < 0)){
                    return undefined;
                }
                if(e > 1 || e < 0){
                    v2 = line.p2.copy();
                }
                if(s > 1 || s < 0){
                    v1 = line.p1.copy();
                }
                return new Line(v1,v2);
            }
            return undefined
        },
        lineSegIntercept : function(l){
            var va = new VecArray();
            var d =  l.distFrom(this.p); // dist from line
            if(d <= this.r){
                var p = l.closestPoint(this.p);  // closest point on line
                var d1 = Math.sqrt(this.r*this.r- d*d);
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
            var d =  l.distFrom(this.p); // dist from line
            if(d <= this.r){
                var p = l.closestPoint(this.p);  // closest point on line
                var d1 = Math.sqrt(this.r*this.r- d*d);
                var v1 = l.asVec().setLeng(d1);
                return va.push(p.copy().sub(v1)).push(p.add(v1));
            }
            return va;
        },
        circleIntercept : function(circle){
            var va = new VecArray();
            var l = circle.p.copy().sub(this.p);
            var d = l.leng();
            if(d > this.r + circle.r){
                return va;
            }

            var x = (d * d - this.r * this.r + circle.r * circle.r) / ( 2 * d);
            var a = Math.sqrt(circle.r*circle.r - x * x);
            l.setLeng(x);

            var mid = circle.p.copy().sub(l);
            l.r90().setLeng(a);
            va.push(mid.copy().add(l))
            va.push(mid.sub(l));      

            return va
        },
        tangentAtPoint : function(p){
            var l = p.copy().sub(this.p);
            var at = l.copy().setLeng(this.r).add(this.p);
            l.r90();
            return new Line(at,at.copy().add(l));
        },
        angleOfPoint : function(p){
            return p.copy().sub(this.p).dir();
        },
        tangentsPointsForPoint : function(vec){  // finds where on the circle the tangents are for the point vec. In valid if point is inside the circle
            var va = new VecArray();
            var d = this.p.distFrom(vec);
            if(d <= this.r){  // point is inside so no tangents exist
                return va;  
            }
            var a = Math.acos(this.r / d);
            var a1 = this.p.angleTo(vec);
            return va
                .push(new Vec(null,a1-a).mult(this.r).add(this.p))
                .push(new Vec(null,a1+a).mult(this.r).add(this.p))
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
            var d = this.r / Math.sin(angle);
            
            this.p.setAs(v3.norm().mult(d).add(l2.p1));
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
        t : undefined,
        a : 1,
        type : "Rectangle",
        copy : function () {
            return new Rectangle(this.t.copy(),this.a);
        },
        setAs : function(rectange){
            this.t.setAs(rectange.t);
            this.a = rectange.a;
            return this;
        },
        width : function (){
            return this.t.leng();
        },
        height : function () {
            return this.t.leng() * this.a;
        },
        aspect : function (){
            return this.a;
        },
        setWidth : function (num){
            var h = this.t.leng() * this.a;
            this.t.setLeng(num);
            this.a = h / num;
        },
        setHeight : function (num){
            this.a = num / this.t.leng()
        },
        topLine : function(){
            return this.t.copy();
        },
        leftLine : function(){
            return new Line(this.t.p1.copy().add(this.t.asVec().r90().mult(this.a)),this.t.p1.copy());
        },
        rightLine : function(){
            return new Line(this.t.p2.copy(),this.t.p2.copy().add(this.t.asVec().r90().mult(this.a)));
        },
        bottomLine : function(){
            return this.t.copy().add(this.t.asVec().r90().mult(this.a)).reverse();
        },
        getCorners : function () {
            var v = this.t.asVec().r90().mult(this.a);
            var vecA = new VecArray();
            vecA.push(this.t.p1.copy());
            vecA.push(this.t.p2.copy());
            vecA.push(this.t.p2.copy().add(v));
            vecA.push(this.t.p1.copy().add(v));
            return vecA;
        },
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env ( this.t.p1.x, this.t.p1.y);
            box.env ( this.t.p2.x, this.t.p2.y);
            var v = this.t.asVec().r90().mult(this.a);
            box.env ( this.t.p1.x + v.x, this.t.p1.y + v.y);
            box.env ( this.t.p2.x + v.x, this.t.p2.y + v.y);
            return box;
        },
        area : function () {
            var l = this.t.leng();
            return l * l * this.a;
        },
        heightFromArea : function (area){
            var l = this.t.leng();
            this.a  = (area / l) / l;
            return this;
        },
        widthFromArea : function (area){
            var l = this.t.leng() * this.a;
            this.t.setLeng(Math.sqrt(area / (l * l)) / l);
            return this;
        },
        perimiter : function() {
            var l = this.t.leng();
            return l * 2 + l* this.a * 2;
        },
        diagonalLength : function () {
            var l = this.t.leng();
            return Math.hypot(l,l* this.a);
        },
        getCenter : function () {
            var v = this.t.asVec().r90().mult(this.a * (1/2));
            return this.t.midPoint().add(v);
        },
        getDiagonalLine : function (){
            var v = this.t.asVec().r90().mult(this.a);
            return new Line(this.t.p1.copy(),this.t.p2.copy().add(v));
        },
        getBottomRight : function (){
            return this.t.p2.copy().add(this.t.asVec().r90().mult(this.a));
        },
        isPointInside : function (vec){
            var v = vec.copy().sub(this.getBottomRight());
            var v1 = vec.copy().sub(this.t.p1);
            var v2 = this.t.asVec();
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
            var xa = new Vec(null,this.t.dir());
            ctx.setTransform(xa.x, xa.y, -xa.y * this.a, xa.x * this.a, this.t.p1.x, this.t.p1.y);
        },    
        setTransformArea : function (width, height){ // temp location of this function
            var l = this.t.leng();
            var xa = new Vec(null,this.t.dir()).mult(l/width);
            var ya = new Vec(null,this.t.dir()).mult((l* this.a)/width);
            ctx.setTransform(xa.x, xa.y, -ya.y, ya.x, this.t.p1.x, this.t.p1.y);
        },
        getPointAt : function(point){  // point is a relative unit coordinate on the rectangle
            var v = this.t.asVec();
            return this.t.p1.copy().add(v.copy().mult(point.x)).add(v.r90().mult(this.a * point.y));
        },
        getLocalPoint : function(vec){
            var dy = this.t.distFromDir(vec);
            var dx = this.leftLine().distFromDir(vec);
            var lw = this.t.leng();
            var lh = lw * this.a;
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
        t : 0,
        b : 0,
        l : 0,
        r : 0,
        type : "Box",
        copy : function (){
            return new Box (this.l,this.t,this.r,this.b);
        },
        setAs : function(box){
            this.t = box.t;
            this.l = box.l;
            this.r = box.r;
            this.b = box.b;
            return this;
        },      
        asBox : function(box){
            if(box === undefined){
                var box = new Box();
            }
            box.env(this.l,this.t);
            box.env(this.r,this.b);
            return box;
        },            
        asRectange : function () {
            var a = (this.b- this.t)  / (this.r- this.l);
            return new Rectangle ( new Line( new Vec(this.l,this.t)), a)
        },
        normalise : function (){
            var t,r,l,b;
            t = Math.min(this.t,this.b);
            b = Math.max(this.t,this.b);
            l = Math.min(this.l,this.r);
            r = Math.max(this.l,this.r);
            this.t = t;
            this.b = b;
            this.l = l;
            this.r = r;
            return this;
        },
        max : function () {
            this.t = -Infinity;
            this.b = Infinity;
            this.l = -Infinity;
            this.r = Infinity;
            return this;
        },
        irrate : function () {
            this.t = Infinity;
            this.b = -Infinity;
            this.l = Infinity;
            this.r = -Infinity;
            return this;
        },
        env : function ( x, y){
            if(y !== undefined && y !== null){
                this.t = Math.min(y,this.t);
                this.b = Math.max(y,this.b);
            }
            if(x !== undefined && x !== null){
                this.l = Math.min(x,this.l);
                this.r = Math.max(x,this.r);
            }
            return this;
        },
        envBox : function (box){
            this.t = Math.min(box.t,this.t);
            this.b = Math.max(box.b,this.b);
            this.l = Math.min(box.l,this.l);
            this.r = Math.max(box.r,this.r);
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

/** FrameUpdate.js end **/
