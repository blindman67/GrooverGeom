var createImage = function (w, h) {
    var i = document.createElement("canvas");
    i.width = w;
    i.height = h;
    i.ctx = i.getContext("2d");
    return i;
}

var drawGrid = function(image,main,minor,backCol,lineCol){
    var c = image.ctx;
    var w = image.width;
    var h = image.height;
    
    c.fillStyle = backCol;
    c.fillRect(0,0,w,h);
    var step = w / minor;
    c.globalAlpha = 0.5;
    c.beginPath();
    for( y = 0; y <= h; y += step){
        c.moveTo(0,y);
        c.lineTo(w,y);
    }
    for( x = 0; x <= w; x += step){
        c.moveTo(x,0);
        c.lineTo(x,h);
    }
    c.stroke();        
    var step = w / main;
    c.globalAlpha = 1;
    c.beginPath();
    for( y = 0; y <= h; y += step){
        c.moveTo(0,y);
        c.lineTo(w,y);
    }
    for( x = 0; x <= w; x += step){
        c.moveTo(x,0);
        c.lineTo(x,h);
    }
    c.stroke();        
    c.lineWidth = 2;
    c.moveTo(w / 2, 0);
    c.lineTo(w / 2, h);
    c.moveTo(0, h / 2);
    c.lineTo(0, h / 2);
    c.stroke();        
    return image;
    
}