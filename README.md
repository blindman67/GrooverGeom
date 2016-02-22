### GrooverGeom

## Contents
1. [Work in progress](#work-in-progress)
1. [Current Primitives](#current-primitives)
1. [Non Primitives](#non-primitives)
1. [Common Methods](#common-Methods)
1. [Render extentions](#render-extentions)
1. [Geom usage examples](#geom-usage-examples)
1. [Primitives](#primitives)
1. [Vec](#vec)
1. [VecArray](#Vecarray)
1. [Line](#line)
1. [Rectangle](#rectangle)
1. [Circle](#circle)
1. [Arc](#arc)
1. [Box](#box)
1. [Empty](#Empty)


## Work in progress.

This is currently very much a work in progress

[Back to top.](#contents)

## Warning Refactoring in progress
The document dose not fully reflect the current refactoring.

This is part of the Groover name space and can be located as groover.geom. 

You can also extend the object with render functions for rendering  on the 2D canvas context

Geom provides a wide range of functions to aid with 2D geometric objects.

Currently supporting the following primitives

[Back to top.](#contents)

## Current Primitives
- [Vec](#vec)
- [VecArray](#Vecarray)
- [Line](#line)
- [Rectangle](#rectangle)
- [Circle](#circle)
- [Arc](arc)
- [Box](box)
- [Empty](Empty)

[Back to top.](#contents)

## Non Primitives
These object are helper objects though there inclusion in this namespace is still questionable. There are currently used for testing 

- Transform 


All functions are chainable where posible

[Back to top.](#contents)

## Common Methods
All object implement the following

- type : A string with the name of the primitive. Eg Vec.type = "Vec";
- copy() : Creates a new copy of the primitive.
- setAs(obj) : Copy the the properties of obj to this primitive. Obj should be the same primitive.
- asBox(box) : Returns the bounding box of the primitive. Box is optional. If inclueded then the box will be extened if neeeded to bound this privitive.
- isEmpty() : Returns true for an invalid, zero length, zero size or area. Some functions will set the returned object in an empty state rather than return nothing at all.

[Back to top.](#contents)

## Render extentions
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

[Back to top.](#contents)

## Geom usage examples

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




[Back to top.](#contents)

##Primitives 

The following documentation is auto generated from within the Geom object. This Auto generation eaxtracts the comments found in the source code to construct this list. It is currently experimental so please excuse the occasional hicup.

[Back to top.](#contents)

Auto doc.
runtime: 24.428ms
GrooverUtils.js:32 

## Vec

Properties.
- Vec.x = number
- Vec.y = number
- Vec.type = 'Vec'

Functions.
- Vec.copy()  
    Creates a copy of this
    Returns a new [this](#vec)
- Vec.setAs(vec)  
    Sets this [vec](#vec) to the values in the requiered argument [vec](#vec)
    Returns the existing [this](#vec)
- Vec.asBox(box)  
    Returns the bounding [box](#box) that envelops this [vec](#vec)
    Optional argument [box](#box) is created if not supplied
    Returns [box](#box)
- Vec.isEmpty()  
    [Vec](#vec) can not be [empty](#empty) so always returns true
- Vec.add(vec) 
    Adds requiered argument [vec](#vec) to this.
    Returns [this](#vec)
- Vec.sub(v)  
    Subtracts requiered argument [vec](#vec) from this.
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

render extention.
- Vec.moveTo()
- Vec.lineTo()
- Vec.mark()
- Vec.draw()

[Back to top.](#contents)

## VecArray

Properties.
- VecArray.vecs = object
- VecArray.type = 'VecArray'

Functions.
- VecArray.each(func)
    Do not be tempted to put length in the for statement
    Doing so will cause an infinit loop if appending to self
- VecArray.cull(func)  
    Func return true to keep
- VecArray.copy()
- VecArray.setAs(vecArray)
- VecArray.isEmpty()
- VecArray.push(vec)
- VecArray.append(vecArray)  
    This is safe becasue each() only loops a set count
- VecArray.asBox(box)
- VecArray.mult(num)
- VecArray.add(v)
- VecArray.rotate(num)
- VecArray.getLast()
- VecArray.getCount()

render extention.
- VecArray.moveTo()
- VecArray.lineTo()
- VecArray.draw()
- VecArray.mark()

[Back to top.](#contents)

## Line

Properties.
- Line.p1 = undefined
- Line.p2 = undefined
- Line.type = 'Line'

Functions.
- Line.copy()
- Line.setAs(line)
- Line.isEmpty()
- Line.createEmpty()
- Line.swap()
- Line.reverse()
- Line.asVec()
- Line.asVecArray()
- Line.asBox(box)
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
- Line.sliceOffEnd( line )
- Line.sliceOffStart( line )
- Line.sliceToPoints(p1,p2)
- Line.intercept(l2)
- Line.distFrom(p)
- Line.distFromDir(p) 
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
    This is bad must find a better way

render extention.
- Line.lineTo() 
- Line.moveTo() 
- Line.draw() 
- Line.mark()

[Back to top.](#contents)

## Rectangle

Properties.
- Rectangle.top = undefined
- Rectangle.type = 'Rectangle'

Functions.
- Rectangle.aspect()
- Rectangle.copy() 
- Rectangle.setAs(rectange)
- Rectangle.isEmpty()
- Rectangle.width()
- Rectangle.height() 
- Rectangle.setWidth(num)
- Rectangle.setHeight(num)
- Rectangle.topLine()
- Rectangle.leftLine()
- Rectangle.rightLine()
- Rectangle.bottomLine()
- Rectangle.getCorners() 
- Rectangle.asBox(box)
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
    Temp location of this function
- Rectangle.setTransformArea(width, height) 
    Temp location of this function
- Rectangle.getPointAt(point)  
    Point is a relative unit coordinate on the [rectangle](#rectangle)
- Rectangle.getLocalPoint(vec)
- Rectangle.scaleToFitIn(obj)

render extention.
- Rectangle.moveTo()
- Rectangle.lineTo()
- Rectangle.draw()
- Rectangle.mark()

[Back to top.](#contents)

## Circle

Properties.
- Circle.center = undefined
- Circle.radius = number
- Circle.type = 'Circle'

Functions.
- Circle.copy()
- Circle.setAs(circle)  
    Sets this [circle](#circle) to the argument requiered argument [circle](#circle).
    Return [this](#circle)
- Circle.asBox(box)     
    Returns the bounding [box](#box)
    Requiered argument [box](#box) is option
    Returns `[Box](#box)`
- Circle.isEmpty()
- Circle.setRadius(r)
- Circle.circumference()
- Circle.area()
- Circle.fromLine(line)
- Circle.fromPoints2(vec1, vec2)
- Circle.fromPoints3(vec1, vec2, vec3)
    Points are in a [line](#line)
- Circle.fromArea(area)
- Circle.fromCircumference(leng)
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
    Dist from [line](#line)
    Closest point on [line](#line)
- Circle.lineIntercept(l)
    Dist from [line](#line)
    Closest point on [line](#line)
- Circle.circleIntercept(circle)
- Circle.tangentAtPoint(p)
- Circle.angleOfPoint(p)
- Circle.tangentsPointsForPoint(vec)  
    Finds where on the [circle](#circle) the tangents are for the point [vec](#vec). In valid if point is inside the [circle](#circle)
    Point is inside so no tangents exist
- Circle.reflectLine(line) 
    WTF sorry will fix in time
- Circle.fitCorner(l1,l2)

render extention.
- Circle.moveTo()
- Circle.lineTo()
- Circle.draw(direction)
- Circle.mark()

[Back to top.](#contents)

## Arc

Properties.
- Arc.circle = undefined
- Arc.start = number
- Arc.end = number
- Arc.type = 'Arc'

Functions.
- Arc.copy()
- Arc.setAs(arc)
- Arc.asBox(box)
- Arc.isEmpty()
- Arc.asCircle()
- Arc.sweap()
- Arc.fromCircleIntercept(circle)
- Arc.areaOfSector()
- Arc.areaOfSegment()
    Angle
    Area of the pie shape
    Lenght of half the cord;
    Length of [line](#line) from center to cord
    Area is Pie area - triangle *2
    Area is Pie area - triangle *2
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
- Arc.setCircumference(leng) 
- Arc.cordLeng()
- Arc.cordAsLine()
- Arc.great()
- Arc.minor()
- Arc.isPointOn(p)
- Arc.fromTangentsToPoint(vec)
- Arc.roundCorner(l1,l2)

render extention.
- Arc.moveTo()
- Arc.lineTo()
- Arc.draw(direction)
- Arc.mark()

[Back to top.](#contents)

## Box

Properties.
- Box.top = number
- Box.bottom = number
- Box.left = number
- Box.right = number
- Box.type = 'Box'

Functions.
- Box.copy()
- Box.setAs(box)
- Box.asBox(box)
- Box.isEmpty()
- Box.asRectange() 
- Box.normalise()
- Box.max() 
- Box.irrate() 
- Box.env( x, y)
- Box.envBox(box)
- Box.envelop(obj)

render extention.
- Box.moveTo()
- Box.lineTo()
- Box.draw()
- Box.mark()

[Back to top.](#contents)

## Empty

Properties.
- Empty.type = 'Empty'

Functions.
- Empty.copy() return new Empty(); }
- Empty.asBox(box)
- Empty.setAs()
- Empty.isEmpty()

render extention.
- Empty.moveTo()return this;}
- Empty.lineTo()return this;}
- Empty.draw()return this;}
- Empty.mark()return this;}

[Back to top.](#contents)

## Transform

Properties.
- Transform.xa = undefined
- Transform.ya = undefined
- Transform.o = undefined
- Transform.type = 'Transform'

Functions.
- Transform.copy()
- Transform.setAs(transform) 
- Transform.setCtx()
- Transform.setOrigin(vec)
- Transform.setXAxis(vec)
- Transform.setYxis(vec)

[Back to top.](#contents)
