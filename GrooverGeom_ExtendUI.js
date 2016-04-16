groover.geom.Geom.prototype.addUI = function(element1){
    var geom, element, mouse, points, selected, unselected, boundingBox, selectionBox, buttonMain,buttonRight,buttonMiddle;
    var dragOffsetX, dragOffsetY,dragStartX, dragStartY, pointerLoc, mouseOveBounds;
    geom = this;
    element = element1;
    
    geom.Geom.prototype.UIelement = element;    
    geom.Geom.prototype.UIMouse;    
    geom.Geom.prototype.updatePointer;    
    
    
    points = new geom.VecArray();
    selected = new geom.VecArray();
    unselected = new geom.VecArray();
    inSelectionBox = new geom.VecArray();
    pointerLoc = new geom.Vec();
    workVec = new geom.Vec();  // rather than create a new vec each time just use this onerror
    boundingBox = new geom.Box();
    selectionBox = new geom.Box();
    buttonMain = 1;
    buttonRight = 4;
    buttonMiddle = 2;
    
    this.extentions.UI = {   // add extentions 
        functions : [],
        info : "Provides a User interface for basic interaction."
    };
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
    geom.Geom.prototype.UI = {
        pointOfInterestIndex : undefined,  // this holds a index to a point in one of the exposed vecArrays and is set depending on the function and argument. use it to access the point of interest
        points : points,
        selected : selected,
        closestToPointer : undefined,
        dragging : false,
        draggingItem : undefined,
        boundingBox : boundingBox,
        selectionBox : selectionBox,
        dragSelecting : false,
        pointerOverBounds : false,

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
            mouse.remove();
            
        },
        buttonDown : function(){
            
        },
        updatePointer : function(){
            var sel;
            pointerLoc.x = mouse.x;
            pointerLoc.y = mouse.y;
            this.pointerOverBounds = boundingBox.isVecInside(pointerLoc);

            var ind = points.findClosestIndex(pointerLoc,this.pointerDistLimit);
            if(ind !== -1){
                this.closestToPointer = points.vecs[ind]
            }else{
                this.closestToPointer = undefined;
            }
            if((mouse.buttonRaw & buttonMain) === buttonMain){
                if(!this.dragging && !buttonDown){
                    if(this.closestToPointer !== undefined){
                        sel = this.selected.isIdInArray(this.closestToPointer.id);
                        if(quickDrag || sel){
                            if(quickDrag && !sel){
                                this.selectNone()
                                this.selectPoint(this.closestToPointer,true);
                            }
                            buttonDownOnSelected = true;
                            this.dragging = true;
                            dragOffsetX = this.closestToPointer.x-mouse.x;
                            dragOffsetY = this.closestToPointer.y-mouse.y;
                            dragStartX = mouse.x;
                            dragStartY = mouse.y;
                            buttonDownOn = this.closestToPointer;
                            dragged = false;
                        }else{
                            buttonDownOn = this.closestToPointer;
                            buttonDownOnSelected = false;
                            buttonDown = true;
                            dragged = false;
                        }
                    }else
                    if(this.pointerOverBounds){
                        buttonDownOnSelected = false;
                        this.dragging = true;
                        dragStartX = mouse.x;
                        dragStartY = mouse.y;
                        buttonDownOn = undefined;
                        dragged = false;                        
                    }else{
                        buttonDownOn = undefined;
                        buttonDownOnSelected = false;
                        buttonDown = true;
                        dragStartX = mouse.x;
                        dragStartY = mouse.y;                        
                        selectionBox.right = selectionBox.left = dragStartX = mouse.x;
                        selectionBox.bottom = selectionBox.top = dragStartY = mouse.y;
                        dragged = false;
                        this.dragging = true;
                        this.dragSelecting = true;
                        
                    }
                }else
                if(this.dragging){
                    if(!dragged && Math.abs(mouse.x- dragStartX) < 2 && Math.abs(mouse.y- dragStartY) < 2){
                        
                    }else{
                        dragged = true;
                        draggingFinnalFlag = true;
                        if(this.dragSelecting){
                            selectionBox.left = dragStartX;
                            selectionBox.top = dragStartY;
                            selectionBox.right = mouse.x;
                            selectionBox.bottom = mouse.y;
                            selectionBox.normalise();
                            points.findInsideBox(selectionBox,selected,unselected);
                            this.dragSelecting = true;
                            
                        }else{
                            workVec.x = mouse.x- dragStartX;
                            workVec.y = mouse.y- dragStartY;
                            dragStartX = mouse.x;
                            dragStartY = mouse.y;
                            selected.add(workVec);
                            boundingBox.add(workVec);
                            pointsUpdated = true;
                        }
                        
                    }
                    
                    
                }else
                if(buttonDown){
                    
                }
            }else{
                if(this.dragging){
                    if(! dragged && Math.abs(mouse.x- dragStartX) < 2 && Math.abs(mouse.y- dragStartY) < 2){
                        if(quickDrag){
                            
                        }else{
                            if(buttonDownOn !== undefined){
                                this.unselectPoint(buttonDownOn,true);
                            }else{
                                this.selectNone();
                            }
                        }
                    }else
                    if(this.dragSelecting){

                    }
                    selected.asBox(boundingBox.irrate());
                    this.dragSelecting = false;
                    buttonDown = false;
                    buttonDownOn = undefined;
                    this.dragging = false;
                    dragged = false;
                }else
                if(buttonDown){
                    if(buttonDownOn === undefined){
                        this.selectNone();                        
                    }else{
                        if(!buttonDownOnSelected && this.closestToPointer !== undefined && this.closestToPointer.id === buttonDownOn.id){
                            this.selectNone();
                            this.selectPoint(buttonDownOn,true);                       
                        }
                    }
                    buttonDownOn = undefined;
                    buttonDownOnSelected = false;
                    buttonDown = false; 
                }else
                if(draggingFinnalFlag){
                    draggingFinnalFlag = false;
                }

            }
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
                if(id !== undefined && id.id !== undefined){
                    return selected.isIdInArray(id.id);
                }
                return selected.isIdInArray(id)
            }
        },
        addPoint : function(vec,allreadyUnique){
            if(!allreadyUnique){
                vec.makeUnique();
            }
            points.push(vec);
            return this;
        },
        addPoints : function(vecArray, allreadyUnique){
            vecArray.each(function(vec){
                if(!allreadyUnique){
                    vec.makeUnique();
                }
                points.push(vec);
            });
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
            selected.asBox(boundingBox.irrate());
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
            selected.asBox(boundingBox.irrate());
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
            selected.asBox(boundingBox.irrate());
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
            selected.asBox(boundingBox.irrate());
            return this;
        },
        selectAll : function(){
            unselected.clear();
            selected.clear().append(points);
            selected.asBox(boundingBox.irrate());
            return this;
        },
        selectNone : function(){
            unselected.clear().append(points);
            selected.clear();
            boundingBox.irrate()
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
            selected.asBox(boundingBox.irrate());
            return this;
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
    
    geom.Geom.prototype.UIMouse = mouse = (function(){
        function preventDefault(e) { e.preventDefault(); }
        var interfaceId = 0;
        var i;
        var mouse = {
            x : 0, y : 0, w : 0, alt : false, shift : false, ctrl : false, buttonRaw : 0,
            active : false,
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
            if(mouse.element !== undefined){ mouse.removeMouse();}
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
 /*   
GG.dragPoints = {
    mouseV : new GG.Vec(),
    dragOffset : new GG.Vec(),
    points : new GG.VecArray(),
    closePointIndex : undefined,
    dragging : undefined,
    dragButtonMask : 1,
    cursor : "pointer",
    SELECT_DIST : 10,
    mark : {
        type : "circle",
        col : "black",
        fill : "white",        
        lineWidth : 3,
        size : 10,
    },
    highlight : {
        type : "circle",
        col : "black",
        fill : "white",
        lineWidth : 3,
        size : 10,
    },
    update : function(mouse){
        this.mouseV.setAs(mouse.x, mouse.y);
        this.closePointIndex = this.points.findClosestIndex(this.mouseV, this.SELECT_DIST); 
        if((mouse.buttonRaw & this.dragButtonMask) === this.dragButtonMask && 
                (this.closePointIndex !== -1 || this.dragging !== undefined) ){
            if(this.dragging === undefined){  
                this.dragging = this.closePointIndex;
                this.dragOffset.setAs(this.mouseV).sub(this.points.vecs[this.dragging]); 
            }
            ctx.canvas.style.cursor = this.cursor;
            this.points.vecs[this.dragging].setAs(this.mouseV).sub(this.dragOffset); 
        }else{
            if(this.closePointIndex === -1){
                ctx.canvas.style.cursor = "default";
            }else{
                ctx.canvas.style.cursor = this.cursor;
            }
            this.dragging = undefined;        
        }
    },
    reset : function(){
        this.points.clear();
        this.closePointIndex =-1;
        this.dragging = undefined;
    },
    display : function(what){
        if(what === undefined || what === "all"){
            ctx.setTransform(1, 0, 0, 1, 0, 0);
            ctx.fillStyle = this.highlight.fill;
            ctx.strokeStyle = this.mark.col;
            ctx.lineWidth = this.mark.lineWidth;
            GG.setMark(this.mark.type);
            GG.setMarkSize(this.mark.size);      // set the current point size
            ctx.beginPath();
            this.points.mark();     // mark all the points in dragPoints
            ctx.stroke();          // render them      
        }

        if(what === undefined || what === "drag"){
            if(this.closePointIndex > -1 || this.dragging !== undefined ){
                ctx.fillStyle = this.highlight.fill;
                ctx.strokeStyle = this.highlight.col;
                ctx.lineWidth = this.highlight.lineWidth;
                GG.setMark(this.highlight.type);
                GG.setMarkSize(this.highlight.size);      // set the current point size
                ctx.beginPath();
                this.points.vecs[this.dragging !== undefined ? this.dragging : this.closePointIndex].mark();     // mark the points in dragPoints
                ctx.stroke();          // render them
                ctx.fill();          // render them
            }  
        }
    }
}    */
