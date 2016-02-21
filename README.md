### GrooverGeom

Work in progress.

## Warning Refactoring in progress
The document dose not fully reflect the current refactoring.

This is part of the Groover name space and can be located as groover.geom. 

You can also extend the object with render functions for rendering  on the 2D canvas context

Geom provides a wide range of functions to aid with 2D geometric objects.

Currently supporting the following primitives

### Primitives
- Vec
- VecArray
- Line
- Rectangle
- Circle
- Arc
- Box
- Transform 

All functions are chainable where posible

### Common Methods
All object implement the following

- type : A string with the name of the primitive. Eg Vec.type = "Vec";
- copy() : Creates a new copy of the primitive.
- setAs(obj) : Copy the the properties of obj to this primitive. Obj should be the same primitive.
- asBox(box) : Returns the bounding box of the primitive. Box is optional. If inclueded then the box will be extened if neeeded to bound this privitive.

### Render extentions
Extending the objects with render will add the following methods to all primitives (exluding Transform).

- moveTo() : moves the current path to the start of the primitive. For circles this is at 0 deg. For arcs this is the start of the sweap.
- lineTo() : adds a line to the start of the primitive.
- mark() : adds marks to the current path. See render docs for details.
- draw() : adds the primitive to the current path;

To extend geom with the render 

```JavaScript
groover.geom.addRender(ctx);  // context is optional
groover.geom.setCtx(ctx);     // sets the 2D contexts use to draw primmitives to.
groover.geom.setSize(number); // sets the size of marks in pixels
groover.geom.setMarkShape("circle"); // sets the type of mark used when calling geom.primitive.mark();
```
Current avialibe shapes for marks
- circle 
- tri (triangle)
- square 
- cross
- crossDiag 
- vecArray  Use groover.geom.setMarkShape(VecArray) to set the shape to a vecArray. It also set it as the current shape

You can also create your own shape by setting groover.geom.mark to a function that takes the argument Vec and you can access the current 2d context via groover.geom.ctx or you can add the function to groover.geom.marks

Example Adding a marker type
```JavaScript
//Adding a dash
groover.geom.marks.dash = function(vec){
    groover.geom.ctx.moveTo(vec.x - groover.geom.size/2, vec.y - groover.geom.size/2);
    groover.geom.ctx.lineTo(vec.x + groover.geom.size/2, vec.y + groover.geom.size/2);
}
// to use dash
groover.geom.setMarkShape("dash");
// all calls to mark will now use dash.
ctx.strokeStyle = "red";
ctx.lineWidth = 2;
ctx.beginePath();
groover.geom.setCtx(ctx);
groover.geom.setSize(8);
new groover.geom.Vec(100,100).mark();
ctx.stroke();
```

### Geom usage examples

Create a two circles and find the arc from the second circle that intercepts the first;

```JavaScript
var geom = groover.geom;
var circle1 = new geom.Circle(new geom.Vec(100,100), 200);
var circle2 = new geom.Circle(new geom.Vec(200,200), 200);
// get the arc that is inside circle1
var arc = new geom.Arc(circle2.copy(), 0 , 0).fromCircleIntercept(circle1).towards(circle1.p);
// get the arc that is outside circle1
var arc1 = arc.copy().away(circle1.p);
```

To render the circle and arc

```JavaScript
geom.setCtx(ctx);          // set the context for geom to draw to
ctx.strokeStyle = "black"; // set stroke style
ctx.lineWidth = 1;
ctx.beginPath();
circle1.moveTo();          // move path to the start of the circle
circle1.draw();            // add the circle to the current ctx path
arc.moveTo();              // move to the start of the inner arc
arc.draw();                // add the arc to the current ctx path
ctx.stroke();              // render the path
```


To get the area of the union of the two circles

```JavaScript
// get the area of first slice
var arcArea = new geom.Arc(circle2.copy(), 0 , 0)  // create arc from circle 2
        .fromCircleIntercept(circle1)              // get the intercept with circle 1
        .towards(circle1.p)                        // arc towards circle 1
        .areaOfSlice();                            // get the area of the slice
        
// add the area of second slice        
arcArea += new geom.Arc(circle1.copy(), 0 , 0)     // create arc from circle 1
        .fromCircleIntercept(circle2)              // get the intercept with circle 2
        .towards(circle2.p)                        // arc towards circle 2
        .areaOfSlice();                            // get area of slice
```


To get the bounding box 
```JavaScript
// get the area of first slice
var box = new geom.Arc(circle2.copy(), 0 , 0)      // create arc from circle 2
        .fromCircleIntercept(circle1)              // get the intercept with circle 1
        .towards(circle1.p)                        // arc towards circle 1
        .asBox();                                  // create a bounding box

new geom.Arc(circle2.copy(), 0 , 0)                // create arc from circle 2
        .fromCircleIntercept(circle1)              // get the intercept with circle 1
        .towards(circle1.p)                        // arc towards circle 1
        .asBox(box);                               // Extend the bounding box to inclued the second arc
        
// get the top left as a vec
var topLeft = new geom.Vec(box.l,box.t);
// get the bottom right as vec
var bottomRight = new geom.Vec(box.r,box.b);

        
```




## Primitives 
### Vec
    2D point.

Properties    
- Vec.x = Number
- Vec.y = Number
- Vec.type = 'Vec'

Functions
- Vec.copy()
- Vec.setAs(v)
- Vec.asBox()
- Vec.add(v)
- Vec.sub(v)
- Vec.mult(m)
- Vec.div(m)
- Vec.rev() 
- Vec.r90()
- Vec.rN90()
- Vec.r180()
- Vec.half()
- Vec.setLeng(len)
- Vec.setDir(dir)
- Vec.rotate(ang)
- Vec.leng()
- Vec.leng2()
- Vec.dir()
- Vec.mid(v)
- Vec.norm()
- Vec.dot(v)
- Vec.cross(v)
- Vec.dotNorm(v)
- Vec.crossNorm(v)
- Vec.angleBetween(v)
- Vec.distFrom(vec)
- Vec.angleTo(vec)

Render Extention 
- Vec.moveTo()
- Vec.lineTo()
- Vec.mark()
- Vec.draw()


### Box

Properties    
- Box.t = Number
- Box.b = Number
- Box.l = Number
- Box.r = Number
- Box.type = 'Box'

Functions
- Box.copy()
- Box.setAs(box)
- Box.asRectange() 
- Box.normalise()
- Box.max() 
- Box.irrate() 
- Box.env( x, y)
- Box.envBox(box)
- Box.envelop(obj)

Currently missing render

### Line

Properties
- Line.p1 = Vec
- Line.p2 = Vec
- Line.type = 'Line'

Functions    
- Line.copy()
- Line.setAs(line)
- Line.swap()
- Line.reverse()
- Line.asVec()
- Line.asVecArray()
- Line.asBox()
- Line.leng()
- Line.dir()
- Line.extend(factor)
- Line.setLeng(len)
- Line.setDir(num)
- Line.cross()
- Line.crossBack()
- Line.mult(num)
- Line.add(vec)
- Line.translate(vec)
- Line.rotate(num)
- Line.scale(num)
- Line.midPoint()
- Line.unitAlong( unitDist)
- Line.distanceAlong( dist) 
- Line.angleBetween(line)
- Line.angleFromNormal(line)
- Line.setTransformToLine(ctx)
- Line.intercept(l2)
- Line.distFrom(p)
- Line.distFromDir(p) 
- Line.lineTo() 
- Line.getDistOfPoint(vec)
- Line.getUnitDistOfPoint(vec)
- Line.getDistOfPointSafe(vec)
- Line.getUnitDistOfPointSafe(vec)
- Line.closestPoint(vec)
- Line.reflect(l)
- Line.reflectLine(l)
- Line.mirrorLine(line)
- Line.centerOnStart()
- Line.midLine(l1) 

Render Extention 
- Line.moveTo() 
- Line.lineTo() 
- Line.draw() 
- Line.mark()


### Arc

Properties    
- Arc.c = Circle
- Arc.s = Number
- Arc.e = Number
- Arc.type = 'Arc'

Functions
- Arc.copy()
- Arc.setAs(arc)
- Arc.asBox()
- Arc.asCircle()
- Arc.sweap()
- Arc.fromCircleIntercept(circle)
- Arc.areaOfPie()
- Arc.areaOfSlice()
- Arc.swap()
- Arc.fromPoints(p1,p2,p3)
- Arc.setRadius(r)
- Arc.setCenter(p)
- Arc.setCircle(c)
- Arc.normalise()
- Arc.towards(vec)
- Arc.away(vec)
- Arc.endsAsVec()  
- Arc.startAsVec()  
- Arc.endAsVec()  
- Arc.sweapLeng()
- Arc.setcircumferanceLeng(leng) 
- Arc.cordLeng()
- Arc.cordAsLine()
- Arc.great()
- Arc.minor()
- Arc.isPointOn(p)
- Arc.fromTangentsToPoint(vec)
- Arc.roundCorner(l1,l2)

Render Extention 
- Arc.moveTo()
- Arc.lineTo()
- Arc.draw()
- Arc.mark()


### Circle

Properties
- Circle.p = Circle
- Circle.r = Number
- Circle.type = 'Circle'

Functions 
- Circle.copy()
- Circle.setAs(circle)
- Circle.asBox() 
- Circle.radius(r)
- Circle.circumferance()
- Circle.area()
- Circle.fromLine(line)
- Circle.fromPoints2(a, b)
- Circle.fromPoints3(a, b, c)
- Circle.fromArea(area)
- Circle.fromCircumferance(leng)
- Circle.touching(c)
- Circle.touchingLine(l)
- Circle.isRectangleInside(rectangle)
- Circle.isCircleInside(circle)
- Circle.isLineInside(line)
- Circle.isPointInside(vec)
- Circle.distFrom(vec)
- Circle.closestPoint(vec)
- Circle.lineSegInside(line)
- Circle.lineSegIntercept(l)
- Circle.lineIntercept(l)
- Circle.circleIntercept(circle)
- Circle.tangentAtPoint(p)
- Circle.angleOfPoint(p)
- Circle.tangentsPointsForPoint(vec)  
- Circle.reflectLine(line) 
- Circle.fitCorner(l1,l2)

Render Extention 
- Circle.moveTo()
- Circle.lineTo()
- Circle.draw()
- Circle.mark()


### Rectangle

Properties    
- Rectangle.t = Line
- Rectangle.a = 1
- Rectangle.type = 'Rectangle'

Functions
- Rectangle.copy() 
- Rectangle.setAs(rectange)
- Rectangle.width()
- Rectangle.height() 
- Rectangle.aspect()
- Rectangle.setWidth(num)
- Rectangle.setHeight(num)
- Rectangle.topLine()
- Rectangle.leftLine()
- Rectangle.rightLine()
- Rectangle.bottomLine()
- Rectangle.getCorners() 
- Rectangle.asBox()
- Rectangle.area() 
- Rectangle.heightFromArea(area)
- Rectangle.widthFromArea(area)
- Rectangle.perimiter() 
- Rectangle.diagonalLength() 
- Rectangle.getCenter() 
- Rectangle.getDiagonalLine()
- Rectangle.getBottomRight()
- Rectangle.isPointInside(vec)
- Rectangle.isLineInside(line)
- Rectangle.setTransform(ctx)   
- Rectangle.setTransformArea(width, height) 
- Rectangle.getPointAt(point)  
- Rectangle.getLocalPoint(vec)
- Rectangle.scaleToFitIn(obj)

Render Extention 
- Rectangle.moveTo()
- Rectangle.lineTo()
- Rectangle.draw()
- Rectangle.mark()


### VecArray

Properties    
- VecArray.vecs = Array
- VecArray.type = 'VecArray'

Functions
- VecArray.each(func)
- VecArray.cull(func)  
- VecArray.copy()
- VecArray.setAs(vecArray)
- VecArray.push(vec)
- VecArray.append(vecArray)  
- VecArray.asBox()
- VecArray.mult(num)
- VecArray.add(v)
- VecArray.rotate(num)
- VecArray.getLast()
- VecArray.getCount()

Render Extention 
- VecArray.moveTo()
- VecArray.lineTo()
- VecArray.draw()
- VecArray.mark()


### Transform

Properties
- Transform.xa = Vec
- Transform.ya = Vec
- Transform.o = Vec
- Transform.type = 'Transform'

Functions
- Transform.copy()
- Transform.setAs(transform) 
- Transform.setCtx()
- Transform.setOrigin(vec)
- Transform.setXAxis(vec)
- Transform.setYxis(vec)

Currently does not have render extentions.