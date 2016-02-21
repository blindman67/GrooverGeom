### GrooverGeom

Work in progress.

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
- asBox(box) : Returns the bounding box of the primitive. Box is optional. If in clueded then the box will be extened if neeeded to bound this privitive.

### Render extentions
Extending the objects with render will add the following methods to all primitives (exluding Transform).

- moveTo() : moves the current path to the start of the primitive. For circles this is at 0 deg. For arcs this is the start of the sweap.
- lineTo() : adds a line to the start of the primitive.
- mark() : adds marks to the current path. See render docs for details.
- draw() : adds the primitive to the current path;

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