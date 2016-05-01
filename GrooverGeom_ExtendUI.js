"use strict";
groover.geom.Geom.prototype.addUI = function(element1){
    var geom, element, mouse, points, selected, unselected, boundingBox, selectionBox, buttonMain,buttonRight,buttonMiddle;
    var dragOffsetX, dragOffsetY,dragStartX, dragStartY, pointerLoc, mouseOveBounds,workVec,workVec1,workVec2,workVec3;
    var inSelectionBox, boundsCorners, boundsLines,shadowPoints, shadowing,mirrorShadow, shadowSelection;
    if(this.UI !== undefined){
        if(element1 === undefined){
            console.log("Call to groover.geom.Geom.prototype.addUI() failed. Groover.Geom.Shape extension already exists");        
            return;
        }
        throw new Error("Could not add UI for element because UI already exists. Use  groover.Geom.setUIElement(element) istead.");
    }    
    this.UI = function(){};    
    geom = this;
    element = element1;
    geom.Geom.prototype.UIelement = element;    
    geom.Geom.prototype.UIMouse;    
    geom.Geom.prototype.updatePointer;    
    points = new geom.VecArray();
    shadowPoints = new geom.VecArray(); // IF the client app modifies points  when they change (such as snap to) this array can be used to maintain the correct aspects and dragging offsets during dragging operations.
                                        // call shadowPoints to activate shadows
                                        // call unshadowPoints to deactivate
                                        // call isShadowing to get status
    shadowing = false;               
    mirrorShadow = function(a1,a2){  // copies the points coords in array 1 to array to 
        a1.each(function(p,i){
            a2.vecs[i].x = p.x;
            a2.vecs[i].y = p.y;
        });
    }
        
    shadowSelection = new geom.VecArray();    
    selected = new geom.VecArray();
    unselected = new geom.VecArray();
    inSelectionBox = new geom.VecArray();
    pointerLoc = new geom.Vec();
    workVec = new geom.Vec();  // rather than create a new vec each time just use this onerror
    workVec1 = new geom.Vec();  // rather than create a new vec each time just use this onerror
    workVec2 = new geom.Vec();  // rather than create a new vec each time just use this onerror
    workVec3 = new geom.Vec();  // rather than create a new vec each time just use this onerror
    boundingBox = new geom.Box();
    selectionBox = new geom.Box();
    boundsCorners = [
        new geom.Vec().setLable("TopLeft"),
        new geom.Vec().setLable("TopRight"),
        new geom.Vec().setLable("BottomRight"),
        new geom.Vec().setLable("BottomLeft"),
        new geom.Vec().setLable("Top"),
        new geom.Vec().setLable("Right"),
        new geom.Vec().setLable("Bottom"),
        new geom.Vec().setLable("Left"),
        new geom.Vec().setLable("Rotate"),
    ]; // from top left around clockwise
    var rotationLine = new geom.Line(boundsCorners[4],boundsCorners[8]);
    boundsLines = [ 
        new geom.Line(boundsCorners[0],boundsCorners[1]),
        new geom.Line(boundsCorners[1],boundsCorners[2]),
        new geom.Line(boundsCorners[2],boundsCorners[3]),
        new geom.Line(boundsCorners[3],boundsCorners[0])
    ];
    var boundsTransform = new geom.Transform();
    var workTransform = new geom.Transform();
    var cIndex = {
            topLeft : 0,
            topRight : 1,
            bottomRight : 2,
            bottomLeft : 3,
            top : 4,
            right : 5,
            bottom : 6,
            left : 7,
            rotate : 8,
    };   
    var bounds = {
        box : boundingBox,
        rotationLine : rotationLine,
        padBy : 7,
        points : new geom.VecArray(boundsCorners),
        lines : new geom.PrimitiveArray(boundsLines),
        pointerOverPointIndex : -1,
        controls : false,  // if true then control points are active. Usualy when only a single point is selected
        active : false, // if true then bounds is set and active
        pointerOverControlIndex : -1,
        transform : boundsTransform,
        boundControlePointIndexs : cIndex,
        mainCursor : "move",
        controlPointCursors : [
            "nw-resize",
            "ne-resize",
            "se-resize",
            "sw-resize",
            "n-resize",
            "e-resize",
            "s-resize",
            "w-resize",
            "rotate",
        ],
        controlPointsTransformOriginIndex : [
           cIndex.bottomRight,
           cIndex.bottomLeft,
           cIndex.topLeft,
           cIndex.topRight,
           cIndex.bottom,
           cIndex.left,
           cIndex.top,
           cIndex.right,
         ],  
    }
    var cursorNames = {
        selectAdd : "add",
        selectRemove : "remove",
        move : "move",
        select : "pointer",
    }

    buttonMain = 1;
    buttonRight = 4;
    buttonMiddle = 2;
    this.extentions.UI = {   // add extentions 
        functions : [],
        info : "Provides a User interface for basic interaction."
    };
    this.objectNames.push("UI");
    geom.Geom.prototype.setUIElement = function(element1){
        if(element1 === undefined || element1 === null){
            if(mouse.active){
                mouse.remove();
            }
            throw new TypeError("Groover.Geom.setUIElement invalid element can not start.");
        }
        element = geom.Geom.prototype.UIelement = element1;    
        mouse.start(element)
    }
    var buttonDown = false;
    var buttonDownOnSelected = false;
    var buttonDownOn = undefined;
    var dragged = false;
    var dragSelection = false;
    var quickDrag = false;
    var draggingFinnalFlag = false; // this is true untill the pointer update after all dragging is complete
    var pointsUpdated = false; // true if there are point that have been changed. 
    var currentMouseFunction;

    this.UI.prototype = {
        pointOfInterestIndex : undefined,  // this holds a index to a point in one of the exposed vecArrays and is set depending on the function and argument. use it to access the point of interest
        points : points,
        selected : selected,
        closestToPointer : undefined,
        dragging : false,
        draggingItem : undefined,
        bounds : bounds,
        rotationLine : rotationLine,
        selectionBox : selectionBox,
        dragSelecting : false,
        pointerOverBounds : false,        
        changed : true,  // this is set to true if a point has been moved or there has been any change in any geom stored, changed is flaged true of points are added or removed. Changed does not include changes in selection
        cursor : "default",
        selectCursor : "pointer",
        dragPointCursor : "move",
        cursorNames : cursorNames,
        currentPointerFunction : undefined,   
        nextPointerFunctionOnDown : undefined,
        
        pointerLoc : pointerLoc,
        pointerDistLimit : 10,
        setDragMode : function(mode){
            if(typeof mode === "string"){
                mode = mode.toLowerCase();
                switch( mode ){
                    case "quickdrag":
                        quickDrag = true;
                        return;
                    case "clickselect":
                        quickDrag = false;
                        return;
                }
            }
        },      
        reset : function(){
            selected.reset();
            unselected.reset();
            points.reset();
            inSelectionBox.reset();
            this.draggingItem = undefined;
            this.closestToPointer = undefined;
            this.currentPointerFunction = undefined;
            this.nextPointerFunctionOnDown = undefined;
            this.dragging = false;
            mouse.remove();
        },
        buttonDown : function(){
            
        },
        mainButton : false,
        dragComplete : function(updateSelection){
            if(updateSelection === true){
                this.selectionChanged();
            }
            this.dragging = false;
            this.currentPointerFunction = this.pointerHover;                    
        },
        updatePointerState : function(){
            this.mainButton = (mouse.buttonRaw & buttonMain) === buttonMain;
            pointerLoc.x = mouse.x;            
            pointerLoc.y = mouse.y;   
            if(this.currentPointerFunction === undefined){
                this.currentPointerFunction = this.pointerHover;
            }
        },
        pointerHover : function(){
            this.locateControlsAndPoints();
            if(this.mainButton){
                if(this.nextPointerFunctionOnDown !== undefined){
                    this.currentPointerFunction = this.nextPointerFunctionOnDown;
                    this.nextPointerFunctionOnDown = undefined;
                    dragStartX = mouse.x;
                    dragStartY = mouse.y;                    
                    return this.currentPointerFunction();
                }
            }            
        },
        pointerQuickMove : function(){
            if(!this.dragging){ 
                this.dragging = true;   
                this.selectNone()
                this.selectPoint(this.closestToPointer,true);
                this.currentPointerFunction = this.pointerDragBounds;
            }else{            
                this.dragComplete();                   
            }
        },
        pointerSelectAdd : function(){
            if(!this.dragging){ 
                this.dragging = true;   
                buttonDownOn = this.closestToPointer;
            }else{            
                if(!this.mainButton){
                    this.getPointAtPointer();
                    if(buttonDownOn.id === this.closestToPointer.id){
                        this.selectPoint(buttonDownOn,true);  
                        buttonDownOn = undefined;
                    }
                    this.dragComplete();                   
                }
            }
        },
        pointerSelectRemove : function(){
            if(!this.dragging){ 
                this.dragging = true;   
                buttonDownOn = this.closestToPointer;
            }else{            
                if(!this.mainButton){
                    this.getPointAtPointer();
                    if(buttonDownOn.id === this.closestToPointer.id){
                        this.unselectPoint(buttonDownOn,true);  
                        buttonDownOn = undefined;
                    }
                    this.dragComplete();                   
                }
            }            
        },
        pointerDragBounds : function(){           
            if(!this.dragging){ 
                this.dragging = true;   
                if(shadowing){
                    mirrorShadow(selected,shadowSelection);
                };
            }else{
                if(!this.mainButton){
                    this.dragComplete(true);                   
                }else{
                    workVec.x = mouse.x- dragStartX;
                    workVec.y = mouse.y- dragStartY;
                    dragStartX = mouse.x;
                    dragStartY = mouse.y; 
                    if(shadowing){
                        shadowSelection.add(workVec);
                        mirrorShadow(shadowSelection,selected);
                    }else{                    
                        selected.add(workVec);
                    }
                    boundingBox.add(workVec);
                    this.bounds.points.add(workVec);
                    this.changed = pointsUpdated = true;                
                }
            }
        },
        pointerDragBoundsRotate : function(){    
            if(!this.dragging){ 
                this.dragging = true;   
                this.bounds.draggingPointIndex = this.bounds.pointerOverControlIndex;         
                if(shadowing){
                    mirrorShadow(selected,shadowSelection);
                };                
            }else{
                if(!this.mainButton){
                    this.dragComplete(true);     
                    this.bounds.draggingPointIndex = -1;                    
                }else{
                    workVec.x = mouse.x- dragStartX;
                    workVec.y = mouse.y- dragStartY;
                    dragStartX = mouse.x;
                    dragStartY = mouse.y;                
                    boundingBox.center(workVec3);
                    workVec1.setAs(this.bounds.points.vecs[this.bounds.draggingPointIndex]).sub(workVec3);
                    workVec2.setAs(workVec1).add(workVec);
                    var ang = workVec1.angleBetween(workVec2);
                    this.bounds.transform.reset()
                        .setOrigin(workVec3) // set center
                        .negateOrigin()      // invert origin so that all points are move to be relative to center
                        .rotate(ang)         // rotate all points
                        .translate(workVec3.x,workVec3.y);  // return points to the original position
                    if(shadowing){
                        this.bounds.transform.applyToVecArray(shadowSelection);   
                        mirrorShadow(shadowSelection,selected);                        
                    }else{
                        this.bounds.transform.applyToVecArray(selected)
                    }
                    this.bounds.transform.applyToVecArray(this.bounds.points);           
                    this.changed = pointsUpdated = true;                   
                }
            }
        },
        pointerDragBoundsScale : function(){           
            if(!this.dragging){ 
                this.dragging = true;   
                this.bounds.draggingPointIndex = this.bounds.pointerOverControlIndex;    
                if(shadowing){
                    mirrorShadow(selected,shadowSelection);
                };                
            }else{
                if(!this.mainButton){
                    this.dragComplete(true);     
                    this.bounds.draggingPointIndex = -1;                    
                }else{
                    workVec.x = mouse.x- dragStartX;
                    workVec.y = mouse.y- dragStartY;
                    dragStartX = mouse.x;
                    dragStartY = mouse.y;                
                    var oldWidth = boundingBox.right - boundingBox.left;
                    var oldHeight = boundingBox.bottom - boundingBox.top;
                    this.bounds.points.vecs[this.bounds.draggingPointIndex].add(workVec);
                    switch(this.bounds.draggingPointIndex){
                        case cIndex.topLeft:
                        case cIndex.topRight:
                        case cIndex.top:
                           boundingBox.top += workVec.y;
                           break;
                        case cIndex.bottomRight:
                        case cIndex.bottomLeft:
                        case cIndex.bottom:
                           boundingBox.bottom += workVec.y;
                           break;
                    }
                    switch(this.bounds.draggingPointIndex){
                        case cIndex.topLeft:
                        case cIndex.bottomLeft:
                        case cIndex.left:
                           boundingBox.left += workVec.x;
                           break;
                        case cIndex.topRight:
                        case cIndex.bottomRight:
                        case cIndex.right:
                           boundingBox.right += workVec.x;
                           break;
                    }
                    var v1 = this.bounds.points.vecs[this.bounds.controlPointsTransformOriginIndex[this.bounds.draggingPointIndex]];
                    this.bounds.transform.reset()
                        .setOrigin(v1)
                        .negateOrigin()
                        .scale((boundingBox.right - boundingBox.left) / oldWidth, (boundingBox.bottom - boundingBox.top) / oldHeight)
                        .translate(v1.x,v1.y)
                    if(shadowing){
                        this.bounds.transform.applyToVecArray(shadowSelection);   
                        mirrorShadow(shadowSelection,selected);                        
                    }else{
                        this.bounds.transform.applyToVecArray(selected);        
                    }
                    this.changed = pointsUpdated = true;                   
                    this.updateBounds();
                }
            }
        },
        pointerDragSelect : function(){
            if(!this.dragging){ 
                selectionBox.right = selectionBox.left = dragStartX;
                selectionBox.bottom = selectionBox.top = dragStartY;
                this.dragging = true;
                this.dragSelecting = true;                
            }else{
                if(!this.mainButton){
                    this.dragSelecting = false;                
                    this.dragComplete(true);  
                }else{
                    selectionBox.left = dragStartX;
                    selectionBox.top = dragStartY;
                    selectionBox.right = mouse.x;
                    selectionBox.bottom = mouse.y;
                    selectionBox.normalise();
                    points.findInsideBox(selectionBox,selected,unselected);
                    this.dragSelecting = true;                
                }
            }
        },       
        getPointAtPointer : function(){
            var ind = points.findClosestIndex(pointerLoc,this.pointerDistLimit);
            if(ind !== -1){
                this.closestToPointer = points.vecs[ind];
                return this.isSelected(this.closestToPointer.id);
            }else{
                this.closestToPointer = undefined;
            }         
            return false;            
        },
        locateControlsAndPoints : function(){
            var vecSelected = false;
            this.nextPointerFunctionOnDown = undefined;
            if(this.bounds.active){
                if(this.bounds.controls){
                    this.bounds.pointerOverControlIndex = this.bounds.points.findClosestIndex(pointerLoc,this.pointerDistLimit, true);
                    if(this.bounds.pointerOverControlIndex === -1){ 
                        this.bounds.pointerOverControlIndex = -1;
                        this.pointerOverBounds = boundingBox.isVecInside(pointerLoc);
                    }else{
                        this.pointerOverBounds = false;
                    }
                }else{
                    this.bounds.pointerOverControlIndex = -1;
                    this.pointerOverBounds = boundingBox.isVecInside(pointerLoc);
                }
            }else{
                this.bounds.pointerOverControlIndex = -1;
                this.pointerOverBounds = false;
            }
            if(!this.dragging){
                vecSelected = this.getPointAtPointer();
                if(this.bounds.pointerOverControlIndex > -1){
                    mouse.requestCursor(this.bounds.controlPointCursors[this.bounds.pointerOverControlIndex]);
                    if(this.bounds.pointerOverControlIndex !== cIndex.rotate){
                        this.nextPointerFunctionOnDown = this.pointerDragBoundsScale;
                    }else{
                        this.nextPointerFunctionOnDown = this.pointerDragBoundsRotate;
                    }
                }else
                if(this.pointerOverBounds){
                    if(mouse.ctrl && this.closestToPointer !== undefined){
                        if(vecSelected){
                            mouse.requestCursor(cursorNames.selectRemove);
                            this.nextPointerFunctionOnDown = this.pointerSelectRemove;                            
                        }else{
                            mouse.requestCursor(cursorNames.selectAdd);
                            this.nextPointerFunctionOnDown = this.pointerSelectAdd;
                        }
                    }else{
                        mouse.requestCursor(this.bounds.mainCursor);
                        this.nextPointerFunctionOnDown = this.pointerDragBounds;
                    }
                }else
                if(this.closestToPointer !== undefined){
                    if(quickDrag){
                        if(mouse.ctrl){
                            if(vecSelected){
                                mouse.requestCursor(cursorNames.selectRemove);
                                this.nextPointerFunctionOnDown = this.pointerSelectRemove;
                            }else{
                                mouse.requestCursor(cursorNames.selectAdd);
                                this.nextPointerFunctionOnDown = this.pointerSelectAdd;
                            }
                        }else{
                            mouse.requestCursor(cursorNames.move);
                            this.nextPointerFunctionOnDown = this.pointerQuickMove;
                        }
                    }else{
                        if(vecSelected){
                            mouse.requestCursor(cursorNames.selectRemove);
                            this.nextPointerFunctionOnDown = this.pointerSelectRemove;
                        }else{
                            mouse.requestCursor(cursorNames.selectAdd);
                            this.nextPointerFunctionOnDown = this.pointerSelectAdd;
                        }                            
                    }
                            

                }else{
                    this.nextPointerFunctionOnDown = this.pointerDragSelect;
                    mouse.releaseCursor();
                }
            }else{
                this.closestToPointer = undefined;
                mouse.requestCursor("none");
            }
            
            
        },
        updatePointer : function(){
            this.updatePointerState();
            this.currentPointerFunction()
        },
        hasPointMoved : function(id){ // id can be a point or the index or an array returns true of a point with Id is in the selected vecArray and it is being dragged
            if(pointsUpdated){
                pointsUpdated = false; 
                if(Array.isArray(id)){
                    for(var i = 0; i < id.length; i ++){
                        if(id[i] !== undefined && id[i].id !== undefined){
                            if(selected.isIdInArray(id[i].id)){
                                this.pointOfInterestIndex = geom.registers.get("c"); 
                                return true;
                            }
                        }else{
                            if(selected.isIdInArray(id[i])){
                                this.pointOfInterestIndex = geom.registers.get("c"); 
                                return true;
                            }                            
                        }
                    }
                    return false;
                    
                }else
                if(geom.isPrimitive(id)){
                    return selected.isIdInArray(id.id);
                }
                return selected.isIdInArray(id)
            }
        },
        shadowPoints : function(){
            var p,v;
            if(!shadowing){
                shadowPoints.reset();
                points.each(function(p){
                    shadowPoints.push(v = p.copy());
                    v.id = p.id;
                });
                shadowing = true;
                this.shadowSelection();
            }
            return this;
        },
        unshadowPoints : function(){
            if(shadowing){
                shadowPoints.reset();
                this.shadowSelection();
                shadowing = false;
            }
            return this;
        },
        isShadowing : function(){
            return shadowing;
        },
        shadowSelection : function(){
            var v;
            if(shadowing){
                shadowSelection.clear();
                selected.each(function(p,i){
                    v = shadowPoints.getVecById(p.id);
                    if(v === undefined){
                        shadowSelection.clear();
                        throw new Error("Geom.UI.shodowSelection. Points array missmatch. Cant find selected in shadow array.");
                    }
                    shadowSelection.push(v);
                });
            }
            return this;
        },
        addPoint : function(vec,allreadyUnique){
            if(!allreadyUnique){
                vec.makeUnique();
            }
            points.push(vec);
            this.pointsListChanged();
            this.selectPoint(vec);
            this.changed = true;
            return this;
        },
        addPoints : function(vecArray, allreadyUnique){
            vecArray.each(function(vec){
                if(!allreadyUnique){
                    vec.makeUnique();
                }
                points.push(vec);
            });
            this.pointsListChanged();
            this.selectPoints(vecArray);
            this.changed = true;
            return this;
        },
        pointsListChanged : function(){
            if(shadowing){
                shadowPoints.setLength(points.length);
                shadowPoints.each(function(p,i){
                    p.x = points.vecs[i].x;
                    p.y = points.vecs[i].y;
                    p.id = points.vecs[i].id;
                });
            }
            return this;
        },
        selectPointToggle : function(point, safe){ // point is a vec and safe is true if you want the selection to check for violations.
            var sel,unsel;
            if(safe){
                if(points.isIdInArray(point.id)){
                    sel = selected.isIdInArray(point.id);
                    var indS = geom.registers.get("c"); // get the index of point
                    unsel = unselected.isIdInArray(point.id);
                    var indU = geom.registers.get("c"); // get the index of point
                    if(sel && !unsel){                            
                        selected.remove(indS);   
                        unselected.push(point);   
                    }else
                    if(!sel && unsel){
                        selected.push(point);
                        unselected.remove(indU);
                    }
                }
            }else{
                if(selected.isIdInArray(point.id)){
                    selected.remove(geom.registers.get("c"));                    
                    unselected.push(point);
                }else{
                    unselected.removeById(point.id);                    
                    selected.push(point);
                }
            }
            this.selectionChanged();
            return this;
        },
        selectPoint : function(point, safe){ // point is a vec and safe is true if you want the selection to check for violations.
            if(safe){
                if(points.isIdInArray(point.id)){
                    unselected.removeById(point.id);
                    if(!selected.isIdInArray(point.id)){
                        selected.push(point);
                    }
                }
            }else{
                unselected.removeById(point.id);
                selected.push(point);
            }
            this.selectionChanged();
            return this;
        },
        unselectPoint : function(point, safe){ // point is a vec and safe is true if you want the selection to check for violations.
            if(safe){
                if(points.isIdInArray(point.id)){
                    selected.removeById(point.id);
                    if(!unselected.isIdInArray(point.id)){
                        unselected.push(point);
                    }
                }
            }else{
                selected.removeById(point.id);
                unselected.push(point);
            }
            this.selectionChanged();
            return this;
        },        
        selectPoints : function(selPoints, safe){
            if(selPoints !== undefined && selPoints.type === "VecArray"){
                selPoints.each((function(vec){
                    this.selectPoint(vec, safe);
                }).bind(this));
            }else
            if(Array.isArray(selPoints)){
                selPoints.forEach((function(vec){
                    this.selectPoint(vec, safe);
                }).bind(this));
            }
            this.selectionChanged();
            return this;
        },
        selectAll : function(){
            unselected.clear();
            selected.clear().append(points);
            this.selectionChanged();
            return this;
        },
        selectNone : function(){
            unselected.clear().append(points);
            selected.clear();
            this.selectionChanged();
            return this;
        },
        selectInvert : function(){
            var idList = [];
            selected.each(function(vec){
                idList[idList.length] = vec.id;
            })
            unselected.clear().append(selected);
            selected.clear();
            points.each(function(vec){
                if(idList.indexOf(vec.id) === -1){
                    selected.push(vec);
                }
            });
            this.selectionChanged();
            return this;
        },
        selectionChanged : function(){
            if(selected.length === 0){
                boundingBox.irrate();
                this.bounds.active = false;
                this.bounds.controls = false;
            }else
            if(selected.length === 1){
                selected.asBox(boundingBox.irrate()).pad(bounds.padBy);
                this.bounds.active = true;
                this.bounds.controls = false;
            }else{
                selected.asBox(boundingBox.irrate()).pad(bounds.padBy);
                boundingBox.center(rotationLine.p1);
                this.bounds.active = true;
                this.bounds.controls = true;
                this.updateBounds()
            }
            if(shadowing){
                this.shadowSelection();
            }
                
            return this;
        },
        updateBounds : function(){
            if(this.bounds.active){
                if(!this.bounds.controls){
                }else{
                    boundingBox.center(rotationLine.p1);
                    var cy = rotationLine.p1.y
                    var cx = rotationLine.p1.x
                    //rotationLine.p1.y = boundingBox.top;
                    boundsCorners[cIndex.left].x = boundsCorners[cIndex.topLeft].x = boundsCorners[cIndex.bottomLeft].x = boundingBox.left;
                    boundsCorners[cIndex.right].x = boundsCorners[cIndex.topRight].x = boundsCorners[cIndex.bottomRight].x = boundingBox.right;
                    boundsCorners[cIndex.top].x = boundsCorners[cIndex.bottom].x = cx;
                    boundsCorners[cIndex.top].y = boundsCorners[cIndex.topLeft].y = boundsCorners[cIndex.topRight].y = boundingBox.top;
                    boundsCorners[cIndex.bottom].y = boundsCorners[cIndex.bottomLeft].y = boundsCorners[cIndex.bottomRight].y = boundingBox.bottom;
                    boundsCorners[cIndex.left].y = boundsCorners[cIndex.right].y = cy;
                    rotationLine.p2.y = boundingBox.top - 20;
                    rotationLine.p2.x = rotationLine.p1.x;
                                        
                }
            }
            return this;
        },
        isSelected : function(id){
            if(selected.length > 0){
                if(typeof id === "number" || typeof id === "string" || Array.isArray(id)){
                    return selected.isIdInArray(id);
                }else
                if(geom.isPrimitive(id)){
                    return selected.isIdInArray(id.id);
                }
            }
            return false;
        },
        drawPoints : function(what){  // draws UI parts. What is what to draw. "all","selected","unselected"
            if(what === undefined){
                what = "all";
            }else{
                what = what.toLowerCase();
            }
            if(what === "all"){
                points.mark();
            }else
            if(what === "selected"){
                selected.mark();
            }else
            if(what === "unselected"){
                unselected.mark();
            }else
            if(what === "inselectionbox"){
                inSelectionBox.mark();
            }else
            if(what === "nearmouse" && this.closestToPointer !== undefined){
                this.closestToPointer.mark();
            }
        },
        mapMouseButton : function(which, where){
            if(where === undefined){
                throw new Error("mapMouseButton requers second argument!") 
            }else{
                where = where.toLowerCase();
            }
            if(which === undefined){
                which = 1;
            }else{
                which = which.toLowerCase();
                if(which === "left"){ which = 1; }else
                if(which === "middle"){ which = 2; }else
                if(which === "right"){ which = 4; }else{
                    throw new Error("mapMouseButton unknown mouse button : "+which) ;
                }
            }
            if(where === "left"){ buttonMain = which; }else
            if(where === "middle"){ buttonMiddle = which; }else
            if(where === "right"){ buttonRight = which; }else{        
                throw new Error("mapMouseButton unknown mouse button : "+where) ;
            }    
        }            
    }
    this.ui = new this.UI();
    geom.Geom.prototype.UIMouse = mouse = (function(){
        function preventDefault(e) { e.preventDefault(); }
        var interfaceId = 0;
        var i;
        var customCursors = {
            add :    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAYCAYAAABwZEQ3AAABzElEQVRIicWWX0tCQRDFf6BYJmgP+TcwSiy7FfRgZlqgBPX9P9HtYWdxHO/euzdRB4aVo+6ePXN2dqE4KipPGjWgDjRkrJ2KyBnQBNpAV8am4EeNmiycqhwBA8GPplAVV5I2kKZp6sm8CqG2fF89NBHvkRZOBU1mDiSCtziwh7RHBjgVNJkvNuoMOKCHsjySGjI2D+KhCsYjRUHYQxV2+5LFcvtVBddHuhm7z1NmBjwCfZw6vh/5rKu0eLC0WpmR7HiO84gm8wOsBV8AbzhD38hGukBPyPXY9CaLd4BL4CJEyHvGGzcRUprMGvgApkahJKDcJICPgSFwJUplRsxpmmJ8hSpnCfwFuBNCuQpt9RmVCz151mdLIA8XQkNcyYIe0h3Ye2iG88iOoTMW/Y3BZc4xzkN1ck6Z9dAj4o3QUTdGL8Rx/ktwpm7kkYFtD/WB20hlYstUioxXyHvoukgBq1YOvqJEmXRUhXlPKyIThhpiCnwH8JWoEmVgG1lNcSY5Bd5xJ+1T5VIWnMu4lFzI/6KOdiisoSfAPU7mB1ztn4BnGRP5jc9E4VFNryjsM7QjE3bYtHufe10HsWEf6OfsXoR7XZRlI+aJ8K8nxB+sHLGQMpxpsgAAAABJRU5ErkJggg==') 8 8, pointer",
            remove : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAUCAYAAAD2rd/BAAABuUlEQVRIicWXbUtCMRTHf6AoFlyEusrV3hRi+BBRRFk+VFRC3/8D2Ysdce5u8yxFB4dzx862/87+Z+dcKLdKgpy81YAGcK6QhtifrNWBDMiBAuhEpBC7TOYdvdVk81WC9DDgM47s6QrmenNgpWkC+FFAt4AzoEqc47tiQR0nFQwn26R5+AUYYrzcxM/xNV3qhGOjYYkqTmwP98Rzr8AMmFuyAN6BD/meAGPgBuhS5nhLDpKJblGOjUIclYsuUMbJmsMdAT0E7hy5T7yBPnANXO2wG0TGonESeyW64kkvn3192fDB7ofsQuNs4iTHsKDE6dA73BTQ9mI+gFsb+7412pKJ3EBbcASD0JaqGHdigGMHSdHWOt+YWLrF8N/r4dABtgD7rtYH+D8HsOZ+Ac8YSlyQkKBKgEOe9vR/NQAjlDgcYOXGy5idbz1nfC9KFM7pf5y+Tz4jY0vFfFXQ+QD7Esub6CkmySwcmWKy4ZPoKZsENJN+aP5c1t/5rIWam1gGjowpJ5oR5jr7okfW2Fg5f68Cy04sbcIp1U27lx6bWEo+aAlrJ5ZY0aItbDTz9y5dtWWhtnRM+g37A/SOJQU/LgzQAAAAAElFTkSuQmCC') 8 5, pointer",
            rotate : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAARCAYAAAAsT9czAAABWElEQVQ4ja2V20rDQBCGP3JR0pI0ltJTlBIrWi0mUClW8f2fSy/yrxk2m7RBB4btbv5DdjK7hWERBfLP4YtEwAiIgbHJWOsh/FUxMunmE2AKzIEFsNQ41/rEw1t+Z8RAAmQaE4ktge9A3gN3ej41HMeP+4wyieTKlRMOhTF9kOnK8NfSaxmOgNSJirD3TeyuAusvHn8HbKT7W9JI7nMr4v9WfgBn4N03DeBLoJBuLB8i6s5ahMol4qcMjsArcNB47OG8AY/SHftmy47yfMmoFHmrb7LVvOzgnYAn6V42897yGbgFZvoOM827OL1mwTIa8l47SvUN0gv4zjK6Bilsx5l0O8tp2jnTPIQ/A1WoQaBp/VxvU8ngpLGkbuU1zWFNNN/pucVX0nGVaN0mMXAjQCGwy4L6zNhD6na36cDn0uu9RVLCd2AaIA7Ft6Lvdv8PfCuG/m9dhf8BJ+ccqa7A1i0AAAAASUVORK5CYII=') 12 4, pointer",
        }

        var mouse = {
            x : 0, y : 0, w : 0, alt : false, shift : false, ctrl : false, buttonRaw : 0,
            active : false,
            currentCursor : "default",
            requestedCursor : "default",
            over : false,  // mouse is over the element
            bm : [1, 2, 4, 6, 5, 3], // masks for setting and clearing button raw bits;
            getInterfaceId : function () { return interfaceId++; }, // For UI functions
            mouseEvents : "mousemove,mousedown,mouseup,mouseout,mouseover,mousewheel,DOMMouseScroll".split(",")
        };
        function mouseMove(e) {
            var t = e.type, m = mouse;
            m.x = e.offsetX; m.y = e.offsetY;
            if (m.x === undefined) { m.x = e.clientX; m.y = e.clientY; }
            m.alt = e.altKey;m.shift = e.shiftKey;m.ctrl = e.ctrlKey;
            if (t === "mousedown") { m.buttonRaw |= m.bm[e.which-1];
            } else if (t === "mouseup") { m.buttonRaw &= m.bm[e.which + 2];
            } else if (t === "mouseout") { m.buttonRaw = 0; m.over = false;
            } else if (t === "mouseover") { m.over = true;
            } else if (t === "mousewheel") { m.w = e.wheelDelta;
            } else if (t === "DOMMouseScroll") { m.w = -e.detail;}
            if(this.callbacks){
                for(i = 0; i < this.callbacks.length; i ++){
                    this.callbacks[i](e);
                }            
            }
            e.preventDefault();
        }
        mouse.updateCursor = function(){
            if(this.requestedCursor !== this.currentCursor){
                this.currentCursor = this.requestedCursor;
                if(customCursors[this.requestedCursor] !== undefined){
                    this.element.style.cursor = customCursors[this.requestedCursor];
                }else{
                    this.element.style.cursor = this.currentCursor;
                }
            }
        }

        mouse.requestCursor = function(cursor){
            this.requestedCursor = cursor;
            mouse.updateCursor();
        }
        mouse.releaseCursor = function(){
            this.requestedCursor = "default";
            mouse.updateCursor();
        }
        
        mouse.addCallback = function(callback){
            if(typeof callback === "function"){
                if(mouse.callbacks === undefined){
                    mouse.callbacks = [callback];
                }else{
                    mouse.callbacks.push(callback);
                }
            }
        }
        mouse.start = function(element = document, blockContextMenu = false){
            if(mouse.element !== undefined){ mouse.remove();}
            mouse.element = element;
            mouse.mouseEvents.forEach(n => { element.addEventListener(n, mouseMove); } );
            if(blockContextMenu === true){
                element.addEventListener("contextmenu", preventDefault, false);
                mouse.contextMenuBlocked = true;
            }
            mouse.active = true;
        }
        mouse.remove = function(){
            if(mouse.element !== undefined){
                mouse.releaseCursor();
                mouse.mouseEvents.forEach(n => { mouse.element.removeEventListener(n, mouseMove); } );
                if(mouse.contextMenuBlocked === true){ mouse.element.removeEventListener("contextmenu", preventDefault);}
                mouse.contextMenuBlocked = undefined;
                mouse.callbacks = undefined;
                mouse.element = undefined;
            }
            mouse.active = false;
        }
        return mouse;
    })();    
    
    if(element !== undefined || element !== null){
        mouse.start(element);
    }
    
}
console.log("Groover.Geom.UI extension parsed.");

/* example code for displaying ui gisom        
// GG is groover.geom
// Requiers 
// groover.geom.extension.render
// groover.geom.extension.ui
// ui can run without render but you will have to supply the rendering

// then this resets, adds element 
GG.ui.reset()
GG.setUIElement(canvas);
GG.setCtx(ctx);  // sets render target for render extention.
GG.ui.setDragMode("quickDrag")
GG.ui.addPoints(tri.asVecArray(undefined,true));
GG.ui.addPoints(cir.asVecArray(undefined,true));
// ctx is context
// begin style set style for fill, stroke, and lineWidth then calls beginPath

var drawGeomUI = function(){
    
    // Highligh vec near mouse
    GG.setMark("circle");
    GG.setMarkSize(6)
    beginStyle("blue","red",3);
    GG.ui.drawPoints("nearmouse");
    ctx.fill();
    ctx.stroke();
    
    // draw all unselected    
    GG.setMark("circle");
    GG.setMarkSize(4)
    beginStyle("blue","#000",1);
    GG.ui.drawPoints("unselected");
    ctx.stroke();

    // draw all selected
    GG.setMark("circle");
    GG.setMarkSize(5)
    beginStyle("blue","red",2);
    GG.ui.drawPoints("selected");
    ctx.stroke();

    // draw the bounding box
    if(GG.ui.bounds.active){
        if(GG.ui.pointerOverBounds){  // is mouse over
            beginStyle("blue","Yellow",2);
        }else{
            beginStyle("blue","Yellow",1);
        }
        GG.ui.bounds.lines.moveTo().draw(); // draw the lines
        if(GG.ui.bounds.controls){          // draw controls if active (single points have no controls)
            GG.ui.bounds.rotationLine.moveTo().draw();
            GG.setMark("box");
            GG.setMarkSize(GG.ui.pointerDistLimit)
            GG.ui.bounds.points.mark();
        }
        ctx.stroke();
        // highlight bounds control if point over it
        if(GG.ui.bounds.pointerOverPointIndex > -1){
            beginStyle("blue","Yellow",2);
            GG.ui.bounds.points.vecs[GG.ui.bounds.pointerOverPointIndex].mark();
            ctx.stroke();
        }
    }

    // if drag selecting then draw the selection box
    if(GG.ui.dragSelecting){
        beginStyle("rgba(255,255,255,0.1)","white",2);
        GG.ui.selectionBox.moveTo().draw(); // expand by 7
        ctx.fill();
        ctx.stroke();
    }
 }*/