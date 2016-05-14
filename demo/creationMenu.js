"use strict";
var creationMenu = (function(){
    var GG;
    var objects;
    var actions = {
        line : {
            clicked : function(){
                var v1,v2;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined){
                    objects.all.push(L(v1,v2).makeUnique());
                    v1 = v2;
                    v2 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 1){
                    return true;
                }
                return false;
            }
        },
        rectangle : {
            clicked : function(){
                var v1,v2,v3;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined && v3 !== undefined){
                    var rec =R(L(v1,v2),0.5).makeUnique();
                    objects.all.push(rec);
                    rec.hashs = {h1:undefined,h2:0,h3:0};
                    rec.addConstructor(
                        GG.createConstructor(
                            [v3],
                            function(){
                                var cw = this.constructedWith;
                                var p = cw.primitives;
                                var h1,h2,h3;
                                h1 = this.top.p1.getHash();
                                h2 = this.top.p2.getHash();
                                h3 = p[0].getHash();  
                                if(this.hashs.h1 === undefined){ 
                                    var w = this.top.leng();
                                    var h = this.top.distFromDir(p[0]);
                                    this.aspect = h/w;
                                    this.hashs.width = w;
                                    this.hashs.dir = this.top.dir();
                                    this.hashs.u = Math.max(0, Math.min(1, this.top.unitDistOfClosestPoint(p[0])));
                                    
                                }else
                                if(h1 !== this.hashs.h1){  
                                    this.top.p2.setAs(this.top.p1).addPolar(this.hashs.dir, this.hashs.width);
                                    p[0].setAs(this.top.p1)
                                        .addPolar(this.hashs.dir,this.hashs.u * this.hashs.width)
                                        .addPolar(this.hashs.dir + Math.PI / 2, this.hashs.width * this.aspect);                            
                                }else
                                if(h2 !== this.hashs.h2){
                                    this.hashs.width = this.top.leng();
                                    this.hashs.dir = this.top.dir();
                                    //this.hashs.u = Math.max(0, Math.min(1, this.top.getUnitDistOfPoint(p[0])));                                    
                                    p[0].setAs(this.top.p1)
                                        .addPolar(this.hashs.dir, this.hashs.u * this.hashs.width)
                                        .addPolar(this.hashs.dir + Math.PI / 2, this.hashs.width * this.aspect);                            
                                  
                                }else
                                if(h3 !== this.hashs.h3){   
                                    var w = this.top.leng();
                                    var h = this.top.distFromDir(p[0]);
                                    this.aspect = h/w;           
                                    this.hashs.u = Math.max(0, Math.min(1, this.top.unitDistOfClosestPoint(p[0])));
                                    p[0].setAs(this.top.p1)
                                        .addPolar(this.hashs.dir, this.hashs.u * this.hashs.width)
                                        .addPolar(this.hashs.dir + Math.PI / 2, this.hashs.width * this.aspect);                            
                                                                      
                                }
                                
                                this.hashs.h1 = this.top.p1.getHash();
                                this.hashs.h2 = this.top.p2.getHash();
                                this.hashs.h3 = p[0].getHash();                                

                                
                            }
                        )
                    );
                    rec.recreate();

                    v1 = GG.ui.selected.next();
                    v2 = GG.ui.selected.next();
                    v3 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 1){
                    return true;
                }
                return false;
            }
        },        
        circle : {
            clicked : function(){
                var v1,v2;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined){
                    var cir = C(v1,200).makeUnique();
                    objects.all.push(cir);
                    cir.hashs = {h1:undefined,h2:0,dir:0};
                    cir.addConstructor(
                        GG.createConstructor(
                            [v2],
                            function(){
                                var cw = this.constructedWith;
                                var p = cw.primitives;
                                var h1,h2;
                                h1 = this.center.getHash();
                                h2 = p[0].getHash();
                                if(this.hashs.h1 === undefined){ // first call
                                    this.radius = this.center.distFrom(p[0]);
                                    this.hashs.dir = this.center.angleTo(p[0]);
                                }else
                                if(h1 !== this.hashs.h1){ // center moved
                                    p[0].setAs(this.center).addPolar(this.hashs.dir,this.radius);
                                }else
                                if(h2 !== this.hashs.h2){ // radius moved
                                    this.radius = this.center.distFrom(p[0]);
                                    this.hashs.dir = this.center.angleTo(p[0]);                              
                                }
                                this.hashs.h1 = this.center.getHash();
                                this.hashs.h2 = p[0].getHash();
                            }
                        )
                    );                    
                    cir.recreate();                    
                    v1 = GG.ui.selected.next();
                    v2 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 1){
                    return true;
                }
                return false;
            }
        },        
        circle2 : {
            clicked : function(){
                var v1,v2;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined){
                    var cir = C(V(),200).makeUnique();
                    objects.all.push(cir);
                    cir.addConstructor(
                        GG.createConstructor(
                            [v1,v2],
                            function(){
                                var cw = this.constructedWith;
                                var p = cw.primitives;
                                this.fromVec2(p[0],p[1]);
                            }
                        )
                    );                    
                    cir.recreate();                    
                    v1 = GG.ui.selected.next();
                    v2 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 1){
                    return true;
                }
                return false;
            }
        },        
        arc : {
            clicked : function(){
                var v1,v2,v3;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined && v3 !== undefined){
                    var arc = A(C(),0,0).makeUnique().fromVec3(v1,v2,v3);
                    objects.all.push(arc);
                    arc.addConstructor(
                        GG.createConstructor(
                            [v1,v2,v3],
                            function(){
                                var cw = this.constructedWith;
                                var p = cw.primitives;
                                this.fromVec3(p[0],p[1],p[2]);
                            }
                        )
                    );                    
                    v1 = v3;
                    v2 = GG.ui.selected.next();
                    v3 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 2){
                    return true;
                }
                return false;
            }
        },         
        arc3 : {
            clicked : function(){
                var v1,v2,v3;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined && v3 !== undefined){
                    var arc = A(C(v1,1),0,0).makeUnique();
                    arc.hashs = {h1:undefined,h2:0,h3:0};
                    objects.all.push(arc);
                    arc.addConstructor(
                        GG.createConstructor(
                            [v1,v2,v3],
                            function(){
                                var cw = this.constructedWith;
                                var p = cw.primitives;
                                var h1,h2,h3;
                                h1 = p[0].getHash();
                                h2 = p[1].getHash();
                                h3 = p[2].getHash();
                                if(this.hashs.h1 === undefined){ // first call
                                    this.endsFromVecs(p[1],p[2]);
                                    this.circle.radius = this.circle.center.distFrom(p[1]);
                                    this.endAsVec(p[2]);                                
                                }else
                                if(h1 !== this.hashs.h1){ // center moved
                                    this.startAsVec(p[1]);
                                    this.endAsVec(p[2]);
                                    
                                }else
                                if(h2 !== this.hashs.h2){ // start moved
                                    this.endsFromVecs(p[1],p[2]);
                                    this.circle.radius = this.circle.center.distFrom(p[1]);
                                    this.endAsVec(p[2]);                                
                                }else
                                if(h3 !== this.hashs.h3){ // end moved
                                    this.endsFromVecs(p[1],p[2]);
                                    this.circle.radius = this.circle.center.distFrom(p[2]);
                                    this.startAsVec(p[1]);
                                        
                                }
                                this.hashs.h1 = p[0].getHash();
                                this.hashs.h2 = p[1].getHash();
                                this.hashs.h3 = p[2].getHash();
                            }
                        )
                    );                    
                    arc.recreate();
                    v1 = v3;
                    v2 = GG.ui.selected.next();
                    v3 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 2){
                    return true;
                }
                return false;
            }
        },         
        triangle : {
            clicked : function(){
                var v1,v2,v3;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined && v3 !== undefined){
                    objects.all.push(T(v1,v3,v2,null).makeUnique());
                    v1 = GG.ui.selected.next();
                    v2 = GG.ui.selected.next();
                    v3 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 2){
                    return true;
                }
                return false;
            } 
        },        
        bezier2 : {
            clicked : function(){
                var v1,v2,v3;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined && v3 !== undefined){
                    objects.all.push(B(v1,v3,v2,null).makeUnique());
                    v1 = v3;
                    v2 = GG.ui.selected.next();
                    v3 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 2){
                    return true;
                }
                return false;
            } 
        },        
        bezier3 : {
            clicked : function(){
                var v1,v2,v3,v4;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();
                v4 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined && v3 !== undefined && v4 !== undefined){
                    objects.all.push(B(v1,v4,v2,v3).makeUnique());
                    v1 = v4;
                    v2 = GG.ui.selected.next();
                    v3 = GG.ui.selected.next();
                    v4 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 3){
                    return true;
                }
                return false;
            } 
        },
    }
    
    var menuDetails = [
        {type : "text",text : "Create", help : "Tools to create geometry"},
        { type : "button", text : "Line", help : "Create a line or a connected set of lines. Requires 2 points." },
        { type : "button", text : "Triangle", help : "Creates a Triangle Requires 3 points."},
        { type : "button", text : "Rectangle", help : "Creates a rectangle, the first two points define the top, the 3rd point defines the height. Requires 3 points." },
        { type : "button", text : "Circle" , help : "Creates a circle. The center at he first point, and the radius is distance from first point to 2nd point. Requires 2 points."},
        { type : "button", text : "Circle2" , help : "Create a circle by defining its diameter. Requires 2 points."},
        { type : "button", text : "Arc" , help : "Creates and arc that fits 3 points. Requires 3 points."},
        { type : "button", text : "Arc3" , help : "Creates an arc by defining the center then the start angle then the end angle. Requires 3 points."},
        { type : "button", text : "Bezier2" , help : "Creates a simple Quadratic bezier. Requires 3 points."},
        { type : "button", text : "Bezier3" , help : "Creates a simple Cubic bezier. Requires 4 points."},
    ];
    function createMenuClicked(event){
        if(event.type === "click"){
            if(this.type === "button"){
                var action = this.value.toLowerCase();
                if(actions[action] !== undefined && typeof actions[action].clicked === "function" && typeof actions[action].requisites === "function"){
                    if(actions[action].requisites()){
                        actions[action].clicked()
                    }
                }
            }
        }
        demo.updateUI();
    }  
    var primitiveUI = {
        vec : function(vec,extra){
            var span = createElement("span",{id : "vec", className : "uiPrimitive snug"});
            var id = createElement("span",{text : extra + " Vec ID : "+vec.id ,id : "primID", className : "uiPrimitivePropertyName snug"});
            var x = createElement("span",{text : "X : "+vec.x.toFixed(1) ,id : "vecX", className : "uiPrimitivePropertyName snug"});
            var y = createElement("span",{text : "Y : "+vec.y.toFixed(1) ,id : "vecY", className : "uiPrimitivePropertyName snug"});
            span.appendChild(id);
            span.appendChild(x);
            span.appendChild(y);
            span.appendChild(document.createElement("br"));
            return span;
        }
    }        
    var primitiveMenu = {
        vec : function(vec){
            var p = primitiveUI.vec(vec);
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            menuItem.id = "primitiveUI_Vec_"+vec.id;
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Vec";
            menuItem.appendChild(el);
            menuItem.appendChild(p);
            addMenuElement(menuItem);
        },
        line : function(line){
            var p1 = primitiveUI.vec(line.p1,"Start");
            var p2 = primitiveUI.vec(line.p2,"End");
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            menuItem.id = "primitiveUI_line_"+line.id;
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Line ID : "+line.id + " Length : "+ line.leng().toFixed(0) + " Direction : " + (line.dir()*180/Math.PI).toFixed(0);
            menuItem.appendChild(el);
            menuItem.appendChild(p1);
            menuItem.appendChild(p2);
            addMenuElement(menuItem);
        },
        triangle : function(triangle){
            var p1 = primitiveUI.vec(triangle.p1,"P1");
            var p2 = primitiveUI.vec(triangle.p2,"P2");
            var p3 = primitiveUI.vec(triangle.p3,"P3");
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            menuItem.id = "primitiveUI_triangle_"+triangle.id;
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Triangle ID : "+triangle.id + " Perimiter : "+ triangle.perimiter().toFixed(0) + " Area : " + triangle.area().toFixed(0);
            menuItem.appendChild(el);
            menuItem.appendChild(p1);
            menuItem.appendChild(p2);
            menuItem.appendChild(p3);
            addMenuElement(menuItem);
        },
        rectangle : function(rectangle){
            var p1 = primitiveUI.vec(rectangle.top.p1,"P1");
            var p2 = primitiveUI.vec(rectangle.top.p2,"P2");
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            menuItem.id = "primitiveUI_rectangle_"+rectangle.id;
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Rectangle ID : "+rectangle.id + " Width : "+ rectangle.width().toFixed(0) + " Height : " + rectangle.height().toFixed(0) +" Aspect : " + rectangle.aspect.toFixed(3)+ " Perimeter : " + rectangle.perimiter().toFixed(0) + " Area : " + rectangle.area().toFixed(0);
            menuItem.appendChild(el);
            menuItem.appendChild(p1);
            menuItem.appendChild(p2);
            addMenuElement(menuItem);
        },
        circle : function(circle){
            var p1 = primitiveUI.vec(circle.center,"Center");
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            menuItem.id = "primitiveUI_circle_"+circle.id;
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Circle ID : "+circle.id + " Radius : "+ circle.radius.toFixed(0) + " Circumference : " + circle.circumference().toFixed(0) +" area : " + circle.area().toFixed(0);
            menuItem.appendChild(el);
            menuItem.appendChild(p1);
            addMenuElement(menuItem);
        },
        arc : function(arc){
            var p1 = primitiveUI.vec(arc.circle.center,"Center");
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            menuItem.id = "primitiveUI_arc_"+arc.id;
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Arc ID : "+arc.id + " Radius : "+ arc.circle.radius.toFixed(0) + " Start : " + (arc.start*180/Math.PI).toFixed(0) +" End : " + (arc.end*180/Math.PI).toFixed(0) + " Arc length : " + (arc.arcLength()*180/Math.PI).toFixed(0) ; 
            menuItem.appendChild(el);
            menuItem.appendChild(p1);
            addMenuElement(menuItem);
        },
        bezier :function(bezier){
            var p1 = primitiveUI.vec(bezier.p1,"Start");
            var p2 = primitiveUI.vec(bezier.p2,"End");
            var cp1 = primitiveUI.vec(bezier.cp1,"Control 1");
            if(bezier.cp2 !== undefined){
                var cp2 = primitiveUI.vec(bezier.cp2,"Control 2");
            }
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            menuItem.id = "primitiveUI_Bezier_"+bezier.id;
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Bezier ID : "+bezier.id + " "+ (bezier.isCubic()?"Cubic":"Quadratic"); 
            el.textContent += " Length : "+ bezier.leng().toFixed(0);
            menuItem.appendChild(el);
            menuItem.appendChild(p1);
            menuItem.appendChild(cp1);
            if(cp2 !== undefined){
                menuItem.appendChild(cp2);
            }
            menuItem.appendChild(p2);
            addMenuElement(menuItem);
        },            
    }
        
    function displaySelected(){
        objects.selected.each(function(prim){
            var type = prim.type.toLowerCase();
            if(typeof primitiveMenu[type] === "function"){
                primitiveMenu[type](prim);
            }
        });
            
            


    }    
            
    function initCreationMenu(grooverGeom, objectArray){
        GG = grooverGeom;
        objects = objectArray;
        addMenuItem("creation-UI",menuDetails,createMenuClicked);
    }
    return {
       start : initCreationMenu,
       displayPrimitives : displaySelected,
    }
    
})();