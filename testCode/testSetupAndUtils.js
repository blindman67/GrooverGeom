// Code for testing.


var setStyle = function(col,col1,width){
    if(col !== undefined && col !== null){
        ctx.fillStyle = col;
    }
    if(col1 !== undefined && col1 !== null){
        ctx.strokeStyle = col1;
    }
    if(width !== undefined && width !== null){
        ctx.lineWidth = width;
    }
}
var beginStyle = function(col,col1,width){
    if(col !== undefined && col !== null){
        ctx.fillStyle = col;
    }
    if(col1 !== undefined && col1 !== null){
        ctx.strokeStyle = col1;
    }
    if(width !== undefined && width !== null){
        ctx.lineWidth = width;
    }
    ctx.beginPath();
}
var beginFontStyle = function(font,size,col,align,alignH){
    if(font !== undefined && font !== null){
        if(size !== undefined && size !== null){
            ctx.font = size + "px "+ font;
        }else{
            var s = ctx.font.split("px ")[0];
            ctx.font = s + "px "+ font;
        }
    }else
    if(size !== undefined && size !== null){
        var s = ctx.font.split("px ")[1];
        ctx.font = suze + "px " + s;
        
    }
    if(align !== undefined && align !== null){
        ctx.textAlign = align;
    }
    if(alignH !== undefined && alignH !== null){
        ctx.textBaseline = alignH;
    }
    if(col !== undefined && col !== null){
        ctx.fillStyle = col;
    }
    ctx.beginPath();
}


var drawPoint = function (v){
    ctx.strokeStyle = "red";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(v.x,v.y,4,0,Math.PI*2)
    ctx.stroke();
    
}
var drawPoint1 = function (v){
    ctx.strokeStyle = "yellow";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(v.x,v.y,4,0,Math.PI*2)
    ctx.stroke();
    
}

if(typeof groover.geom.addRender === "function"){
    groover.geom.addRender();
}
if(typeof groover.geom.addShapes === "function"){
    groover.geom.addShapes();
}




var G = groover.geom;
console.log("Groover Geom test code setup and ready");
