function extendGeom_Render(geom){
    var ctx;
    var workVec = new geom.Vec();
    geom.Geom.prototype.ctx = undefined;
    geom.Geom.prototype.setCtx = function(ctx1){
        this.ctx = ctx1;
        ctx = ctx1;        
    };
    var size = 1;
    geom.Geom.prototype.setSize = function(newSize){
        size = newSize;
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
    };
    geom.Vec.prototype.lineTo = function (){
        ctx.lineTo(this.x,this.y);
    };
    geom.Vec.prototype.mark = function (){
        mark(this);
    };
    geom.Vec.prototype.draw = function (){
    };
    
    geom.Line.prototype.moveTo = function () {
        this.p1.moveTo();
    };
    geom.Line.prototype.lineTo = function () {
        this.p1.lineTo();
        this.p2.lineTo();
    };
    geom.Line.prototype.draw = function () {
        this.p1.moveTo();
        this.p2.lineTo();
    };
    geom.Line.prototype.mark = function(){
        this.p1.mark();
        this.p2.mark();
    };
    
    geom.VecArray.prototype.moveTo = function(){
        if(this.vecs.length > 0){
            this.vecs[0].moveTo();
        }
    };
    geom.VecArray.prototype.lineTo = function(){
        this.each(function(vec,i){
            vec.lineTo();
        });
    };
    geom.VecArray.prototype.draw = function(){
        this.each(function(vec,i){
            if(i === 0){
                vec.moveTo();
            }else{
                vec.lineTo();
            }
        });
    };
    geom.VecArray.prototype.mark = function(){
        this.each(function(vec,i){
            vec.mark();
        });
    };
    
    geom.Circle.prototype.moveTo = function(){
        ctx.moveTo(this.center.x + this.radius, this.center.y);
    }
    geom.Circle.prototype.lineTo = function(){
        ctx.lineTo(this.center.x + this.radius, this.center.y);
    }
    geom.Circle.prototype.draw = function(){
        ctx.arc(this.center.x, this.center.y, this.radius, 0, Math.PI * 2);
    }
    geom.Circle.prototype.mark = function(){
        this.center.mark();
    }
    
    geom.Arc.prototype.moveTo = function(){
        if(this.start !== this.end){
            this.startAsVec().moveTo();
        }
    };
    geom.Arc.prototype.lineTo = function(){
        if(this.start !== this.end){
            this.startAsVec().lineTo();
        }
    };
    geom.Arc.prototype.draw = function(){
        if(this.start !== this.end){
            ctx.arc(this.circle.center.x, this.circle.center.y, this.circle.radius, this.start, this.end);
        }
    };
    geom.Arc.prototype.mark = function(){
        if(this.start !== this.end){
            this.endsAsVec().mark();
        }
    };
    
    geom.Rectangle.prototype.moveTo = function(){
        this.top.p1.moveTo();
    };
    geom.Rectangle.prototype.lineTo = function(){
        this.top.p1.lineTo();
    };
    geom.Rectangle.prototype.draw = function(){
        this.getCorners().draw();
    };
    geom.Rectangle.prototype.mark = function(){
        this.getCorners().mark();
    };
    
    
    geom.Box.prototype.moveTo = function(){
        ctx.moveTo(this.left, this.top);
    };
    geom.Box.prototype.lineTo = function(){
        ctx.lineTo(this.left, this.top);
    };
    geom.Box.prototype.draw = function(){
        ctx.rect(this.left, this.top, this.right - this.left, this.bottom - this.top);
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
    };    
}
