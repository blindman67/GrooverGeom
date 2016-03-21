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