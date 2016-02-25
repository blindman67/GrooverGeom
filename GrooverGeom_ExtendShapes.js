
groover.geom.Geom.prototype.addShapes = function(){
    var geom = this;
    this.extentions.shapes = {   // add extentions for self documenter
        functions : [],
        info : "Provides helper functions to create complex shapes."
    };
    this.Shape = function(){
        this.items = [];
    }
    this.Shape.prototype = {
        items : [],
        polygon : function(){
            var vecA ;
            var convexInfo = {
                start : -1,
                count : 0,
            };
            this.verts = vecA;
            this.count = 0;
            this.dirty = true;
            this.items.push(vecA = new geom.VecArray())
            this.vecOfInterest;
            this.bounds = new geom.Box().irrate();
            this.caculate = function(){
                if(this.dirty){
                    this.dirty = false;
                    this.items = [];
                    this.items[0] = vecA;
                    if(this.count > 1){
                        for(var i = 0; i < this.count; i++){
                            this.items.push(new geom.Line(vecA.vecs[i],vecA.vecs[(i + 1)% this.count]));
                        }
                    }
                    this.bounds = this.asBox();
                    convexInfo.start = -1;
                }
                return this;
            };
            this.setVert = function(index,vec){
                if(index >= 0 && index < vecA.getCount()){
                    vecA.vecs[index].setAs(vec);
                }
            };
            this.addVert = function(vert,force){ 
                // add {avert} as Vec to the end of the array of verts. 
                // Will ignore vects that are the same as the first point or the same as the last point. 
                // The property polygon.dirty will be true if the vert has been added or its state will not change of the vert has not been added. if the {oforce} is true the vert will always be added. This could result in a polygon that may not be able to complete some of its functions
                this.count = vecA.vecs.length;
                var mIndex = vecA.indexOf(vert);
                if(!(force === true)){
                    if((this.count > 0 && mIndex === this.count-1) || (mIndex === 0 && this.count > 1)){
                        return this;
                    }
                }
                this.dirty = true;
                vecA.push(vert);
                this.count += 1;
                return this;
            };
            this.copy = function(){
                var shape = new geom.Shape();
                shape.polygon();
                this.items[0].each(function(vec){
                    shape.addVert(vec.copy());
                });
                return shape;
            }
            this.slice = function(line){
                this.caculate();
                if(this.items.length > 1){
                    vecA.clear();
                    var on = true;
                    for(var i = 1; i < this.items.length; i ++){
                        var l1 = this.items[i].copy();
                        var v1 = l1.interceptSeg(line);
                        if(v1.isEmpty()){
                            if(on){
                                this.addVert(l1.p1);
                            }
                        }else{
                            if(on){
                                on = false;
                                this.addVert(l1.p1);
                                this.addVert(v1);
                            }else{
                                on = true;
                                this.addVert(v1);
                            }
                        }
                    }
                }
                return this;
            }
            this.chamfer = function(amount){
                this.caculate();
                if(this.items.length > 1){
                    vecA.clear();
                    for(var i = 1; i < this.items.length; i ++){
                        var l1 = this.items[i].copy();
                        if(i + 1 >= this.items.length){
                            var l2 = this.items[1].copy();
                        }else{
                            var l2 = this.items[i + 1].copy()
                        }
                        this.addVert(l1.p2.copy().sub(l1.asVec().setLeng(amount)));
                        this.addVert(l2.p1.copy().add(l2.asVec().setLeng(amount)));
                    }
                }
                return this;
            }
            this.inflate = function(amount){
                this.caculate();
                if(this.items.length > 1){
                    var va = vecA.copy();
                    for(var i = 1; i < this.items.length; i ++){
                        var l1 = this.items[i].copy();
                        if(i + 1 >= this.items.length){
                            var l2 = this.items[1].copy();
                        }else{
                            var l2 = this.items[i + 1].copy()
                        }
                        l1.add(l1.asVec().norm().rN90().mult(amount));
                        l2.add(l2.asVec().norm().rN90().mult(amount));
                        va.vecs[i%va.vecs.length].setAs(l1.intercept(l2));
                    }
                    vecA.setAs(va);
                }
                return this;
            }
            this.getMinLeng = function(){
                this.caculate();
                if(this.items.length === 1){
                    return 0;
                }
                var minLen = Infinity;
                for(var i = 1; i < this.items.length; i ++){
                    minLen = Math.min(this.items[i].leng(),minLen);
                }
                return minLen;
            };
            this.getMaxLeng = function(){
                this.caculate();
                if(this.items.length === 1){
                    return 0;
                }
                var maxLen = -Infinity;
                for(var i = 1; i < this.items.length; i ++){
                    maxLen = Math.max(this.items[i].leng(),maxLen);
                }
                return maxLen;
            };
            this.isConvex = function(){
                this.caculate();
                var l1,l2,firstDirection,len;
                len = this.items.length;
                if(len > 1){
                    l1 = this.items[1].asVec();
                    for(var i = 2; i < len+1; i ++){
                        if(i === len){
                            l2 = this.items[1].asVec();
                        }else{
                            l2 = this.items[i].asVec();
                        }
                        if(firstDirection === undefined){
                            firstDirection = l1.cross(l2);
                        }else
                        if((l1.cross(l2) >= 0 && firstDirection < 0) || (l1.cross(l2) < 0 && firstDirection >= 0)){
                            return false;
                        }
                        l1 = l2;
                    }
                    return true;
                }
                return undefined;
            };
            this.isClockwise = function(){ // returns true if the polygon is clockwise
                this.caculate();
                if(vecA.sumCross() < 0){
                    return false;
                }
                return true; // return false if polygon is anti clockwise
            };
            this.isSelfIntersecting = function(){ // returns true is any lines are crossing 
                this.caculate();
                if(this.items.length > 1){
                    for(var i = 1; i < this.items.length; i ++){
                        var l1 = this.items[i];
                        for(var  j = i + 2; j < this.items.length; j ++){
                            var l2 = this.items[j];
                            var v1 = l1.interceptSegs(l2);
                            if(!v1.isEmpty()){
                                this.vecOfInterest = v1;
                                return true;
                            }
                        }
                    }
                }
                return false; // returns false is no lines are crossing           
            };
            this.setAs = function(polygon){
                var me = this;
                polygon.verts.each(function(vec,i){
                    if(i >= vecA.vecs.length){
                        me.addVert(vec)
                    }else{
                        vecA.vecs[i].setAs(vec);
                    }
                })
                vecA.vecs.length = polygon.verts.vecs.length;
                return this;
            };
            this.eachLine = function(callback,backward,start){
                var i;
                var len = this.items.length;
                var s = start === null || start === undefined ? 0 : start;
                if(backward === true){
                    s = (this.items.length-1)-start;
                    for(i = s;i >= 1; i-- ){
                        if(callback(this.items[i],i) === false){
                            break;
                        }
                    }
                }else{
                    s += 1;
                    for(var i = s; i < this.items.length; i ++){
                        if(callback(this.items[i],i) === false){
                            break;
                        }
                    }
                }
                return this;
            },
            this.getConvex = function(){
                var isC;
                this.caculate();
                isC = this.isConvex()
                if(isC === true){
                    return this.copy();
                }else
                if(isC === undefined){
                    log("empty")
                    return new geom.Empty();
                }
                var l1,l2,len,start,count,line1,line2,tempLine;
                var bendOutIndex;
                var bends = [null];
                tempLine = new geom.Line();
                len = this.items.length;
                var index = 0;
                if(len > 1){
                    line1 = this.items[1];
                    tempLine.p1 = line1.p1;
                    l1 = line1.asVec();
                    for(var i = 2; i < len+1; i ++){
                        if(i === len){
                            line2 = this.items[1];
                            index = 1;
                        }else{
                            line2 = this.items[i];
                            index = i;
                        }
                        l2 = line2.asVec();                    
                        if( l1.cross(l2)  < 0){
                            if(bendOutIndex === undefined){
                                bendOutIndex = index;
                            }
                            bends[index] = true;
                        }else{
                            bends[index] = false;
                        }
                        l1 = l2;
                        line1 = line2
                    }
                    
                    var start = bendOutIndex;
                    tempLine.p1 = this.items[bendOutIndex].p1;
                    var safeCross = true;
                    while(safeCross){
                        start -= 1;
                        if(start < 1){
                            start = len-1;
                        }
                        if(bends[start]){
                            start -= 1;
                            if(start < 1){
                                start = len-1;
                            }
                            log("bend at :"+start)
                            safeCross = false;
                        }else
                        if( (start - 1 >0 && start - 1 !== bendOutIndex) || (start - 1 === 0 && len - 1 !== bendOutIndex)){
                            safeCross = true;
                            tempLine.p2 = this.items[start].p1;
                            var vtl = tempLine.asVec();
                            if(vtl.cross(this.items[start].asVec()) < 0){ // does the new line bend out ??
                                safeCross = false;
                            }
                            if(safeCross){ // check if the new line intercepts any other lines.
                                this.eachLine(function(line,ind){
                                    if(ind !== start && (ind < start || ind > bendOutIndex)){
                                       
                                        if(tempLine.isLineSegIntercepting(line)){
                                            log("safeCross failed at :"+start)
                                            safeCross = false;
                                            return false;
                                        }
                                    }
                                    
                                });
                            }
                        }else{
                            safeCross = false;
                        }
                        
                    }
                    start += 1;
                    if(start >= len){
                        start = 1;
                    }

                    
                }
                log("lines from "+start+ " : "+ bendOutIndex)
                var poly = new geom.Shape().polygon();
                convexInfo.start = start
                if(bendOutIndex < start){
                    bendOutIndex += len-1;
                }
                convexInfo.count = bendOutIndex - start;
                poly.addVert(this.items[start].p1);
                var ind;
                for(var i = start; i < bendOutIndex; i ++){
                    ind = i;
                    if(ind >= len){
                        ind = (ind - len) + 1;
                    }
                    poly.addVert(this.items[ind].p2);
                }
                log("newP")
                return poly;
            },
            this.removeLines = function(from,to){
                if((from === null || from === undefined) && convexInfo.start > -1){
                    from = convexInfo.start;
                    to = convexInfo.start + convexInfo.count;
                }

                vecA.clear();
                var me = this;
                var firstAdded = false;
                this.eachLine(function(line,ind){
                    if(!(ind >= from && ind < to)){
                        if(!firstAdded){
                            me.addVert(line.p1)
                            firstAdded = true;
                        }
                        me.addVert(line.p2);
                    }
                });
                this.items = [vecA];
                this.dirty = true;
                
                return this;
            };
            this.isVecInside = function(vec){
                this.caculate();
                if(this.bounds.isVecInside(vec)){
                    for(var i = 1; i < this.items.length; i ++){
                        if(!this.items[i].isVecLeft(vec)){
                            return false;
                        };
                    }
                    return true;
                }
                return false;
                
            };
            this.isLineInside = function(line){
                this.caculate();
                if(this.bounds.isVecInside(vec)){
                    for(var i = 1; i < this.items.length; i ++){
                        if(!this.items[i].isLineLeft(line)){
                            return false;
                        };
                    }
                    return true;
                }
                return false;
                
            };
            this.makeDirty = function(){
                this.dirty = true;
                return this;
            };
            this.asBox = function(box){
                this.caculate();
                return vecA.asBox(box);
            };
            // add drawing functions
            if(vecA.mark !== undefined){
                this.lineTo = function(){
                    this.caculate();
                    if(this.items.length > 1){
                        this.items[1].p1.lineTo();
                    }
                    return this;// returns this;
                }
                this.moveTo = function(){
                    this.caculate();
                    if(this.items.length > 1){
                        this.items[1].p1.moveTo();
                    }
                    return this;// returns this;
                }
                this.draw = function(dir){
                    this.caculate();
                    if(this.items.length > 1){
                        this.items[1].p1.lineTo();
                        for(var i = 2; i < this.items.length; i ++){
                            this.items[i].p1.lineTo();
                        }
                        this.items[1].p1.lineTo();
                    }
                    return this;// returns this;
                }
                this.mark = function(){
                    this.caculate();
                    if(this.items.length > 1){
                        this.items[1].p1.mark();
                        for(var i = 2; i < this.items.length; i ++){
                            this.items[i].p1.mark();
                        }
                    }
                    return this;// returns this;
                }
            }      
            this.area = function(){
                this.caculate();
                if(this.items.length > 1){
                    return vecA.area();
                }
                return 0;
                
            }
            this.perimiter = function(){ // Returns the length of the perimiter of this shape
                this.caculate();
                if(this.items.length > 1){
                    return vecA.perimiter();
                }
                return 0;
            }       
            return this;
        },
        roundedPill : function (vec1, vec2, number1, number2) { // Creates a rounded pill shape with {avec}1 and {avec}2 being the center of each end and {anumber1} and {anumber2} are the radius at each end{avec}1
            var c1,c2,a1,a2, l1,l2,mainC;
            this.isCircle = false;
            this.items.push(c1 = new geom.Circle(vec1,number1));
            this.items.push(c2 = new geom.Circle(vec2,number2));
            this.items.push(l1 = new geom.Line());
            this.items.push(l2 = new geom.Line());
            this.items.push(a1 = new geom.Arc(c1,0,0));
            this.items.push(a2 = new geom.Arc(c2,0,0));
            this.calculate = function(){
                var l = new geom.Line(c1.center,c2.center);
                var dir = l.dir();
                var dist = l.leng();
                if(dist < Math.max(c1.radius,c2.radius) - Math.min(c1.radius,c2.radius)){
                    this.isCircle = true;
                    if(c1.radius > c2.radius){
                        mainC = c1;
                    }else{
                        mainC = c2;
                    }
                }else{
                    this.isCircle = false;
                    if(c2.radius === c1.radius){
                        a1.start = dir + Math.PI * (1 / 2);
                        a1.end = dir + Math.PI * (3 / 2);
                        a2.start = dir - Math.PI * (1 / 2);
                        a2.end = dir + Math.PI * (1 / 2);
                    }else{
                        //var d = l.leng(); //c2.center.copy().sub(c1.center).leng(); 
                       // var dir = c2.center.copy().sub(c1.center).dir(); 
                        var rr = c1.radius - c2.radius;
                        var d = Math.sqrt(dist * dist - rr * rr)
                        var s = rr / d;
                        var c =  c1.radius/s;//(d * rr)/c1.radius;
                        var e = Math.hypot(c,c1.radius);
                        var ang = Math.asin(c/e);
                        a1.start = dir + ang;
                        a1.end = dir + (Math.PI*2) - ang;
                        a2.end = dir + ang;
                        a2.start = dir - ang;
                        a2.normalise();
                        a1.normalise();
                    }
                    var end1 = a1.endsAsVec();
                    var end2 = a2.endsAsVec();
    
                    l1.p1 = end1.vecs[1];
                    l1.p2 = end2.vecs[0];
                    l2.p2 = end1.vecs[0];
                    l2.p1 = end2.vecs[1];
                }
                return this; // returns this;

            }                
            if(c1.mark !== undefined){
                this.lineTo = function(){
                    if(this.isCircle){
                        mainC.lineTo();
                    }else{
                        l1.lineTo();
                    }
                    return this;// returns this;
                }
                this.moveTo = function(){
                    if(this.isCircle){
                        mainC.moveTo();
                    }else{
                        l1.moveTo();
                    }
                    return this;// returns this;
                }
                this.draw = function(dir){
                    if(this.isCircle){
                        mainC.draw(dir);
                    }else{
                        if(dir){
                            a2.draw(true);
                            l2.draw(true);
                            a1.draw(true);
                            l1.draw(true);                        
                        }else{
                            l1.draw();
                            a2.draw();
                            l2.draw();
                            a1.draw();
                        }
                    }
                    return this;// returns this;
                }
                this.mark = function(){
                    if(this.isCircle){
                        mainC.mark();
                    }else{
                        l1.mark();
                        a2.mark();
                        l2.mark();
                        a1.mark();
                    }
                    return this;// returns this;
                }
            }
            this.area = function(){ // Returns the area of this shape
                this.calculate();
                if(this.isCircle){
                    return mainC.area();
                }
                var a = a2.areaOfSegment() + a1.areaOfSegment();
                var va = new geom.VecArray();
                va.push(l1.p1);
                va.push(l2.p2);
                va.push(l2.p1);
                va.push(l1.p2);
                log(va.area())
                a += va.area();
                return a; // returns a Number
            }
            this.perimiter = function(){ // Returns the length of the perimiter of this shape
                this.calculate();          // returns a number
                if(this.isCircle){
                    return mainC.circumference();
                }
                return a2.arcLength() + a1.arcLength() + l1.leng() + l2.leng();
            }           
            this.asBox = function(box){
                this.calculate();
                if(this.isCircle){
                    return mainC.asBox(box);
                }
                box = a1.asBox(box);
                return l2.asBox(l1.asBox(a2.asBox(box)));
            }
            this.calculate();
            return this;
        }
    }
    
    
}
