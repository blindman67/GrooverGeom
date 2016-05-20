"use strict";

var GG = groover.geom; // shortcut to groover.geom
/** GEOMShortcuts.js begin **/
// short cuts to create groover.geom primitives.
var DP = GG.dragPoints;
var C = function(p1, r){ return new GG.Circle(p1,r);};
var L = function(p1, p2){ return new GG.Line(p1,p2);};
var V = function(x, y){ return new GG.Vec(x,y);};
var A = function(c, s, e){ return new GG.Arc(c,s,e);};
var B = function(p1, p2, cp1, cp2){ return new GG.Bezier(p1,p2,cp1,cp2);};
var T = function(p1, p2, p3){ return new GG.Triangle(p1,p2,p3);};
var Tf = function(ax, ay, o){ return new GG.Transform(ax,ay,o);};
var R = function(l, a){ return new GG.Rectangle(l,a);};
var VA = function(a){ return new GG.VecArray(a);};
var PA = function(a){ return new GG.PrimitiveArray(a);};
/** GEOMShortcuts.js end **/
var mouse;
var geometry = {
    all : undefined,
    selected : undefined,
    unselected : undefined,
};



var demo = (function(){
    var exposed = {}
    var settings = {
        grid : false,
        crosshairs : true,
        gridSnap : false,
        gridSize : 8,
        showVertIndex : true,
        displayMatrix : undefined,
        displayInvMatrix : undefined,

        
    };
    settings.images = (function(){
        var i,len;
        var arr = [];
        arr[arr.length ++ ] = imageTools.loadImage("icons/checker.png");
        arr[arr.length ++ ] = imageTools.loadImage("icons/checker1.png");
        arr[arr.length ++ ] = imageTools.loadImage("icons/checker2.png");
        var cols = [];
        for(i = 0; i < 16; i ++){
            cols.push("hsl("+Math.floor((i/16)*360).toFixed(0)+",100%,50%)");
        }
        arr[arr.length ++ ] = imageTools.createGradImage(16,16,cols);
        settings.colouredLines = arr[arr.length -1];
        return arr;
    })();
    var displayS = {
        displayMatrix : undefined,
        displayInvMatrix : undefined,
        topLeft : undefined,
        topRight : undefined,
        bottomRight : undefined,
        bottomLeft : undefined,
        origin : undefined,
        update : function(){
            this.displayMatrix.asInverseTransform(this.displayInvMatrix);
            this.displayInvMatrix.applyToCoordinate(0, 0, this.topLeft);
            this.displayInvMatrix.applyToCoordinate(canvas.width, 0, this.topRight);
            this.displayInvMatrix.applyToCoordinate(canvas.width, canvas.height, this.bottomRight);
            this.displayInvMatrix.applyToCoordinate(0, canvas.height, this.bottomLeft);
        },
        home : function(){
            this.displayMatrix.reset();
            this.update();
        }
    }
    exposed.settings = settings;
    var updatePending = false;
    var updateUI;   
    var newPoint = undefined;
    var globalTime = 0;
    exposed.globalTime = 0;
    var startTime = 0;
    var closestPrim;
    var oldMouse = {
        x : 0,
        y : 0,
        bRaw : 0,
    }       
    
    function resize(){
        tools.start();
    }
    exposed.start = function demoStartup(toolsCanvas){
        tools.start(toolsCanvas);
        tools.addIcon("crosshairs",{dataSource : settings, dataName : "crosshairs", spritePos : 0});
        tools.addIcon("grid",{dataSource : settings, dataName : "grid", spritePos : 2});
        tools.addIcon("gridSnap",{dataSource : settings, dataName : "gridSnap", spritePos : 1});
        tools.addIcon("displayHome",{onClick : displayS.home.bind(displayS), spritePos : 4});
        tools.addIcon("showVertIndex",{dataSource : settings, dataName : "showVertIndex", spritePos : 3});
        if (typeof GG.addRender === "function") {
            GG.addRender(); // add render extension if it exists
            GG.setCtx(ctx);
        }
        if (typeof GG.addShapes === "function") {
            GG.addShapes(); // add shape extension if it exists
        }
        if (typeof GG.addUI === "function") {
            GG.addUI(canvas); // add UI extension if it exists
            mouse = GG.UIMouse;
            GG.ui.onUnusedRightButton = uiOnUnusedRightButton;
            GG.ui.onSelectChanged = uiOnSelectionChanged;
            GG.ui.setDragMode("quickDrag");
        }
        if (typeof GG.addConstructors === "function") {
            GG.addConstructors(); // add UI extension if it exists
        }
        geometry.all = PA(); // new primitiveArray
        geometry.selected = PA(); // new primitiveArray
        geometry.unselected = PA(); // new primitiveArray
        creationMenu.start(GG, geometry);
        displayS.displayMatrix = new GG.Transform();
        displayS.displayInvMatrix = displayS.displayMatrix.copy().invert();
        displayS.topLeft = V(0,0);
        displayS.topRight = V(0,0);
        displayS.bottomRight = V(0,0);
        displayS.bottomLeft = V(0,0);
        mouse.realPos = V(0,0);
        displayS.home();
        GG.ui.setInvTransform(displayS.displayInvMatrix);
        exposed.start = resize;
    }    
    /* groover.geom ui event handlers begin*/
    var uiOnUnusedRightButton = function(ui,info){// this event is trigger by a un used right click
        var i = info.info;
        if(newPoint === undefined){
            GG.ui.addPoint(newPoint = V(i.mouseX,i.mouseY))
        }else
        if(i.type ==="drag"){
            newPoint.setAs(i.mouseX,i.mouseY);
        }else{
           newPoint.setAs(i.mouseX,i.mouseY); 
           newPoint = undefined
        }
        GG.ui.selectionChanged()   
    }
    var uiOnSelectionChanged = function(ui, info){// this event is trigger when there is a selection change
        // get all geometry that has a Vec selected
        
        var uiSelectedVecs = ui.selected.getAllIdsAsArray();
        geometry.selected = geometry.all.collectIdsAsPrimitiveArray(uiSelectedVecs, geometry.selected.reset());
        geometry.unselected.reset();
        geometry.all.each(function(prim){
            if(!geometry.selected.isIdInArray(prim.id,undefined,true)){
                geometry.unselected.push(prim);
            }
        }); 
        setTimeout(creationMenu.displayPrimitives,0);
    }
    exposed.updateUI = updateUI = function(){
        if(!updatePending){
            updatePending = true;        
            setTimeout(function(){
                updatePending = false;
                GG.ui.selectionChanged(true);   
                updateCanvas = true;
            },0);
        }
    }
    /* groover.geom ui event handlers end*/
    var beginStyle = function(fillStyle, strokeStyle, lineWidth) {// Sets the canvas to start an new path
        if(fillStyle !== undefined && fillStyle !== null) { ctx.fillStyle = fillStyle;}
        if(strokeStyle !== undefined && strokeStyle !== null) { ctx.strokeStyle = strokeStyle;}
        if(lineWidth !== undefined && lineWidth !== null) { ctx.lineWidth = lineWidth;}
        ctx.beginPath();
    }      
    var beginFontStyle = function(font, size, fillStyle, align, alignH){// sets the canvas to render a font size is font size.
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
        if(align !== undefined && align !== null){ ctx.textAlign = align;}
        if(alignH !== undefined && alignH !== null){ ctx.textBaseline = alignH;}
        if(fillStyle !== undefined && fillStyle !== null){ ctx.fillStyle = fillStyle;}
        ctx.beginPath();
    }
    function setStyle(style){
        if(style.mark !== undefined){ GG.setMark(style.mark); }
        if(style.markSize !== undefined){GG.setMarkSize(style.markSize);}
        beginStyle(style.fill,style.colour,style.lineWidth);    
    }
    var drawGeomUI = function(){// draws the Geom UI parts
        GG.setMark("circle");
        GG.setMarkSize(6)
        setStyle(GEOM_UI_STYLES.nearMouse);
        GG.ui.drawPoints("nearmouse");
        ctx.fill();
        ctx.stroke();
        setStyle(GEOM_UI_STYLES.unselected);
        GG.ui.drawPoints("unselected");
        ctx.stroke();
        setStyle(GEOM_UI_STYLES.selected);
        GG.ui.drawPoints("selected");
        ctx.stroke();
        if(GG.ui.bounds.active){
            if(GG.ui.pointerOverBounds){
                setStyle(GEOM_UI_STYLES.bounds.highlight);
            }else{
                setStyle(GEOM_UI_STYLES.bounds.normal);
            }
            if(GG.ui.bounds.controls){
                GG.ui.bounds.lines.moveTo().draw(); // 
                GG.ui.bounds.rotationLine.moveTo().draw();
                GG.setMarkSize(GG.ui.pointerDistLimit)
                GG.ui.bounds.points.mark();
            }else{
                GG.ui.bounds.box.moveTo().draw(); // 
            }
            ctx.stroke();
            if(GG.ui.bounds.pointerOverPointIndex > -1){
                beginStyle(GEOM_UI_STYLES.bounds.highlight);
                GG.ui.bounds.points.vecs[GG.ui.bounds.pointerOverPointIndex].mark();
                ctx.stroke();
            }

        }
        if(GG.ui.dragSelecting){
            setStyle(GEOM_UI_STYLES.selectingBox);
            GG.ui.selectionBox.moveTo().draw(); // expand by 7
            ctx.fill();
            ctx.stroke();
        }
        if(settings.showVertIndex){
            beginFontStyle(FONT, GEOM_UI_STYLES.lables.fontSize, GEOM_UI_STYLES.lables.fill, "left", "hanging");
            GG.ui.drawPoints("selected", "lable");
        }
     }
    function mark(array, col, size, width, shape) {
        if (array !== undefined) {
            if (size !== undefined) {
                GG.setMarkSize(size);
            }
            if (shape !== undefined) {
                GG.setMark(shape);
            }
            beginStyle(undefined, col, width)
            if (array.type === "PrimitiveArray" || array.type === "VecArray") {
                array.each(function (p) {
                    p.moveTo().draw();
                });
            } else {
                for (var i = 0; i < array.length; i++) {
                    if (GG.isPrimitive(array[i])) {
                        array[i].mark();
                    }
                }
            }
            ctx.stroke();
        }
    }
    function draw(array, col, width) {
        if (array !== undefined) {
            if (width === 0) {
                beginStyle(col, undefined)
                if (array.type === "PrimitiveArray" || array.type === "VecArray") {
                    array.each(function (p) {
                        p.moveTo().draw();
                    });
                } else {
                    for (var i = 0; i < array.length; i++) {
                        if (GG.isPrimitive(array[i])) {
                            array[i].draw();
                        }
                    }
                }
                ctx.fill();
                return;
            }
            beginStyle(undefined, col, width)
            if (array.type === "PrimitiveArray" || array.type === "VecArray") {
                array.each(function (p) {
                    p.moveTo().draw();
                });
            } else {
                for (var i = 0; i < array.length; i++) {
                    if (GG.isPrimitive(array[i])) {
                        array[i].moveTo().draw();
                    }
                }
            }
            ctx.stroke();
        }
    }
    function showGrid(){
        var x,y;
        if(settings.grid){
            var disScale, scaleStep, maxSteps, scale, img, imgW, size, sx, sy, ex, ey, ssx, ssy, c, lineScale, invScale;
            disScale = displayS.displayMatrix.decomposeScale();
            invScale = 1/ disScale;
            scaleStep = 8;
            maxSteps = 14;
            lineScale = 8;
            scale = 1;
            ex = displayS.bottomRight.x;
            ey = displayS.bottomRight.y;            
            imageTools.setSmoothing(false);
            ctx.globalAlpha = 0.5;            
            img = settings.images[0];
            imgW = img.width;
            c = 0;
            for(var i = 0; i < maxSteps; i++){            
                size = img.width  * scale;
                if(size * disScale >=  128){
                    
                    console.log(size);
                    sx = Math.floor(displayS.topLeft.x / size) * size
                    sy = Math.floor(displayS.topLeft.y / size) * size
                    for(y = sy; y < ey; y += size){
                        for(x = sx; x < ex; x += size){
                            ctx.drawImage(img,x,y,size,size);
                        }
                    }
                    c += 1;
                    if(c === 2){
                        lineScale = scale / 4;
                    }
                    if(c > 2){
                        break;
                    }
                }
                scale *= 8;
            }
            /*img = settings.images[1];
            size *= 8;
            sx = Math.floor(displayS.topLeft.x / size) * size
            sy = Math.floor(displayS.topLeft.y / size) * size
            for(y = sy; y < ey; y += size){
                for(x = sx; x < ex; x += size){
                    ctx.drawImage(img,x,y,size,size);
                }
            }*/
            scale = lineScale;
            
            ctx.globalAlpha = 0.5;
            size = settings.images[0].width  * scale;           
            ssx = displayS.topLeft.x;
            ssy = displayS.topLeft.y;
            sx = Math.floor(displayS.topLeft.x / size) * size;
            sy = Math.floor(displayS.topLeft.y / size) * size;
            c = 4;
            for(y = sy; y < ey; y += size){
                if(y === 0){
                    ctx.drawImage(settings.colouredLines, 0, 0, 1, 16, sx, y, ex - sx, invScale);
                }else{
                    ctx.drawImage(settings.colouredLines, c, 0, 1, 16, sx, y, ex - sx, invScale);
                }
            }
            for(x = sx; x < ex; x += size){
                if(x === 0){
                    ctx.drawImage(settings.colouredLines, 0, 0, 1, 16, x, sy, invScale, ey - sy);
                }else{
                    ctx.drawImage(settings.colouredLines, c, 0, 1, 16, x, sy, invScale, ey - sy);
                }
            }
            ctx.globalAlpha = 1;
            beginFontStyle(FONT, CROSSHAIR.fontSize * invScale, CROSSHAIR.colour, "left", "bottom");
            for(y = sy; y < ey; y += size){
                ctx.fillText(y.toFixed(1) + "px", ssx, y - 2 * invScale);
            }
            for(x = sx; x < ex; x += size){
                ctx.fillText(x.toFixed(1) + "px", x + 2 * invScale,  ssy+(CROSSHAIR.fontSize + 2) * invScale);            
            }
            
            imageTools.setSmoothing(true);
        }
    }     
    function showCrosshairs(x, y) {
        if(settings.crosshairs){
            beginStyle(null, CROSSHAIR.colour, 1);
            ctx.moveTo(displayS.topLeft.x, y);
            ctx.lineTo(displayS.topRight.x, y);
            ctx.moveTo(x, displayS.topLeft.y);
            ctx.lineTo(x, displayS.bottomLeft.y);
            ctx.stroke();
            beginFontStyle(FONT, CROSSHAIR.fontSize, CROSSHAIR.colour, "left", "bottom");
            ctx.fillText(y.toFixed(1) + "px", displayS.topLeft.x, y - 2);
            ctx.fillText(x.toFixed(1) + "px", x + 2,  displayS.topLeft.y+CROSSHAIR.fontSize + 2);
        }
    }   
    function doTransforms(){
        if(mouse.buttonRaw & 2){
            var mx = mouse.x - oldMouse.x;
            var my = mouse.y - oldMouse.y;
            displayS.displayMatrix.translate(mx,my);
            displayS.update();

        }
        if(mouse.w !== 0){
            if(displayS.origin === undefined){
                displayS.origin = V();
            }
            displayS.origin.setAs(mouse);//.sub(displayS.topLeft);
            if(mouse.w < 0){
                displayS.displayMatrix.scaleAtPoint(1/1.1 ,displayS.origin);
                mouse.w = Math.min(0,mouse.w + 120);
            }else{
                displayS.displayMatrix.scaleAtPoint(1.1,displayS.origin);
                mouse.w = Math.max(0,mouse.w - 120);
            }
                
            displayS.update();
        }
            
        mouse.realPos = displayS.displayInvMatrix.applyToCoordinate(mouse.x,mouse.y,mouse.realPos);

    }
 
    function display(){
        doTransforms();
        displayS.displayMatrix.setContextTransform(ctx);
        GG.ui.updatePointer();
        geometry.selected.callConstructors();
        geometry.unselected.callConstructors();
        showGrid();

        draw(geometry.unselected,GEOM_UI_STYLES.geometry.normal.colour,GEOM_UI_STYLES.geometry.normal.lineWidth);
        draw(geometry.selected,GEOM_UI_STYLES.geometry.highlight.colour,GEOM_UI_STYLES.geometry.highlight.lineWidth);
        if(closestPrim !== undefined){
            primitiveHighlight(closestPrim.type,closestPrim.id,"nearlight",true); // turn off
        };
        draw([closestPrim = geometry.all.getClosestPrimitiveToVec(V(mouse.x,mouse.y))],"Yellow",2);
         if(closestPrim !== undefined){
            primitiveHighlight(closestPrim.type,closestPrim.id,"nearlight"); // turn on
         }
        drawGeomUI();
        if(mouse.over){
            showCrosshairs(mouse.realPos.x,mouse.realPos.y);
        }
    }
     // main update function
    function update(timer){
        exposed.globalTime = globalTime = timer - startTime;
        tools.update();
        if(tools.changed){
            updateCanvas = true;
            tools.changed = false;
        }
        if(updateCanvas || oldMouse.x !== mouse.x || oldMouse.y !== mouse.y ||  oldMouse.w !== mouse.w || mouse.buttonRaw !== 0 || mouse.buttonRaw !== oldMouse.bRaw){
            if(settings.gridSnap){
                mouse.x = Math.round(mouse.x/settings.gridSize)*settings.gridSize;
                mouse.y = Math.round(mouse.y/settings.gridSize)*settings.gridSize;
            }
            imageTools.setCtx(ctx);
            ctx.setTransform(1,0,0,1,0,0);
            ctx.globalAlpha = 1;
            ctx.clearRect(0,0,canWidth,canHeight);
            display();
        }

        updateCanvas = false;
        oldMouse.x = mouse.x;
        oldMouse.y = mouse.y;
        oldMouse.w = mouse.w;
        oldMouse.bRaw = mouse.buttonRaw;
        requestAnimationFrame(update);

    }
    function startUpdate(timer){
        startTime = timer;
        requestAnimationFrame(update);
    }
    requestAnimationFrame(startUpdate);
    return exposed;
})();