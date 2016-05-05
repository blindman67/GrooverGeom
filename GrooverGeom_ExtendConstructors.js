"use strict";

groover.geom.Geom.prototype.addConstructors = function(){
    var geom; 
    geom = this;
    
    this.extentions.constructions = {   // add extentions 
        functions : [],
        info : "Provides methods to customise primitive construction"
    }; 
    var utilityFunctions = {
        hasIdConstruction : function(id){
            var i;
            if(!this.constructedWith.hasId(id)){
                for(i = 0; i < this.constructedWith.primitives.length; i ++){
                    if(this.constructedWith.primitives[i].hasId(id)){
                        return true;
                    }
                }
                return false;
            }
            return true;
        },
        getAllIdsAsArrayConstruction : function(array){
            var i;
            this.constructedWith.getAllIdsAsArray(array);
            for(i = 0; i < this.constructedWith.primitives.length; i ++){
                this.constructedWith.primitives[i].getAllIdsAsArray(array);
            }
            return array;
        },
    }
          
    var functions = {
        hasConstructor : function(){
            if(this.constructedWith !== undefined){
                return true;
            }
            return false;
        },
        addConstructor : function(construction){
            this.constructedWith = construction;
            construction.hasId = this.hasId.bind(this);
            construction.getAllIdsAsArray = this.getAllIdsAsArray.bind(this);
            construction.create = construction.create.bind(this);
            this.hasId = utilityFunctions.hasIdConstruction.bind(this);
            this.getAllIdsAsArray = utilityFunctions.getAllIdsAsArrayConstruction.bind(this);
            return this;
        },
        recreate : function(){
            if(this.constructedWith !== undefined && typeof this.constructedWith.create === "function"){
                this.constructedWith.create();
            }
            return this;
        },
        removeConstructor : function(){
            var cw = this.constructedWith;
            this.hasId = cw.hasId.bind(this);
            this.getAllIdsAsArray = cw.getAllIdsAsArray.bind(this);
            this.constructedWith = undefined;
            return this;
        }    
    }
    for(var i in functions){
        this.extentions.constructions.functions.push(i);   
    }
    for(var j = 0; j < this.primitiveTypes.length; j ++){
        if(geom[this.primitiveTypes[j]]){
            var proto = geom[this.primitiveTypes[j]].prototype;
            for(var i in functions){
                proto[i] = functions[i];
            }
        }
    }
    geom.Geom.prototype.createConstructor = function(primitives,constructingFunction){
        var obj = {
            primitives : primitives,
            create : constructingFunction,
        }
        return obj;
    }
    console.log("Groover.Geom.extentions.constructions installed");
}
console.log("Groover.Geom Constructors extension parsed.");