
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
                        var rr = c1.radius - c2.radius;
                        var d = Math.sqrt(dist * dist - rr * rr)
                        var s = rr / d;
                        var c =  c1.radius/s;
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
            this.calculate();

        
            
            
        }
    }
    
    
}