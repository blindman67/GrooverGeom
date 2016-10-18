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



