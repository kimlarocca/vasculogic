/*
 * debouncedresize: special jQuery event that happens once after a window resize
 *
 * latest version and complete README available on Github:
 * https://github.com/louisremi/jquery-smartresize
 *
 * Copyright 2012 @louis_remi
 * Licensed under the MIT license.
 *
 */
 
(function($) {
    var $event = $.event,
        $special,
        resizeTimeout;
    $special = $event.special.debouncedresize = {
        setup: function() {
            $(this).on("resize", $special.handler);
        },
        teardown: function() {
            $(this).off("resize", $special.handler);
        },
        handler: function(event, execAsap) {
            // Save the context
            var context = this,
                args = arguments,
                dispatch = function() {
                    // set correct event type
                    event.type = "debouncedresize";
                    $event.dispatch.apply(context, args);
                };
            if (resizeTimeout) {
                clearTimeout(resizeTimeout);
            }
            execAsap ?
                dispatch() :
                resizeTimeout = setTimeout(dispatch, $special.threshold);
        },
        threshold: 150
    };
})(jQuery);

//set the page elements based on the user's browser window size
function setDimensions() {
	
	//get the dimensions of the window again
	w = window,
    d = document,
    e = d.documentElement,
    g = d.getElementsByTagName('body')[0],
    x = w.innerWidth || e.clientWidth || g.clientWidth,
    y = w.innerHeight || e.clientHeight || g.clientHeight;

	//set styles for the page elements
	$('#can').css('height', y);
	$('#can').css('width', '100%'); 
	//$('.homeContent2').css('top', y);                                                                      
}

//on window resize, reset page elements
$(window).on('debouncedresize', function() {
	  setDimensions();
});

//drifting lines by wryte
//http://codepen.io/Wryte/pen/qKgGd
var PI = Math.PI;

var canvas = document.getElementById("can");
var c = canvas.getContext("2d");

canvas.width = $(window).width();
canvas.height = $(window).height();

var cWidth = canvas.width;
var cHeight = canvas.height;

window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60);
          };
})();

function magnitude(a,b) {
  return Math.sqrt(a*a + b*b);
}
function randPosNeg() {
  return (Math.random() > 0.5 ? 1 : -1);
}

var objIdCount = 0;
function getObjId() {
  return objIdCount++;
}
function Particle(params) {
  params = params || {};
  this.id = getObjId();
  
  this.rr = Math.random()*1000 + 150;
  var a = Math.random()*360;
  
  this.x = cWidth/2 + this.rr*Math.cos(a*PI/180);
  this.y = cHeight/2 + this.rr*Math.sin(a*PI/180);
  
  var dx = this.x - cWidth/2;
  var dy = this.y - cHeight/2;
  var vm = magnitude(dx,dy);
  
  this.velocity = (Math.random()*2+5);
  this.direction = params.direction || randPosNeg();
  this.vx = this.direction * this.velocity * dy/vm;
  this.vy = this.direction * this.velocity * -dx/vm;
  
  this.connectionCount = 0;
  
  this.radius = params.radius == undefined ? Math.floor(Math.random()*2)+1 : params.radius;
}
Particle.prototype.update = function(dt) {
  var dps = this.rr*2*PI / this.velocity;
  var a = (360/dps)*dt/1000 * -this.direction;
  
  this.vx = this.vx*Math.cos(a*PI/180) - this.vy*Math.sin(a*PI/180);
  this.vy = this.vx*Math.sin(a*PI/180) + this.vy*Math.cos(a*PI/180);
  
  var mag = magnitude(this.vx, this.vy);
  this.vx = this.vx/mag * this.velocity;
  this.vy = this.vy/mag * this.velocity;
  
  this.x += this.vx * dt / 1000;
  this.y += this.vy * dt / 1000;
}
Particle.prototype.draw = function() {
  c.save();
  
  c.beginPath();
  c.fillStyle = "#f0f0f0";
  c.arc(this.x, this.y, this.radius, 0, 2 * Math.PI, false);
  c.fill();
  
  c.restore();
}
Particle.prototype.clearConnections = function() {
  this.connections = {};
  this.connectionCount = 0;
}
Particle.prototype.addConnection = function(p) {
  this.connections[p.id] = true;
  this.connectionCount++;
}
Particle.prototype.checkIfConnectedTo = function(p) {
  return this.connections[p.id] != undefined ? true : false;
}

function lines() {
  c.save();
  c.strokeStyle = "#706868";
  c.lineWidth = 0.5;
  
  for (var i = 0; i < particles.length; i++) {
    particles[i].clearConnections();
  }
  
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    for (var j = 0; j < particles.length; j++) {
      var p2 = particles[j];
      var dist = Math.sqrt(Math.pow(p.x-p2.x,2) + Math.pow(p.y-p2.y,2));

      if (dist < 200 && !p.checkIfConnectedTo(p2)
         && p2.connectionCount <= 3 && p.connectionCount <= 3
         ) {
        c.beginPath();
        c.moveTo(p.x,p.y);
        c.lineTo(p2.x,p2.y);
        c.stroke();
        
        p.addConnection(p2);
        p2.addConnection(p);
      }
    }
  }
  c.restore();
}

function triangles() {
  c.save();
  c.strokeStyle = "#466070";
  c.lineWidth = 0.5;
  
  for (var i = 0; i < particles.length; i++) {
    particles[i].clearConnections();
  }
  
  for (var i = 0; i < particles.length; i++) {
    var p = particles[i];
    var c1 = undefined, c2 = undefined, c3 = undefined;
    for (var j = 0; j < particles.length; j++) {
      var p2 = particles[j];
      var dist = Math.sqrt(Math.pow(p.x-p2.x,2) + Math.pow(p.y-p2.y,2));
      var newC = {dist: dist, p: p2};
      
      if (!p.checkIfConnectedTo(p2)) {
        if (c1 == undefined || c1.dist > dist) {
          c3 = c2;
          c2 = c1;
          c1 = newC;
        } else if (c2 == undefined || c2.dist > dist) {
          c3 = c2;
          c2 = newC;
        } else if (c3 == undefined || c3.dist > dist) {
          c3 = newC;
        }
      }
    }
    
    //console.log(c1.p.id, c2.p.id, c3.p.id);
    
    if (c1 !== undefined && c2 !== undefined && c3 !== undefined) {
      p.addConnection(c1.p);
      p.addConnection(c2.p);
      p.addConnection(c3.p);
      c1.p.addConnection(p);
      c2.p.addConnection(p);
      c3.p.addConnection(p);
      
      c.beginPath();
      c.moveTo(c1.p.x,c1.p.y);
      c.lineTo(c2.p.x,c2.p.y);
      c.lineTo(c3.p.x,c3.p.y);
      c.closePath();
      
      c.fillStyle = "rgba(0,0,0,0.1)";
      c.fill();
      //c.stroke();
    }
  }
  c.restore();
}

var string = "wryte";
var fontSize = 50;

var objects = [];

var particles = [];
for (var i = 0; i < 175; i++) {
  var p = new Particle();
  particles.push(p);
  objects.push(p);
}

var ldt;
var dt;
function animate() {
  dt = new Date() - ldt;
  
  if (dt < 500) {
    // clear background
    c.fillStyle = "#222";
    c.fillRect(0,0,cWidth,cHeight);
    
    //c.fillStyle = "#3c3c3c";
    //c.font = fontSize+"pt 'Pathway Gothic One', sans-serif";
    //var adjX = c.measureText(string).width/2;
    //c.fillText(string, cWidth/2 - adjX, cHeight/2 + fontSize/2);
    
    //c.font = "20pt 'Pathway Gothic One', sans-serif";
    //adjX = c.measureText("a codepen by").width/2;
    //c.fillText("a codepen by",cWidth/2 - adjX, cHeight/2-fontSize/2-5);
    
    lines();
    triangles();

    for (var i = 0; i < objects.length; i++) {
      var object = objects[i];
      object.update(dt);
      object.draw();
    }
  }
  
  ldt = new Date();
  setTimeout(function() {
    window.requestAnimFrame(animate);
  }, 1000/30);
}
ldt = new Date();
animate();

//set slanted background width
setDimensions();
$('.homeBG').css("border-width",$(window).height()+"px "+$(window).height()+"px 0 0");
var position = $("#homeLearnMore").position();
$("#homeLearnMore").click(function() {
	$('html').animate({
      top: '-=120'
    }, 1000);
});