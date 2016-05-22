"use strict";
var tools = (function(){
    var exposed = {};
    var canvas,ctx,w,h;
    var mouse;
    var mouseOverIcon;
    var mouseDownOn;
    var pos = 0;
    var spritePos = 0;
    var update;
    var currentId = -1;
    exposed.action = null;
    exposed.changed = true; 
    exposed.redraw = true;
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
        names : [],
    }
    exposed.addIcon = function(name,setting){
        var tool;
        if(name === undefined){
            throw new ReferanceError("Tools.addIcon Required argument name missing");
        }
        if(name === "names"){
            throw new RangeError("Tools.addIcon Invalid argument name. Can not add a icon named 'names'");
        }
        if(setting !== undefined){
            if(setting.dataName !== undefined && setting.dataSource === undefined){
                throw new ReferanceError("Tools.addIcon Argument setting.dataName is missing required setting.dataSource argument");
            }
        }
        tool = tools[name];
        if(tool === undefined){
            tool = tools[name] = {
                name : name,
            };
            tools.names.push(name);
        }
        tool.id = mouse.getInterfaceId();
        tool.help = setting.help === undefined ? "" : setting.help;
        tool.cursor = setting.cursor === undefined ? "pointer" : setting.cursor;
        tool.position = setting.position === undefined ? pos ++ : setting.position;        
        tool.spritePos = setting.spritePos === undefined ? spritePos ++ : setting.spritePos;
        tool.dataSource = setting.dataSource;
        tool.dataName = setting.dataName;
        tool.onClick = setting.onClick;
        if(setting.type === undefined){
            if(tool.dataSource !== undefined && tool.dataName !== undefined){
                tool.type = typeof tool.dataSource[tool.dataName];
            }else{
                tool.type = undefined;
            }
        }else{
            tool.type = setting.type
            
        }
    }
    exposed.update = update = function(){
        var i,len,y,img,sy,tool,my,showBright;
        if(ready && (mouse.over || exposed.redraw) ){
            ctx.clearRect(0,0,w,h);
            len = tools.names.length;
            my = mouse.y;
            mouseOverIcon = undefined;
            
            for(i = 0; i < len; i ++){
                tool = tools[tools.names[i]];
                y = tool.position * w;
                showBright = false;
                img = undefined;
                if(tool.status === undefined){
                    if(tool.dataName !== undefined){
                        if(tool.type === "boolean"){
                            img = tool.dataSource[tool.dataName] ? images.toolsHighlight : images.tools;
                        }
                    }else{
                        img = images.tools;
                    }
                }else{
                    img = images.tools;
                }

                    

                if(mouse.y >= y && mouse.y <= y + w && mouse.over){
                    if(currentId !== tool.id){
                        canvas.title = tool.help;

                    }
                    currentId = tool.id;
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
               if(mouseDownOn.dataName !== undefined){
                    if(mouseDownOn.type === "boolean"){
                        mouseDownOn.dataSource[mouseDownOn.dataName] = !mouseDownOn.dataSource[mouseDownOn.dataName];
                        exposed.changed = true;
                    }
                }
                if(mouseDownOn.onClick !== undefined){
                    mouseDownOn.onClick();
                    exposed.changed = true;
                }
                
                exposed.action = mouseDownOn;
            }
            mouseDownOn.aplha = TOOL_ALPHAS.low;
            redraw();
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