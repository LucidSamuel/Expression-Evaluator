# LucidMath

LucidMath is a math expression evaluator written in JavaScript.

## Installation

If you're using Node.js, you can easily install with npm:

```
npm install lucidmath
```

Otherwise, you can copy `lucidmath.js` directly into your project client-side.


## Example Usage

```
var lucidmath = require('./lucidmath.js');


//Basic usage
var expr = lucidmath.compile("100+5*2");
console.log(expr()); //110


//Call external function
var triple = function(s) {s.push(s.pop()*3);};
var funcs = {trip: [1, triple]};
expr = lucidmath.compile("trip(100)", funcs);
console.log(expr()); //300



//Detect error (unbalanced para)
expr = lucidmath.compile("1+(4*2");
console.log(expr); //{text: '1+(4*2', index: 6, token: '', type: 'parent'}
```
Have fun.