"use strict";
var tools = (function(){
    var exposed = {};
    var canvas,ctx,w,h;
    var mouse;
    var mouseOverIcon;
    var mouseDownOn;

    exposed.action = null;
    var ready = exposed.ready = false;
    var images = {
        count : 0,
        tools : "icons/tools.png",
        toolsHighlight : "icons/toolsHighlight.png",
    };
    function imageLoaded(image){
        images.count += 1;
        console.log("image loaded");
        if(images.count === 2){
            ready = exposed.ready = true;
            console.log("Tools menu ready");
        }
    }
    images.tools = imageTools.loadImage(images.tools,imageLoaded);
    images.toolsHighlight = imageTools.loadImage(images.toolsHighlight,imageLoaded);
    var icons = {};
    const TOOL_STATUS = {
        off : 0,
        on : 1,
    };
    const TOOL_ALPHAS = {
        low : 0.2,
        high : 1,
    };
    var tools = {
        names : "grid,crosshairs,gridSnap".split(","),
        grid : {
            position : 0,
            offImage : images.tools,
            onImage : images.toolsHighlight,
            status : TOOL_STATUS.on,
            spritePos : 0,
            cursor : "pointer",
            name : "grid",
            alpha : TOOL_ALPHAS.low,
        },
        crosshairs : {
            position : 1,
            offImage : images.tools,
            onImage : images.toolsHighlight,
            status : TOOL_STATUS.on,
            spritePos : 1,
            cursor : "pointer",
            name : "crosshairs",
            alpha : TOOL_ALPHAS.low,
        },
        gridSnap : {
            position : 2,
            offImage : images.tools,
            onImage : images.toolsHighlight,
            status : TOOL_STATUS.on,
            spritePos : 2,
            cursor : "pointer",
            name : "gridsnap",
            alpha : TOOL_ALPHAS.low,
            
        },
    }
    var update;
    exposed.update = update = function(){
        var i,len,y,img,sy,tool,my,showBright;
        if(ready){
            ctx.clearRect(0,0,w,h);
            len = tools.names.length;
            my = mouse.y;
            mouseOverIcon = undefined;
            
            for(i = 0; i < len; i ++){
                tool = tools[tools.names[i]];
                y = tool.position * w;
                showBright = false;
                if(tool.status === TOOL_STATUS.on){
                    img = tool.onImage;
                }else
                if(tool.status === TOOL_STATUS.off){
                    img = tool.offImage;
                }else{
                    img = undefined;
                }
                if(mouse.y >= y && mouse.y <= y + w && mouse.over){
                    mouseOverIcon = tool;
                    showBright = true;
                    if(mouseDownOn !== undefined && mouseDownOn.position !== tool.position){
                        tool.alpha = TOOL_ALPHAS.low;
                    }
                }
                if(img !== undefined){
                    sy = tool.spritePos * img.width;
                    ctx.drawImage(img,0,sy,img.width,img.width,0,y,w,w);
                    if(showBright){
                        ctx.globalCompositeOperation = "lighter"; 		
                        ctx.globalAlpha = tool.alpha;
                        ctx.drawImage(img,0,sy,img.width,img.width,0,y,w,w);
                        ctx.globalAlpha = 1;
                        ctx.globalCompositeOperation = "source-over";
                    }
                }
            }
        }
        if(mouseOverIcon !== undefined){
            mouse.requestCursor(mouseOverIcon.cursor);
            if((mouse.buttonRaw & 1) && mouseDownOn === undefined){
                mouseDownOn = mouseOverIcon;
                mouseDownOn.alpha = TOOL_ALPHAS.high;
            }

        }else{
            mouse.releaseCursor();
        }
        if(!(mouse.buttonRaw & 1) && mouseDownOn !== undefined){
            if(mouseOverIcon !== undefined && mouseDownOn.position === mouseOverIcon.position){
                exposed.action = mouseDownOn;
            }
            mouseDownOn.aplha = TOOL_ALPHAS.low;
            mouseDownOn = undefined;
        }
    }
    var resize = function(){
        ctx = canvas.getContext("2d");        
        w = canvas.width;
        h = canvas.height;        
    }
    exposed.start = function(canvas1){
        canvas = canvas1;
        mouse = mouseInterface().start(canvas);
        exposed.start = resize;
        exposed.start();
    }
    var redraw = function(){}

    return exposed;
})();