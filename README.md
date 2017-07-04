###GrooverGeom.
##This is a work in progress 

Removed example and demo. To much work for me to complete.


This whole project is proving to be too large for any practical use as a code base.

Rather than an interrogated geom solution I have found my self copying from the core object in GrooverGeom.js 

I am thinking of changing this project to a geom function repository (when time make it so).


This does geometry, 2D at the moment.



```Javascript
var radius = 100;
var center = new Geom.Vec(100,100);
var circle = new Geom.Circle(center,radius);  // creates a circle at center 

area = circle.area();
circumference = circle.circumference();
circle.isInside(triangle) // is triangle inside
circle.isTouching(rectangle); // is rectangle touching this circle
circle.fromVec3(point1, point2, point3); // set center and radius so all 3 points are on the circumference if possible
circle.fitToCircles(circle1, circle2, rules); // set center and radius so that this circle touches both circle1 and circle2 following the constraint rules 
circle.intercept(circle2); // returns intercept points of this circle and circle2
```

Current primitives 
Vec. A point 
VecArray. An array of points
PrimitiveArray. An array of primitives
Line.
Triangle.
Rectangle.
Circle.
Arc.
Transform. 2D matrix
Box.  A bounding box 
Bezier. 2nd and 3rd order.  Currently does not have intercepts for circle and arc (but does for all other (line,triangle,rectangle,bezier)) 


Plus extensions for rendering to canvas. Simple UI selecting, dragging, scaling, rotating, etc (display agnostic). Shapes for complex compound shapes (depreciated in favour of GeomConstructors). Constructors a interface for creation of complex compound shapes and geometry (automates the replacement of common functions)

AND So much is changing that to keep an up to date readme is to much work for now.


###The big dumb list

Common functions
	setLabel(label)
	getLabel()
	makeUnique()
	copyFull(arg1,arg2)
	asSimpleTyped(obj)
	asJSON()
	labelStr : undefined
	id : undefined
	moveTo()
	lineTo()
	draw(join)
	mark(name, _size)
	label (text)
	hasConstructor()
	addConstructor(construction, protectRecursion)
	recreate(data)
	removeConstructor()
	callConstructors()

##Vec
Properties
	x 
	y 
	_leng 
	_dir 
	type = 'Vec'
Functions 
	copy()
	asSimple(obj)
	fromSimple(obj)
	toString(precision)
	getHash()
	setAs(vec,num)
	hasId(id)
	getAllIdsAsArray(array)
	asVecArray(vecArray, instance)
	asBox(box)
	isEmpty()
	isZero()
	empty()
	isSame(vec)
	isSameE(vec)
	lerp(from,dest,amount)
	vectorToPolar()
	polarToVector()
	add(vec)
	sub(vec)
	mult(number)
	div(number)
	rev() 
	r90()
	rN90()
	r180()
	fromPolar(dir, distance)
	addPolar(dir, distance)
	half()
	setLeng(number)
	setDir(number)
	rotate(number)
	magnitude()
	leng()
	leng2()
	dir()
	mid(vec)
	norm()
	dot(vec)
	dotUnit(vec)
	cross(vec)
	crossUnit(vec)
	dotNorm(vec)
	crossNorm(vec)
	angleBetween(vec)
	distFrom(vec)
	distTo(vec)
	distAlongNorm(vec)
	angleTo(vec)
	scale(scale)
	translate(vec)
	transform(transform)

	
##Line
Properties
	p1
	p2 
	type : 'Line'
	_leng 
	_dir 
Functions 
	copy()
	setAs(line)
	setEnds(vec1, vec2)
	hasId(id)
	asSimple(obj)
	fromSimple(obj)
	isEmpty()
	empty()
	isZero()
	toString(precision)
	getHash()
	replace(id, prim)
	swap()
	reverse()
	lerp(from, dest, amount)
	asVec(vec)
	asVecArray(vecArray, instance)
	asBox(box)
	asCircle(circle)
	asRectangle(height,rect)
	isVecLeft(vec)
	isLineLeft(line)
	isCircleLeft(circle)
	isVecWithinSeg(vec)
	isVecOnSeg(vec, threshold)
	isLineOnLine(line,threshold)
	isLineParallelToLine(line,threshold)
	isLineOnSeg(line,threshold)
	isLineInSeg(line,threshold)
	leng()
	leng2()
	dir()
	norm(rVec)
	normDir()
	extend(percentage)
	setLeng(len)
	setDir(num)
	cross()
	crossBack()
	mult(num)
	add(vec)
	midPoint(rVec)
	unitAlong( unitDist , rVec)
	distanceAlong( dist, rVec) 
	distAlong( dist, rVec) 
	angleBetween(line)
	angleFromNormal(line)
	setTransformToLine (ctx)
	sliceOffEnd( line )
	sliceOffStart( line )
	sliceToPoints(p1,p2)
	intercept(line,rVec)
	interceptSeg(line,rVec)
	interceptSegs(line,rVec)
	isLineSegIntercepting(line)
	distFrom(point)
	distFromPoint(point)
	distFromDir(point)
	distFromPointDir(point)
	lineTo () 
	getDistOfPoint(vec)
	getUnitDistOfPoint(vec)
	getDistOfPointSafe(vec)
	getUnitDistOfPointSafe(vec)
	unitDistOfClosestPoint(vec)
	closestPoint(vec, rVec)
	reflect(l)
	reflectAsVec(line,retVec)
	reflectLine(line, retLine)
	getNormalAsLine(retLine)
	mirrorLine(line)
	setStartEndUnit(start,end)
	centerOnStart()
	centerOnEnd()
	centerOnVec(vec)
	rotate180OnStart()
	rotate180OnEnd()
	rotate90OnCenter()
	rotate90OnStart()
	rotate90OnEnd()
	rotate90OnUnit(unit)
	rotateOnStart(rotation)
	rotateOnEnd(rotation)
	rotateOnCenter(rotation)
	rotateOnUnit(rotation,unit)
	rotateOnDist(rotation,dist)
	slide(distance)
	slideUnit(unitDistance)
	offset( distance )
	offsetUnit( unitDistance )
	midLine(l1)
	scale(scale)
	translate(vec)
	rotate(rotation)
	transform(transform)


##Circle	
Properties
	center
	radius
	type : 'Circle'
Functions 
	copy()
	setAs(circle)
	asVecArray(vecArray, instance)
	hasId(id)
	asBox(box)
	toString(precision)
	asSimple(obj)
	fromSimple(obj)
	getHash()
	replace(id, prim)
	asTriangles(sides,array)
	lerp(from, dest, amount)
	isEmpty()
	empty()
	setRadius(r)
	addToRadius( number )
	multiplyRadius( number )
	circumference()
	area()
	fromLine(line)
	fromVec2(vec1, vec2, method)
	fromVec3(vec1, vec2, vec3)
	fromArea(area)
	fromTriangle(triangle)
	fromCircumference (leng)
	isTouching(circle)
	isTouchingLine(line)
	isLineTouching(line)
	isRectangleInside(rectangle)
	isCircleInside(circle)
	isLineInside(line)
	isVecInside(vec)
	isPointInside(vec)
	unitAlong( unitDist , rVec)
	unitDistOfClosestPoint(vec) 
	distFrom(vec)
	fitToCircles(circle1, circle2, rule)
	closestPoint(vec,retVec)
	closestPointToLine(line,retVec)
	closestPointToVec(vec,retVec)
	clipLine(line,retLine)
	interceptLineSeg(line, retLine)
	interceptLine(line, retLine)
	interceptLineSelect(line,which,limit, retVec)
	intercept(circle)
	tangentLineAtVec(vec,retLine )
	tangentAtAngle(angle,retLine)
	angleOfPoint(p)
	tangentsPointsForPoint(vec)
	getTangentsToCircle(circle,retLineR,retLineL)
	fitCircleToLine(circle,line,left = true,outside = true)
	reflectLine(line)
	fitCornerConstrain(line1,line2,cornerUnknown,constraint,data)
	fitCorner(line1,line2,cornerUnknown)
	scale(scale)
	translate(vec)
	rotate(rotation)
	transform(transform)

	
##Arc	
Properties
	circle 
	start 
	end 
	direction 
	type : 'Arc'
Functions 
	copy()
	setAs(arc)
	hasId(id)
	distFrom(vec)
	asBox(box)
	asVecArray(vecArray, instance)
	isEmpty()
	empty()
	isZero()
	toString(precision)
	getHash()
	replace(id, prim)
	asCircle()
	asTriangles(sides,sector,array)
	asSimple(obj)
	fromSimple(obj)
	lerp(from, dest, amount)
	sweap()
	arcLength()
	fromCircleIntercept(circle)
	areaOfSector()
	areaOfSegment()
	normaliseDirection() 
	fromVec3(vec1, vec2, vec3)
	fromTriangle(triangle)
	fromTangentAt(where, tangentVec)
	fitToCircles(cir1,cir2,rule)
	swap(direction)
	reverse()
	fromPoints(p1,p2,p3)
	setRadius(number)
	addToRadius( number )
	multiplyRadius( number )
	setCenter(vec)
	setCircle(circle)
	normalise()
	towards(vec)
	away(vec)
	endsAsVec(vecArray, vecEnd) 
	startAsVec(vec) 
	endAsVec(vec) 
	unitPosAsVec(unit,vec)
	unitAlong(unit,vec)
	unitDistOfClosestPoint(vec) 
	tangentAtStart(retLine)
	tangentAtEnd(retLine)
	startFromVec(vec)
	endFromVec(vec)
	endsFromVecs(vec1, vec2)
	sweapLeng()
	setCircumference(leng)
	cordLeng()
	cordAsLine(retLine)
	clockwise()
	anticlockwise()
	great()
	minor()
	isPointOn(p)
	fromTangentsToPoint(vec)
	fitCircleToLine(arcCircle,line,left = true, outside = true)
	fitCircleToCircles(arcCircle1,arcCircle2, left = true)
	getTangentsToCircle(arcCircle,retLineR,retLineL)
	fitCornerConstrain(line1,line2,cornerUnknown,constraint,data)
	fitCorner(line1,line2,cornerUnknown)
	scale(scale)
	translate(vec)
	rotate(rotation)
	transform(transform)

	
##Box	
Properties
	left
	top
	right
	bottom
	type : 'Box'
Functions 
	copy()
	setAs(box)
	asBox(box)
	asSimple(obj)
	fromSimple(obj)
	asVecArray(vecArray)
	hasId(id)
	lerp(from, dest, amount)
	isVecInside(vec)
	isVecArrayInside(vecArray)
	isLineInside(line)
	isRectangleInside(rectange)
	isCircleInside(circle)
	isBoxInside(box)
	isBoxTouching(box)
	isBoxOverlapping(box)
	isLineTouching(Line)
	isArcTouching(arc)
	isRectangleTouching(Rectange)
	isTriangleTouching(Triangle)
	isBezierTouching(bezier)
	isInside(primitive)
	isEmpty()
	empty()
	toString(precision)
	add(vec)
	pad(amount)
	padWidth(amount)
	padHeight(amount)
	min(width, height)
	asRectangle(retRect) 
	center(vec)
	normalise()
	max()
	width()
	height()
	irrate()
	env(x, y)
	envBox(box)
	envelop(obj)

	
##Rectangle 	
Properties
	top 
	aspect : 1
	type : 'Rectangle'
	_width
	_height
Functions 
	copy() 
	setAs(rectange)
	hasId(id)
	isEmpty()
	toString(precision)
	empty()
	replace(id, prim)
	width()
	height() 
	setWidth(num)
	lerp(from, dest, amount)
	setHeight(num)
	topLine(line)
	leftLine(line)
	rightLine(line)
	bottomLine(line)
	heightVec(vec)
	corners(vecArray) 
	asVecArray(vecArray, instance)
	asBox(box)
	asCircle(circle)
	asInnerCircle(circle)
	asTriangles(diagonal,array)
	asSimple(obj)
	fromSimple(obj)
	slice(x, y, rect)
	asArc(where,radius,arc)
	area() 
	inflate(units)
	heightFromArea(area)
	widthFromArea(area)
	perimiter() 
	diagonalLength() 
	center(vec) 
	setCenter(vec)
	diagonalLine(line)
	setDiagonalLine(line)
	bottomRight(vec) 
	setBottomRight(vec)
	setTopRight(vec)
	isRectangleTouching(rectangle)
	isRectangleInside(rectangle)
	isBoxInside(box)
	isCircleInside(circle)
	isCircleTouching(circle)
	isPointInside(vec)
	isPointTouching(vec)
	isLineInside(line)
	isLineTouching(line)
	setTransform (ctx)
	setTransformArea(ctx, width, height)
	interceptingLineSeg(line, retLineSeg)
	pointAt(point,vec)
	localPoint(vec,rVec)
	scaleToFitIn(obj)
	scale(scale)
	translate(vec)
	rotate(rotation)
	transform(transform)

	
##Bezier
Properties
	p1
	p2
	cp1
	cp2 
	type : 'Bezier'
	_subStart
	_subEnd
Functions 
	copy()
	setAs(bezier)
	_setSpan(f,t)
	toString(precision)
	getHash()
	replace(id, prim)
	getAllIdsAsArray(array)
	empty()
	isEmpty()
	hasId(id)
	lerp(from, dest, amount)
	isQuadratic()
	isCubic()
	description()
	leng()
	asVecArray(vecArray, instance)
	asBox(box)
	asSimple(obj)
	fromSimple(obj)
	interceptsAsVecArray(bezier,threshold,vecArray)
	interceptBezier_QonQ(bez1,vecArray)
	interceptsAsPositions(bezier,threshold,array,array1)
	lineInterceptPos(line)
	interceptLine(line,vecArray)
	interceptLineSeg(line,vecArray)
	sliceWithLine(line,right,primArray)
	asQuadratic()
	asCubic(extraVec)
	translate(vec)
	scale(scale)
	rotate(rotation)
	fromCircle(circle,quadrant)
	fromArc(arc)
	fromVecArray(type,vecArray,instance)
	fromTriangle(triangle)
	asRectangle(rectangle)
	fromBox(box)
	segment(fromPos,toPos,retBezier)
	splitAt(position,start,retBezier)
	normalise()
	reverse() 
	getLocalExtrema(axisX, solution)
	getLength()
	getControlPoint(which)
	findPositionOfVec(vec,resolution,pos)
	distFrom(vec)
	fitPointCenter(vec)
	fitPointAt(pos,vec)
	vecAt(position,limit,vec)
	unitAlong(unit,vec)
	length()
	unitDistOfClosestPoint(vec)
	tangentAsVec( position,limit, retVec ) 
	normalAsVec(position, limit, retVec) 
	normalAsLine(position, limit, retLine) 
	tangentAsLine(position, limit, retLine) 
	snapToBezier(bez, fromStart, toStart , coplanar, equalScale) 
	snapToBezierPos(bez, pos , tangentAmount) 
	getInterpolationArray(resolution,array)
	approxLength(resolution)

	
##Triangle	
Properties
	p1 
	p2 
	p3 
	type : 'Triangle'
Functions 
	copy()
	asBox(box)
	hasId(id)
	isEmpty()
	empty()
	toString(precision)
	getHash()
	replace(id, prim)
	area()
	perimiter ()
	semiperimiter()
	distFrom(vec)
	snapTo(xGrid, yGrid, rule)
	lerp(from, dest, amount)
	asVecArray(vecArray, instance)
	asLines(array)
	asBoundingCircle(circle)
	asCircle(circle)
	asRectangle(sideIndex,retRect)
	asArc(arc)
	asInnerCircle(circle)
	asSimple(obj)
	fromSimple(obj)
	lines()
	angles(array)
	getSideBisectorAsLine(line, sideIndex)
	getCornerBisectorAsLine(line, cornerIndex)
	getSideBisectedAngleIntercept(retVec,cornerIndex)
	centerByBisectingAngles(retVec)
	center(retVec)
	sumCross()
	isVecInside(vec)
	isLineInside(line)
	isCircleInside(circle)
	isArcInside(arc)
	isRectangleInside(rectangle)
	isBoxInside(box)
	isTriangleInside(triangle)
	isLineTouching(line)
	isCircleTouching(circle)
	isArcTouching(arc)
	isBoxTouching(box)
	isRectangleTouching(rectangle)
	isTriangleTouching(triangle)
	isClockwise()
	isRight()
	isOblique()
	isDegenerate()
	isObtuse()
	isAcute()
	isEquilateral()
	isIsosceles()
	isScalene()
	description()
	isInside(primitive)
	sliceLineRemove(line,triArray)
	sliceLine(line)
	slice(obj)
	unitDistOfClosestPoint(vec)
	unitAlong( unitDist , rVec)
	circumcenter(vec)
	meanCenter(vec)
	isSimilar(triangle)
	reverse(swap)
	makeClockwise(swap)
	lengthAllQuick2()
	lengthAllQuick()
	distFromAll(vec,array)
	lengthAll(array)
	angleAll(array)
	longestLength()
	shortestLength()
	inflate(amount)
	setAs (triangle)
	scale(scale)
	translate(vec)
	rotate(rotation)
	transform(transform)

	
##VecArray
Properties
	vecs : 
	items 
	type : 'VecArray'
	current 
	length 
Functions 
	hasId(id)
	each(callback,dir,start = 0)
	cull(callback)
	toString(precision, lineFeed)
	lerp(from,dest,amount)
	clear()
	reset()
	empty()
	isEmpty()
	normalise()
	asSimple(obj)
	fromSimple(obj)
	setLength(len)
	reverse()
	remove(index)
	removeById(id)
	isIdInArray(id,all)
	getVecById(id,index)
	getAllIdsAsArray(array)
	getHash()
	getById(id)
	copy(from, to)
	setAs (vecArray)
	push(vec)
	pushI(vec)
	append(vecArray)
	asBox(box)
	mult(number)
	add(vec)
	sum()
	mean()
	rotate(number)
	findClosestIndex(vec, limit, rectangular)
	findClosest(vec,limit = Infinity, rectangular = false)
	findInsideBox(box, vecArray, invVecArray)
	getLast()
	last()
	first()
	next()
	previouse()
	remaining()
	getCount()
	sumCross()
	area()
	perimiter()
	indexOf(vec, start)

	
##PrimitiveArray	
Properties
	
	type : 'PrimitiveArray'
	length
	current
Functions 
	toString(precision,lineFeed)
	hasId(id)
	push(primitive)
	pushUnsafe(primitive)
	pushI(primitive)
	pushIUnsafe(primitive)
	clear()
	reset()
	empty()
	isEmpty()
	normalise()
	transform(transform)
	asSimple(obj)
	fromSimple(obj)
	replace(id, prim)
	asBox(box)
	asVecArray(vecArray, instance)
	eachAs(type,callback,dir,start)
	each(callback,dir,start)
	first()
	next()
	previouse()
	last()
	firstAs(type)
	nextAs(type)
	previouseAs(type)
	lastAs(type)
	getById(id)
	getClosestIndexToVec(vec,type)
	getClosestPrimitiveToVec(vec,type)
	collectIdsAsPrimitiveArray(ids,primArray)
	getAllIdsAsArray(array)
	isIdInArray(id,all,shallow)




