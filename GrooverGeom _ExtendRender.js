function extendGeom_Render(geom){
    var ctx;
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
        ctx.moveTo(this.p.x + this.r, this.p.y);
    }
    geom.Circle.prototype.lineTo = function(){
        ctx.lineTo(this.p.x + this.r, this.p.y);
    }
    geom.Circle.prototype.draw = function(){
        ctx.arc(this.p.x, this.p.y, this.r, 0, Math.PI * 2);
    }
    geom.Circle.prototype.mark = function(){
        this.p.mark();
    }
    
    geom.Arc.prototype.moveTo = function(){
        if(this.s !== this.e){
            this.startAsVec().moveTo();
        }
    };
    geom.Arc.prototype.lineTo = function(){
        if(this.s !== this.e){
            this.startAsVec().lineTo();
        }
    };
    geom.Arc.prototype.draw = function(){
        if(this.s !== this.e){
            ctx.arc(this.c.p.x, this.c.p.y, this.c.r, this.s, this.e);
        }
    };
    geom.Arc.prototype.mark = function(){
        if(this.s !== this.e){
            this.endsAsVec().mark();
        }
    };
    
    geom.Rectangle.prototype.moveTo = function(){
        this.t.p1.moveTo();
    };
    geom.Rectangle.prototype.lineTo = function(){
        this.t.p1.lineTo();
    };
    geom.Rectangle.prototype.draw = function(){
        this.getCorners().draw();
    };
    geom.Rectangle.prototype.mark = function(){
        this.getCorners().mark();
    };
}
