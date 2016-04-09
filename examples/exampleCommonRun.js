"use strict";

if (typeof groover.geom.addRender === "function") {
    groover.geom.addRender(); // add render extention if it exists
}
if (typeof groover.geom.addShapes === "function") {
    groover.geom.addShapes(); // add shape extention if it exists
}

var GG = groover.geom; // shortcut to groover.geom
var background = undefined;
var canvas, ctx, w, h;

// for dragging points.
var mouseV = new GG.Vec(); // create a point for the mouse
var dragOffset = new GG.Vec();  // distance from mouse to point
var dragPoints = new GG.VecArray(); // create a vec array to hold draggable points.
var closePointIndex = undefined;  // index of cloest drag point
var currentDragPoint = undefined; // index of current dragging point
const SELECT_DIST = 10; // distance from point to be selected
var mouseInfoEl = $("#mouseCoords");
var mouseNearEl = $("#mouseNear");
var useDragPoints = false;
var markerTypeList;
var currentMarkType = "circle";


function update(time) {
    var i;
    // put in the request for next frame
    requestAnimationFrame(update);
    // set the mouse Vec to the mouse position.
    mouseV.setAs(mouse.x, mouse.y);

    // clean transform
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    // clear the canvas
    ctx.drawImage(background, 0, 0);

    if(useDragPoints){
        // display all drag points
        beginStyle("blue","black",3)
        GG.setMarkSize(8 + Math.sin(time/100)* 2);      // set the current point size
        dragPoints.mark();     // mark all the points in dragPoints
        ctx.stroke();          // render them
        beginStyle("blue","Red",2)
        dragPoints.mark();     // mark all the points in dragPoints
        ctx.stroke();          // render them        
    }        
    if (typeof exampleUpdate === "function") {
        exampleUpdate(time);
    }    
    ctx.setTransform(1,0,0,1,0,0);
    if(useDragPoints){
        // highlite the drag point
        if(closePointIndex > -1 || currentDragPoint !== undefined ){
            beginStyle("white","Red",2)
            GG.setMarkSize(10);      // set the current point size
            dragPoints.vecs[currentDragPoint !== undefined ? currentDragPoint : closePointIndex].mark();     // mark the points in dragPoints
            ctx.stroke();          // render them
            ctx.fill();          // render them
        
        }
        beginFontStyle("arial",16,"black","center","middle");
        dragPoints.lable();      
    }
    // display the mouse vector
    beginStyle("blue","Red",1)
    GG.setMark(currentMarkType);
    GG.setMarkSize(4);
    mouseV.mark();
    ctx.stroke();
}
function start() {
    var v,
    r;
    canvas = document.getElementById("mainCanvas");
    ctx = canvas.getContext("2d");
    w = canvas.width;
    h = canvas.height;
    if (typeof GG.setCtx === "function") {
        GG.setCtx(ctx);
    }
    mouse.startMouse(canvas);
    background = createImage(w, h);
    drawGrid(background, 4, 20, "#aaa", "#000");
    if (typeof exampleStart === "function") {
        exampleStart();
    }

    update();

}

var markNameSet = function(event){  // handle drag point display type click
    currentMarkType = this.value;
}

function setupDragPoints(){
    markerTypeList = addRadioGroup(GG.markNames,"#markerTypes",null,"circle",markNameSet);
    useDragPoints = true;
}    
function dragPointsUpdate(){
    // handle drag points
    closePointIndex = dragPoints.findClosestIndex(mouseV, SELECT_DIST); // find the closest point to the mouse
    // if mouse B1 is down then draging make sure there is a point to drag
    if(mouse.buttonRaw === 1 && (closePointIndex !== -1 || currentDragPoint !== undefined)){
        if(currentDragPoint === undefined){  // set the current drag point
            currentDragPoint = closePointIndex;
            dragOffset.setAs(mouseV).sub(dragPoints.vecs[currentDragPoint]); // get the drag offset
        }
        dragPoints.vecs[currentDragPoint].setAs(mouseV).sub(dragOffset); // update that point
    }else{
        currentDragPoint = undefined;  // undefine the drag index        
    }
    mouseNearEl.textContent = currentDragPoint !== undefined ? currentDragPoint : (closePointIndex === -1 ? "none" : closePointIndex);
}


window.addEventListener("load", start);