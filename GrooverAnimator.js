"use strict"
function Animator(){
    const F60 = 1000/60;
    var curves = {
        linear : function(val,pow){
            return Math.min(1,Math.max(0,val));
        },
        easeInOut = function (val, pow) {
            var xx = Math.pow(Math.min(1, Math.max(0, val)), pow);
            return xx / (xx + Math.pow(1 - val, pow));
        }
    }
    
    
    function Key(time,value,inFunc,outFunc){
        this.time = time;
        this.value = value;
        this.inFunc = inFunc === undefined || inFunc === null ? curves.linear : inFunc;
        this.outFunc = outFunc === undefined || outFunc === null ? curves.linear : inFunc;
    }
    function KeyArray(){
        
    }
    function KeyFrames(){
        
        
    }
    
    Key.prototype = {
        time : 0,
        value : 0,
        inFunc : undefined,
        outFunc : undefined,
        
    }
    KeyArray.prototype = {
        startTime : 0,
        endTime : 0,
        rate : 1,
        values : [],
        
        
    }
    KeyFrames.prototype = {
        channels : {},
        createChannel : function(name){
            var channel = channels[name];
            if(channel === undefined){
                channel = {};
            }
            channel.keys = {};
        }
    }
    
    
}