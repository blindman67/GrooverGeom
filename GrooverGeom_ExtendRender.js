groover.geom.Geom.prototype.addRender = function(ctx1){
    var geom = this;
    var ctx = ctx1;
    var workVec = new geom.Vec();  // rather than create a new vec each time just use this onerror
    this.extentions.render = {   // add extentions for self documenter
        functions : ["lineTo","moveTo","draw","mark"],
        info : "Provides helper functions to render primitives to the canvas 2D context."
    };
    
    
    
    geom.Geom.prototype.ctx = ctx;
    geom.Geom.prototype.size = 1;
    geom.Geom.prototype.setCtx = function(ctx1){
        this.ctx = ctx1;
        ctx = ctx1;        
    };
    var size = 1;
    geom.Geom.prototype.size = size;
    geom.Geom.prototype.setSize = function(newSize){
        size = newSize;
        this.size = 1;
    };
    
    geom.Geom.prototype.marks = {
        cross : function (vec){
            ctx.moveTo(vec.x - size, vec.y);
            ctx.lineTo(vec.x + size, vec.y);
            ctx.moveTo(vec.x, vec.y - size);
            ctx.lineTo(vec.x, vec.y + size);
        },
        crossDiag : function (vec){
            ctx.moveTo(vec.x - size, vec.y - size);
            ctx.lineTo(vec.x + size, vec.y + size);
            ctx.moveTo(vec.x + size, vec.y - size);
            ctx.lineTo(vec.x - size, vec.y + size);
        },
        circle : function (vec){
            ctx.moveTo(vec.x + size, vec.y)
            ctx.arc(vec.x, vec.y, size, 0, Math.PI*2);
        },
        square : function (vec){
            ctx.rect(vec.x - size / 2, vec.y - size / 2, size, size);
        },
        tri : function (vec){
            ctx.moveTo(vec.x, vec.y - size);
            ctx.lineTo(vec.x + size, vec.y + size);
            ctx.lineTo(vec.x - size, vec.y + size);
            ctx.closePath();
        },
        vecArrayShape : undefined,
        vecArray : function(vec){
            if(this.vecArrayShape !== undefined){
                this.vecArrayShape.each(function(vec1,i){
                    if(i === 0){
                        ctx.moveTo(vec.x + vec1.x, vec.y +vec1.y);
                    }else{
                        ctx.lineTo(vec.x + vec1.x, vec.y +vec1.y);
                    }
                })
                this.closePath();
            }
            
        }
    }
    geom.Geom.prototype.setMarkShape = function(vecArray){
        geom.marks.vecArrayShape = vecArray;        
    }
    var mark = geom.marks.cross;
    geom.Geom.prototype.setMark = function ( name ){
        if(typeof geom.marks[name] === "function"){
            mark = geom.marks[name];
        }
    }
    geom.Vec.prototype.moveTo = function (){
        ctx.moveTo(this.x,this.y);   
        return this;// returns this
        
    };
    geom.Vec.prototype.lineTo = function (){
        ctx.lineTo(this.x,this.y);
        return this;// returns this
    };
    geom.Vec.prototype.mark = function (){
        mark(this);
        return this;// returns this
    };
    geom.Vec.prototype.draw = function (dir){ // The {odir} is a boolean that if true reveres the direction to the draw. Not applicable in this case
        return this;// returns this
    };
    
    geom.Line.prototype.moveTo = function () {
        this.p1.moveTo();
        return this;// returns this
    };
    geom.Line.prototype.lineTo = function () {
        this.p1.lineTo();
        return this;// returns this
    };
    geom.Line.prototype.draw = function (dir) { // The {odir} is a boolean that if true reveres the direction to the draw
        if(dir){
            this.p2.lineTo();
            this.p1.lineTo();            
        }else{
            this.p1.lineTo();
            this.p2.lineTo();
        }
        return this;// returns this
    };
    geom.Line.prototype.mark = function(){
        this.p1.mark();
        this.p2.mark();
        return this;// returns this
    };
    
    geom.VecArray.prototype.moveTo = function(){
        if(this.vecs.length > 0){
            this.vecs[0].moveTo();
        }
        return this;// returns this
    };
    geom.VecArray.prototype.lineTo = function(){
        this.each(function(vec,i){
            vec.lineTo();
        });
        return this;// returns this
    };
    geom.VecArray.prototype.draw = function(){  // The {odir} is a boolean that if true reveres the direction to the draw
        this.each(function(vec){
            vec.lineTo();
        });
        return this; // returns this
    };
    geom.VecArray.prototype.mark = function(){
        this.each(function(vec,i){
            vec.mark();
        });
        return this;// returns this
    };
    
    geom.Circle.prototype.moveTo = function(){
        ctx.moveTo(this.center.x + this.radius, this.center.y);
        return this;// returns this
    }
    geom.Circle.prototype.lineTo = function(){
        ctx.lineTo(this.center.x + this.radius, this.center.y);
        return this;// returns this
    }
    geom.Circle.prototype.draw = function(dir){  // The {odir} is a boolean that if true reveres the direction to the draw
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2, dir);
        return this;// returns this
    }
    geom.Circle.prototype.mark = function(){
        this.center.mark();
        return this;// returns this
    }
    
    geom.Arc.prototype.moveTo = function(){
        if(this.start !== this.end){
            this.startAsVec().moveTo();
        }
        return this;// returns this
    };
    geom.Arc.prototype.lineTo = function(){
        if(this.start !== this.end){
            this.startAsVec().lineTo();
        }
        return this;// returns this
    };
    geom.Arc.prototype.draw = function(dir){// The {odir} is a boolean that if true reveres the direction to the draw
        if(this.start !== this.end){
            ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.start, this.end, dir);
        }
        return this;// returns this
    };
    geom.Arc.prototype.mark = function(){
        if(this.start !== this.end){
            this.endsAsVec().mark();
        }
        return this;// returns this
    };
    
    geom.Rectangle.prototype.moveTo = function(){
        this.top.p1.moveTo();
        return this;// returns this
    };
    geom.Rectangle.prototype.lineTo = function(){
        this.top.p1.lineTo();
        return this;// returns this
    };
    geom.Rectangle.prototype.draw = function(dir){// The {odir} is a boolean that if true reveres the direction to the draw
        this.getCorners().draw(dir);
        return this;// returns this
    };
    geom.Rectangle.prototype.mark = function(){
        this.getCorners().mark();
        return this;// returns this
    };
    
    
    geom.Box.prototype.moveTo = function(){
        ctx.moveTo(this.left, this.top);
        return this;// returns this
    };
    geom.Box.prototype.lineTo = function(){
        ctx.lineTo(this.left, this.top);
        return this;// returns this
    };
    geom.Box.prototype.draw = function(dir ){ // The {odir} is a boolean that if true reveres the direction to the draw
        ctx.rect(this.left, this.top, this.right - this.left, this.bottom - this.top);
        return this;// returns this
    };
    geom.Box.prototype.mark = function(){
        workVec.x = this.left;
        workVec.y = this.top;
        workVect.mark();
        workVec.x = this.right;
        workVect.mark();
        workVec.y = this.bottom;
        workVect.mark();
        workVec.x = this.left;
        workVect.mark();
        return this;// returns this
    };    
    geom.Empty.prototype.moveTo = function(){
        return this;// returns this
    };
    geom.Empty.prototype.lineTo = function(){
        return this;// returns this
    };
    geom.Empty.prototype.draw = function(){
        return this;// returns this
    };
    geom.Empty.prototype.mark = function(){
        return this;// returns this
    };
}
