
var canvasMouseCallBack = undefined;  // if needed
var mouse = (function(){
    var mouse = {
        x : 0, y : 0, w : 0, alt : false, shift : false, ctrl : false,
        interfaceId : 0, buttonLastRaw : 0,  buttonRaw : 0,
        over : false,  // mouse is over the element
        bm : [1, 2, 4, 6, 5, 3], // masks for setting and clearing button raw bits;
        getInterfaceId : function () { return this.interfaceId++; }, // For UI functions
        startMouse:undefined,
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
        if (canvasMouseCallBack) { canvasMouseCallBack(mouse); }
        e.preventDefault();
    }
    function startMouse(element){
        if(element === undefined){
            element = document;
        }
        mouse.element = element;
        mouse.mouseEvents.forEach(
            function(n){
                element.addEventListener(n, mouseMove);
            }
        );
        element.addEventListener("contextmenu", function (e) {e.preventDefault();}, false);
    }
    mouse.removeMouse = function(){
        if(mouse.element !== undefined){
            mouse.mouseEvents.forEach(
                function(n){
                    mouse.element.removeEventListener(n, mouseMove);
                }
            );
            canvasMouseCallBack = undefined;
        }
    }
    mouse.startMouse = startMouse;
    return mouse;
})();
