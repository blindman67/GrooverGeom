###GrooverGeom.

##This is a work in progress 

groover.Geom is designed to provide as complete set of 2D geometry functions as possible and is based and some standardised primitives.


Because some functions are not yet complete (and there are many functions) to cover missing function results a return of undefined means code not complete unless otherwise noted in the source code.

The basic primitives

Vector. 
Line.
Trinagle.
Rectangle.
Box (this is a bounding box and not the same as rectangle)
Circle.
Arc.
Transform.

Extras
VecArray. an array of vectors.
PrimitiveArray. an aray of primitives.

Experiments
Helpers
Animation

Extensions
I have included some extensions for more complex geometry (shapes) and rendering (render)
The list of extensions is growing
Render, for rendering to the 2D canvas context, adds the following functions to primitives
    moveTo // move to the start
    lineTo // line to start
    draw  // adds the primitive to the current path
    lable // lables the primitive with text
    mark // marks the primitve at its defing vecs
shapes, for complex shapes made of groups of primitive. polygon, roundedPill, roundedPath
UI, Simple UI interface for selecting and moving points. Will be a full UI for all primitives when done.
SVG, For SVG (currently just a stub) adds the following functions to primitives
   toSVG    // returns a string representation of the primitive as SVG
   toSVGPath  // returns a string representation of the primitive as a SVG path
   fromSVG  // set the primitive to conform to the supplied SVG


An important aim of this code is speed I do this via duplication and what will seem a very unstructured approch.

For example a vector is two coords 

```JavaScript
var vec = new groover.Vec(x,y);
```

to find the length

```JavaScript
var length = vec.leng(); // returns length.
```

the code

```JavaScript
... 
   leng : function(){
       return Math.hypot(x,y);
   }
```

In the OO approch to normalise the vector (dividing by its length) you would have

```JavaScript
   div : function(value){
       this.x /= value;
       this.y /= value;
       return this;
   },
   norm : function(){
       return this.div(this.leng());
   },
```   

So to normalise

```JavaScript
vec.norm();  
``` 

Noting to it untill you do this 1,000,000 times or more per second (as many animtions requier). Getting the normal requiers 3 function calls all of wich add cpu cycles for a very simple caculation. In some circumstances the time needed to call and return is longer than the time to caculate the result. 

Therefor internaly I do not take advantage of existing functionality and the the function norm is verbose

```JavaScript
    norm : function(){
        v1.x = Math.hypot(this.x,this.y); // avoids one call
        this.x /= v1.x; // avoid the second call
        this.y /= v1.x;
        return this;
    },
```

This method is wat faster than the OO way.

You may also notice that v1.x seams to be undeclared and what (TF) does x have to do with length. This is also an optimisation, for a small set of common values groover.Geom has closed (closure) over them. 

Currently I am calling these values groover.Geom.registers and they can be acessed though this name space.

This avoids a small amount of allocation per function call (minor optimistion) for the var declaration, but alows the internal code and users of this API to avoid needlessly recaculating values that have already been worked out.

For example an app may want the length as well as the normalised vector and you would do something like

```JavaScript
var len = vec.leng();
vec.norm();
```

This is all too common in OO designs where huge amounts of code is call over and over for information that has already been worked out. 
Internaly if I need the length I know where to get it rather than recaculate it. As a user of this API the documentation will also list all all details about these registers and what they hold and when they are valid.

So instead of calling two functions and near doubling the CPU load

```JavaScript
// important to get the optimisation.
var GG = groover.geom; // local scope the API
var regs = GG.registers; // local scope the registers referance

vec.norm();
var len = regs.leng;
```

Many will now say, that is everything about bad code design possible. For your own code that may be and you are not forced to use this approched you can still

```JavaScript
var len = vec.leng();
vec.norm();
```

The addition of the registers has not slowed this approch, (infact mostly the registers have improved the internal performance)

Groover.Geom will be totaly safe to use from a stritly OO desing (much more so than many similar APIs) with complete encapsulation of all access (when complete)

Additionaly 
Where possible all functions will be chainable,

```JavaScript
var line,lineLength,circle,circleArea;
lineLength = (line = new GG.Line(new GG.Vec(0,0), new GG.Vec(1000,1000))).leng();  // create a line and get its length
circleArea = (circle = new GG.Circle( new GG.Vec(500,500), 200)).area();  // create a circle and get its area
// assuming the render extentions have been activated
// mark and draw the circle, clip the line to the circle, mark the line (marks are vertex marks), move to start and add to current canvas context path then return its length
var len = circle.mark()
    .moveTo()
    .draw()
    .clipLine(line)
    .mark()
    .moveTo()
    .draw()
    .leng();
```


Where possible derived primitives that would normal be return as a new instance of the type will include an optionaly existing referance argument so that you do not have to needlessly allocate and invocke GC

For example the above code may want to clip and draw thousands of lines to the circle.

```JavaScript
var primArr = new GG.PrimitiveArray();
// populate with 10000 lines

// Now render lines clipped by circle
primArr.each(function(line){
    circle.clipLine(line).moveTo().draw();
});
```

This works fine but will create a new line with all the prototype chain for evry line only to be dumped when done. Not only pushing memory usage but incuring the totaly unprodictable JavaScript garbage colllector to sift through thousands of referances and slowing everything down.

A better way is to provide a referance varible to hold the result of the clip.

```JavaScript
var tempLine; // no need to create it as the first call to clipLine will do that
primArr.each(function(line){
    circle.clipLine(line, tempLine).moveTo().draw();
});
```

On th first call clip line creates a new line, but every other call will use that same line hugly inmproving the execution time, memory usage, and GC time

Well this is a work in progress, and who knows someone might give me a job but untill then I will continue to give this my time and with a little luck someone may find it usefull.






