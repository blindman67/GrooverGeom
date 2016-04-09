"use strict";
var currentID = 0;
var $ID = function(){
    currentID += 1;
    return currentID;
}
var $ = function(selector){  // Query for CSS selector
    if(typeof selector === "string"){
        return document.querySelector(selector);
    }
    return null;
}
var $R = function(id,element){  // Remove by ID from element or document
    if(typeof selector === "string"){
        selector = $(selector);        
    }
    if(selector !== null){
        if(element !== undefined){
            element.removeChild(selector);
            return;
        }
        document.body.removeChild(selector);
    }
}
var $A = function(element,element1){  // Append element to document or element1 to element
    if(element1 !== undefined){
        element.appendChild(element1);
        return element1;
    }
    document.body.appendChild(element);
    return element;
}
var $C = function(type,className,id){ // creat element optional add classname and or id
    var e;
    e = document.createElement(type);
    if(className !== undefined){
        e.className = className;
    }
    if(id !== undefined){
        e.id = id;
    }
    return e;
}
var $TN = function(tagName){           // get elements by tag name
    return document.getElementsByTagName(tagName);
}

function addCheckBoxes(items,element,action){
    var elements = [];
    if(typeof element === "string"){
        element = $(element);
    }
    if(element !== null){
        items.forEach(function(item){
            var div = $C("div");
            var t = $C("span");
            t.innerHTML += item;
            var cb = $C("input","exampleCB","checkBox_"+$ID()+item.replace(/ /g,"-"));
            cb.type = "checkbox";
            cb.checked = true;
            cb.value = item.replace(/ /g,"_");
            elements.push(cb);
            $A(div,cb);
            $A(div,t);
            $A(element,div);
        });
        if(typeof action === "function"){
            elements.forEach(function(checkbox){
                checkbox.addEventListener("change",action);
                console.log("ASS");
                               
            });
        }
    }
    return elements;
}

function addRadioGroup(items,element,group,selected,action){
    var elements = [];
    if(typeof element === "string"){
        element = $(element);
    }
    if(typeof group !== "string"){
        group = "radioGroup"+$ID;
        
    }
    if(element !== null){
        items.forEach(function(item){
            var rb = $C("input","exampleRB","radioButton_"+$ID()+item);
            rb.type = "radio";
            rb.value = item;
            rb.name = group;
            if(item === selected){
                rb.checked = true;                
            }
            if(typeof action === "function"){
                rb.addEventListener("change",action);
            }
            elements.push(rb);
            $A(element,rb);
            var t = $C("span");
            t.textContent = item;
            $A(element,t);
        });
    }
    return elements;
}
// helper function that begins a new path and sets fill storke and line width
var beginStyle = function(col,col1,width) {
    if(col !== undefined && col !== null) { ctx.fillStyle = col;}
    if(col1 !== undefined && col1 !== null) { ctx.strokeStyle = col1;}
    if(width !== undefined && width !== null) { ctx.lineWidth = width;}
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
    if(align !== undefined && align !== null){ ctx.textAlign = align;}
    if(alignH !== undefined && alignH !== null){ ctx.textBaseline = alignH;}
    if(col !== undefined && col !== null){ ctx.fillStyle = col;}
    ctx.beginPath();
}



    // set up GrooverGeom.    
