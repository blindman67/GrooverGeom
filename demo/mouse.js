"use strict";
// same mouse interface as used by ExtendUI but do not want to remove that and to reflex normal 
// usage Geom is not to provide a generic mouse interface
var mouseInterface = (function(){
    function preventDefault(e) { e.preventDefault(); }
    var interfaceId = 0;
    var i;
    var customCursors = {
        add :    "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACMAAAAYCAYAAABwZEQ3AAABzElEQVRIicWWX0tCQRDFf6BYJmgP+TcwSiy7FfRgZlqgBPX9P9HtYWdxHO/euzdRB4aVo+6ePXN2dqE4KipPGjWgDjRkrJ2KyBnQBNpAV8am4EeNmiycqhwBA8GPplAVV5I2kKZp6sm8CqG2fF89NBHvkRZOBU1mDiSCtziwh7RHBjgVNJkvNuoMOKCHsjySGjI2D+KhCsYjRUHYQxV2+5LFcvtVBddHuhm7z1NmBjwCfZw6vh/5rKu0eLC0WpmR7HiO84gm8wOsBV8AbzhD38hGukBPyPXY9CaLd4BL4CJEyHvGGzcRUprMGvgApkahJKDcJICPgSFwJUplRsxpmmJ8hSpnCfwFuBNCuQpt9RmVCz151mdLIA8XQkNcyYIe0h3Ye2iG88iOoTMW/Y3BZc4xzkN1ck6Z9dAj4o3QUTdGL8Rx/ktwpm7kkYFtD/WB20hlYstUioxXyHvoukgBq1YOvqJEmXRUhXlPKyIThhpiCnwH8JWoEmVgG1lNcSY5Bd5xJ+1T5VIWnMu4lFzI/6KOdiisoSfAPU7mB1ztn4BnGRP5jc9E4VFNryjsM7QjE3bYtHufe10HsWEf6OfsXoR7XZRlI+aJ8K8nxB+sHLGQMpxpsgAAAABJRU5ErkJggg==') 8 8, pointer",
        remove : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAACwAAAAUCAYAAAD2rd/BAAABuUlEQVRIicWXbUtCMRTHf6AoFlyEusrV3hRi+BBRRFk+VFRC3/8D2Ysdce5u8yxFB4dzx862/87+Z+dcKLdKgpy81YAGcK6QhtifrNWBDMiBAuhEpBC7TOYdvdVk81WC9DDgM47s6QrmenNgpWkC+FFAt4AzoEqc47tiQR0nFQwn26R5+AUYYrzcxM/xNV3qhGOjYYkqTmwP98Rzr8AMmFuyAN6BD/meAGPgBuhS5nhLDpKJblGOjUIclYsuUMbJmsMdAT0E7hy5T7yBPnANXO2wG0TGonESeyW64kkvn3192fDB7ofsQuNs4iTHsKDE6dA73BTQ9mI+gFsb+7412pKJ3EBbcASD0JaqGHdigGMHSdHWOt+YWLrF8N/r4dABtgD7rtYH+D8HsOZ+Ac8YSlyQkKBKgEOe9vR/NQAjlDgcYOXGy5idbz1nfC9KFM7pf5y+Tz4jY0vFfFXQ+QD7Esub6CkmySwcmWKy4ZPoKZsENJN+aP5c1t/5rIWam1gGjowpJ5oR5jr7okfW2Fg5f68Cy04sbcIp1U27lx6bWEo+aAlrJ5ZY0aItbDTz9y5dtWWhtnRM+g37A/SOJQU/LgzQAAAAAElFTkSuQmCC') 8 5, pointer",
        rotate : "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABsAAAARCAYAAAAsT9czAAABWElEQVQ4ja2V20rDQBCGP3JR0pI0ltJTlBIrWi0mUClW8f2fSy/yrxk2m7RBB4btbv5DdjK7hWERBfLP4YtEwAiIgbHJWOsh/FUxMunmE2AKzIEFsNQ41/rEw1t+Z8RAAmQaE4ktge9A3gN3ej41HMeP+4wyieTKlRMOhTF9kOnK8NfSaxmOgNSJirD3TeyuAusvHn8HbKT7W9JI7nMr4v9WfgBn4N03DeBLoJBuLB8i6s5ahMol4qcMjsArcNB47OG8AY/SHftmy47yfMmoFHmrb7LVvOzgnYAn6V42897yGbgFZvoOM827OL1mwTIa8l47SvUN0gv4zjK6Bilsx5l0O8tp2jnTPIQ/A1WoQaBp/VxvU8ngpLGkbuU1zWFNNN/pucVX0nGVaN0mMXAjQCGwy4L6zNhD6na36cDn0uu9RVLCd2AaIA7Ft6Lvdv8PfCuG/m9dhf8BJ+ccqa7A1i0AAAAASUVORK5CYII=') 12 4, pointer",
    }
    return function(){
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
            return mouse;
        }
        mouse.releaseCursor = function(){
            this.requestedCursor = "default";
            mouse.updateCursor();
            return mouse;
        }        
        mouse.addCallback = function(callback){
            if(typeof callback === "function"){
                if(mouse.callbacks === undefined){
                    mouse.callbacks = [callback];
                }else{
                    mouse.callbacks.push(callback);
                }
            }
            return mouse;
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
            return mouse;
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
            return mouse;
        }
        return mouse;
    }    
})();    