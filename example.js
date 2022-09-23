var lucidmath = require('./lucidmath.js');

//Simple usages
var expr = lucidmath.compile("100+5*2");
console.log(expr()); //110


//working external function
var triple = function(s) {s.push(s.pop()*3);};
var funcs = {trip: [1, triple]};
expr = lucidmath.compile("trip(100)", funcs);
console.log(expr()); //300