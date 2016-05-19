"use strict";
/** ImageTools.js begin **/
var imageTools = (function () {
    var lastDataRequest = undefined;
    var lastDataUID = undefined;
    var UID = 0; // for generating unquie image IDs
    var ctx;
    var tools = {
        purge : function(){
            lastDataRequest = undefined;
            lastDataUID = undefined;
        },
        getUID : function(){
            UID += 1;
            return UID - 1;
        },
        setCtx :function(context){
            ctx = context;            
        },
        canvas : function (width, height) {  // create a blank image (canvas)
            var c = document.createElement("canvas");
            c.width = width;
            c.height = height;
            return c;
        },
        canvasAndContext : function (width, height) {  // create a blank image (canvas)
            var c = document.createElement("canvas");
            c.width = width;
            c.height = height;
            c.ctx = c.getContext("2d");
            return c;
        },
        imageWithText : function(text,font,height,fillStyle,strokeStyle,lineWidth){
            var c = this.canvas(2, 2);
            c.ctx = c.getContext("2d");
            c.ctx.font = font;
            var width = c.ctx.measureText(text).width;
            if(strokeStyle === undefined){
                lineWidth = 0;
            }
            var c = this.canvas(width + lineWidth * 2, height + lineWidth * 2);
            c.ctx = c.getContext("2d");
            c.ctx.font = font;
            c.ctx.textAlign = "center";
            c.ctx.textBaseline = "middle";
            c.ctx.lineJoin = "round";
            if(strokeStyle !== undefined){
                c.ctx.lineWidth = lineWidth;
                c.ctx.strokeStyle = strokeStyle;
                c.ctx.strokeText(text,(width + lineWidth * 2)/2,(height + lineWidth * 2)/2);
            }
            c.ctx.fillStyle = fillStyle;
            c.ctx.fillText(text,(width + lineWidth * 2)/2,(height + lineWidth * 2)/2);
            c.UID = this.getUID();
            return c;
        },
        image2Canvas : function (img) {
            var image = this.canvas(img.width, img.height);
            image.ctx = image.getContext("2d");
            image.ctx.drawImage(img, 0, 0);
            if(img.UID !== undefined){
                image.UID = img.UID;
            }
            return image;
        },
        copyImage : function( image ){
            return this.image2Canvas(image);
        },
        makeImageDrawable : function(image){
            return this.image2Canvas(image);
        },        
        imageData : function (image) {
            if(image.UID !== undefined){
                if(image.UID === lastDataUID){
                    return lastDataRequest
                }
            }else{
                image.UID = this.getUID;
            }
            lastDataUID = image.UID;
            if(image.ctx !== undefined){
                return lastDataRequest = image.ctx.getImageData(0, 0, image.width, image.height).data;
            }
            return lastDataRequest = this.image2Canvas(image).ctx.getImageData(0, 0, image.width, image.height).data;
        }, 
        imageDataFull : function (image,x,y,w,h) {
            var id;
            if(image.ctx !== undefined){
                id = image.ctx.getImageData(x, y, w, h);
            }else{
                id = this.image2Canvas(image).ctx.getImageData(x, y, w, h);
            }
            id.x = x;
            id.y = y;
            return id;
        }, 
        setImageData : function (image,imageData,x,y){
            if(image.ctx !== undefined){
                if(x === undefined){
                    if(imageData.x !== undefined && imageData.y !== undefined){
                        image.ctx.putImageData(imageData,imageData.x,imageData.y);
                    }else{
                        image.ctx.putImageData(imageData,0,0);
                    }
                }else{
                    image.ctx.putImageData(imageData,x,y);
                }
            }
        },
        trimImage :function (image){
            // small m for min and big M for max
            var mx,my,Mx,My,x,y,ind; 
            var d = this.imageData(image);
            Mx = -(mx = Infinity);
            my = undefined;
            ind = 3;
            for(var y = 0; y < image.height; y ++){
                for(var x = 0; x < image.width; x ++){
                    if(d[ind] > 0){
                        if(my === undefined){
                            my = y;
                        }
                        My = y;
                        mx = Math.min(mx,x);
                        Mx = Math.max(Mx,x);
                    }
                    ind += 4;
                }
            }
            if(My-my <= 0 || Mx-mx <= 0){
                return undefined;
            }
            var c = this.canvas(Mx-mx,My-my);
            c.ctx = c.getContext("2d");
            c.ctx.drawImage(image,-mx,-my);
            c.UID = this.getUID();
            return c;
        },
        setSmoothing : function(val){
            ctx.imageSmoothingEnabled = val;    
            ctx.mozImageSmoothingEnabled = val;
        },
        loadImage : function(url,ready){
            function onload(event){
                this.removeEventListener("load",onload); // remove events
                this.removeEventListener("error",onload);
                if(event.type === "error"){ 
                    if(ready !== undefined){
                        ready(undefined); 
                    }
                    return;
                }
                imageTools.loadedImage = this;
                image = tools.image2Canvas(this);
                if(ready !== undefined){
                    ready(image);
                }
            }
            var image = new Image();
            image.src = url;
            image.addEventListener("load",onload);
            image.addEventListener("error",onload);
            image.UID = this.getUID();

            return image;
        },  
    }
    return tools;
})();
/** ImageTools.js end **/