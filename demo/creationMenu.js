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
                                                                      
                                }else{
                                    return;
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
                                }else{
                                    return;
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
        round : {
            clicked : function(){
                var v1,v2,v3,l1,l2;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();
                while(v1 !== undefined && v2 !== undefined && v3 !== undefined){            
                    var arr = objects.all.collectIdsAsPrimitiveArray(v2.id);
                    l1 = arr.firstAs("Line");
                    l2 = arr.nextAs("Line");
                    if(l1 !== undefined && l2 !== undefined){
                        var arc = A(C(V(0,0),100),0,1).makeUnique();
                        var ll1 = L(l1.p1,l1.p2);
                        var ll2 = L(l2.p1,l2.p2);
                        var vv1,vv2;
                        if(l1.p1.id === v2.id){
                            l1.p1 = v1;
                        }else{
                            l1.p2 = v1;
                        }
                        if(l2.p1.id === v2.id){
                            l2.p1 = v3;
                        }else{
                            l2.p2 = v3
                        }
                        objects.all.push(arc);
                        arc.hashs = {radius : null,h1:undefined,h2:undefined,h3:undefined};
                        arc.addConstructor(
                            GG.createConstructor(
                                [v2,ll1,ll2,v1,v3],
                                function(){
                                    var cw = this.constructedWith;
                                    var p = cw.primitives;
                                    var h1,h2,h3;
                                    h1 = p[0].getHash()+p[1].getHash()+p[2].getHash();
                                    h2 = p[3].getHash();
                                    h3 = p[4].getHash();
                                    if(this.hashs.radius === null){
                                        this.hashs.radius = (p[0].distFrom(p[3]) + p[0].distFrom(p[4]))/2;
                                        this.circle.radius = this.hashs.radius;
                                        this.fitCornerConstrain(p[1],p[2],true,"limitminhalf");
                                        this.startAsVec(p[3]);
                                        this.endAsVec(p[4]);
                                    }else
                                    if(h1 !== this.hashs.h1){
                                        this.fitCornerConstrain(p[1],p[2],true,"limitminhalf");
                                        this.startAsVec(p[3]);
                                        this.endAsVec(p[4]);                                        
                                    }else
                                    if(h2 !== this.hashs.h2){
                                        this.hashs.radius = this.circle.center.distFrom(p[3]);
                                        this.circle.radius = this.hashs.radius;
                                        this.fitCornerConstrain(p[1],p[2],true,"limitminhalf");
                                        this.startAsVec(p[3]);
                                        this.endAsVec(p[4]);
                                        
                                    }else
                                    if(h3 !== this.hashs.h3){
                                        this.hashs.radius = this.circle.center.distFrom(p[4]);
                                        this.circle.radius = this.hashs.radius;
                                        this.fitCornerConstrain(p[1],p[2],true,"limitminhalf");
                                        this.startAsVec(p[3]);
                                        this.endAsVec(p[4]);
                                        
                                    }else{
                                        return;
                                    }
                                    this.hashs.h1 = p[0].getHash()+p[1].getHash()+p[2].getHash();;
                                    this.hashs.h2 = p[3].getHash();
                                    this.hashs.h3 = p[4].getHash();
                                }
                            )
                        );                         
                    }
                    v1 = GG.ui.selected.next();               
                    v2 = GG.ui.selected.next();               
                    v3 = GG.ui.selected.next();               
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 0){
                    return true;
                }
                return false;
            }
        },
        roundc : {
            clicked : function(){
                var v1,l1,l2;
                v1 = GG.ui.selected.first();
                while(v1 !== undefined){            
                    var arr = objects.all.collectIdsAsPrimitiveArray(v1.id);
                    l1 = arr.firstAs("Line");
                    l2 = arr.nextAs("Line");
                    if(l1 !== undefined && l2 !== undefined){
                        var arc = A(C(V(0,0),10),0,1).makeUnique();
                        var ll1 = L(l1.p1,l1.p2);
                        var ll2 = L(l2.p1,l2.p2);
                        var vv1,vv2;
                        if(l1.p1.id === v1.id){
                            l1.p1 = l1.p1.copy();
                            vv1 = l1.p1;
                        }else{
                            l1.p2 = l1.p2.copy();
                            vv1 = l1.p2;
                        }
                        if(l2.p1.id === v1.id){
                            l2.p1 = l2.p1.copy();
                            vv2 = l2.p1;
                            
                        }else{
                            l2.p2 = l2.p2.copy();
                            vv2 = l2.p2;

                        }
                        objects.all.push(arc);
                        arc.addConstructor(
                            GG.createConstructor(
                                [v1,ll1,ll2,vv1,vv2],
                                function(){
                                    var cw = this.constructedWith;
                                    var p = cw.primitives;
                                    this.circle.radius = 30;
                                    this.fitCornerConstrain(p[1],p[2],true,"limitminhalf");
                                    this.startAsVec(vv1);
                                    this.endAsVec(vv2);
                                }
                            )
                        );                         
                    }
                    v1 = GG.ui.selected.next();               
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 0){
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
                                        
                                }else{
                                    return;
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
        snapto : {
            clicked : function(){
                var v1,v2,v3;
                v1 = GG.ui.selected.first();
                while(v1 !== undefined){
                    var prim = objects.all.getClosestPrimitiveToVec(v1,["Line","Arc","Circle","Triangle","Bezier"]);
                    if(prim !== undefined){
                        objects.all.push(v1);
                        v1.hashs = {u : null, h1 : null, h2 : null},
                        v1.addConstructor(
                            GG.createConstructor(
                                [prim],
                                function(){
                                    var cw = this.constructedWith;
                                    var p = cw.primitives;
                                    var h1 = this.getHash(); // this vec
                                    var h2 = p[0].getHash(); // the prim
                                    if(this.hashs.u === null){
                                        this.hashs.u = p[0].unitDistOfClosestPoint(this);
                                        p[0].unitAlong(this.hashs.u, this);
                                    }else
                                    if(h1 !== this.hashs.h1){
                                        this.hashs.u = p[0].unitDistOfClosestPoint(this);
                                        p[0].unitAlong(this.hashs.u, this);                                        
                                    }else
                                    if(h2 !== this.hashs.h2){
                                        p[0].unitAlong(this.hashs.u, this);                                        
                                        
                                    }else{
                                        return;
                                    }
                                    this.hashs.h1 = this.getHash();
                                    this.hashs.h2 = p[0].getHash();
                                }
                            )
                        );                    
                        v1.recreate();           
                    }
                    v1 = GG.ui.selected.next();
                }
            },
            requisites : function(){
                if(GG.ui.selected.length > 0){
                    return true;
                }
                return false;
            } 
            
            
        },
        bezier2at : {
            clicked : function(){
                var v1,v2,v3;
                v1 = GG.ui.selected.first();
                v2 = GG.ui.selected.next();
                v3 = GG.ui.selected.next();

                while(v1 !== undefined && v2 !== undefined && v3 !== undefined){

                    var bez = B(v1,v3,V(0,0),null).makeUnique();
                    objects.all.push(bez);
                    bez.addConstructor(
                        GG.createConstructor(
                            [v2],
                            function(){
                                var cw = this.constructedWith;
                                var p = cw.primitives;
                                this.fitPointCenter(p[0]);
                            }
                        )
                    );                    
                    bez.recreate();           
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
        { type : "button", text : "Round" , help : "Creates a rounded corner from three points. First on in coming line, 2nd at corner, and 3rd on outgoing line line attached to the selected point. Requires 3 points."},
        { type : "button", text : "RoundC" , help : "Creates a rounded corner from line attached to the selected point. Requires 1+ points attached to lines."},
        { type : "button", text : "Bezier2" , help : "Creates a simple Quadratic bezier. Requires 3 points."},
        { type : "button", text : "Bezier2At" , help : "Creates a simple Quadratic bezier with a control point on the curve. Requires 3 points."},
        { type : "button", text : "Bezier3" , help : "Creates a simple Cubic bezier. Requires 4 points."},
        { type : "button", text : "SnapTo" , help : "Snaps the point onto the closest path at creation time."},
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
            var span, id, x, y;
            span = createElement("span",{id : "vec", className : "uiPrimitive snug show"});
            if(vec.id === undefined){
                id = createElement("span",{text : extra ,id : "primID", className : "uiPrimitivePropertyName snug"});
            }else{
                id = createElement("span",{text : extra + " Vec ID : "+vec.id ,id : "primID", className : "uiPrimitivePropertyName snug"});
            }
            x = createElement("span",{text : "X : "+vec.x.toFixed(1) ,id : "vecX", className : "uiPrimitivePropertyName snug"});
            y = createElement("span",{text : "Y : "+vec.y.toFixed(1) ,id : "vecY", className : "uiPrimitivePropertyName snug"});
            span.appendChild(id);
            span.appendChild(x);
            span.appendChild(y);
            span.appendChild(document.createElement("br"));
            return span;
        }
    }        
    var primitiveMenu = {
        createMenuItem : function(primitive, childNodes){
            var i,len;
            var menuItem = document.createElement("div");
            menuItem.className = "uiGroup";
            var type = primitive.type[0].toLowerCase() + primitive.type.substr(1);
            menuItem.id = "primitiveUI_"+type+"_"+primitive.id;
            menuItem.appendChild(createOpenCloseButton(true));
            len = childNodes.length;
            for(i = 0; i < len; i ++){
                menuItem.appendChild(childNodes[i]);
            }
            return menuItem;
        },
        vec : function(vec){
            var p = primitiveUI.vec(vec);
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "Vec";
            addMenuElement(this.createMenuItem(vec, [el, p]), "Vecs");
        },
        line : function(line){
            var p1 = primitiveUI.vec(line.p1,"Start");
            var p2 = primitiveUI.vec(line.p2,"End");
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "ID : "+line.id + " Leng : "+ line.leng().toFixed(0) + " Dir : " + (line.dir()*180/Math.PI).toFixed(0);
            addMenuElement(this.createMenuItem(line, [el, p1, p2]), "Lines");
        },
        triangle : function(triangle){
            var p1 = primitiveUI.vec(triangle.p1,"P1");
            var p2 = primitiveUI.vec(triangle.p2,"P2");
            var p3 = primitiveUI.vec(triangle.p3,"P3");
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "ID : "+triangle.id + " P : "+ triangle.perimiter().toFixed(0) + " A : " + triangle.area().toFixed(0);
            addMenuElement(this.createMenuItem(triangle, [el, p1, p2, p3]), "Triangles");
        },
        rectangle : function(rectangle){
            var p1 = primitiveUI.vec(rectangle.top.p1,"P1");
            var p2 = primitiveUI.vec(rectangle.top.p2,"P2");
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "ID : "+rectangle.id + " W : "+ rectangle.width().toFixed(0) + " H : " + rectangle.height().toFixed(0) +" A% : " + rectangle.aspect.toFixed(3)+ " P : " + rectangle.perimiter().toFixed(0) + " A : " + rectangle.area().toFixed(0);
            addMenuElement(this.createMenuItem(rectangle, [el, p1, p2]), "Rectangles");
        },
        circle : function(circle){
            var p1 = primitiveUI.vec(circle.center,"Center");
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "ID : "+circle.id + " R : "+ circle.radius.toFixed(0) + " C : " + circle.circumference().toFixed(0) +" A : " + circle.area().toFixed(0);
            el.title = "R is radius, C is circumference, A is area.";
            addMenuElement(this.createMenuItem(circle, [el, p1]), "Circles");
        },
        arc : function(arc){
            var p1 = primitiveUI.vec(arc.circle.center,"Center");
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "ID : "+arc.id + " R : "+ arc.circle.radius.toFixed(0) + " S : " + (arc.start*180/Math.PI).toFixed(0) +" E : " + (arc.end*180/Math.PI).toFixed(0) + " Leng : " + (arc.arcLength()*180/Math.PI).toFixed(0) ; 
            el.title = "R is radius, S start angle, E end angle";
            addMenuElement(this.createMenuItem(arc, [el, p1]), "Arcs");
            
        },
        bezier :function(bezier){
            var p1 = primitiveUI.vec(bezier.p1,"Start");
            var p2 = primitiveUI.vec(bezier.p2,"End");
            var cp1 = primitiveUI.vec(bezier.cp1,"Control 1");
            if(bezier.cp2 !== undefined){
                var cp2 = primitiveUI.vec(bezier.cp2,"Control 2");
            }            
            var el = document.createElement("span");
            el.className = "uiGroupName";
            el.textContent = "ID : "+bezier.id + " "+ (bezier.isCubic()?"Cubic":"Quadratic"); 
            el.textContent += " Length : "+ bezier.leng().toFixed(0);
            if(cp2 !== undefined){
                addMenuElement(this.createMenuItem(rectangle, [el, p1, cp1, cp2, p2]), "Beziers");
            }else{
                addMenuElement(this.createMenuItem(rectangle, [el, p1, cp1, p2]), "Beziers");
            }
        },            
    }        
    function displaySelected(){
        clearPrimitiveHighlight("highlight");
        objects.selected.each(function(prim){
            var type = prim.type.toLowerCase();
            if(typeof primitiveMenu[type] === "function"){
                primitiveMenu[type](prim);
                primitiveHighlight(prim.type,prim.id,"highlight");
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