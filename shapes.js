function uniqid(prefix, more_entropy) {
    // +   original by: Kevin van Zonneveld (http://kevin.vanzonneveld.net)
    // +    revised by: Kankrelune (http://www.webfaktory.info/)
    // %        note 1: Uses an internal counter (in php_js global) to avoid collision
    // *     example 1: uniqid();
    // *     returns 1: 'a30285b160c14'
    // *     example 2: uniqid('foo');
    // *     returns 2: 'fooa30285b1cd361'
    // *     example 3: uniqid('bar', true);
    // *     returns 3: 'bara20285b23dfd1.31879087'
    if (typeof prefix == 'undefined') {
        prefix = "";
    }

    var retId;
    var formatSeed = function (seed, reqWidth) {
        seed = parseInt(seed,10).toString(16); // to hex str
        if (reqWidth < seed.length) { // so long we split
            return seed.slice(seed.length - reqWidth);
        }
        if (reqWidth > seed.length) { // so short we pad
            return Array(1 + (reqWidth - seed.length)).join('0')+seed;
        }
        return seed;
    };

    // BEGIN REDUNDANT
    if (!this.php_js) {
        this.php_js = {};
    }
    // END REDUNDANT
    if (!this.php_js.uniqidSeed) { // init seed with big random int
        this.php_js.uniqidSeed = Math.floor(Math.random() * 0x75bcd15);
    }
    this.php_js.uniqidSeed++;

    retId  = prefix; // start with prefix, add current milliseconds hex string
    retId += formatSeed(parseInt(new Date().getTime()/1000,10),8);
    retId += formatSeed(this.php_js.uniqidSeed,5); // add seed hex string

    if (more_entropy) {
        // for more entropy we add a float lower to 10
        retId += (Math.random()*10).toFixed(8).toString();
    }

    return retId;
};


var ShapeFactory = {
	properties: ['scaleX', 'scaleY', 'x', 'y', 'width', 'height', 'strokeStyle', 'fillStyle', 'lineWidth', 'layer'],
	makeConstructor: function() {
		return function(config) {

			var defaults = {
				id: uniqid(),
				scaleX: 1,
				scaleY: 1,
				x: 0,
				y: 0,
				width: 0,
				height: 0,
				strokeStyle: '#000',
				fillStyle: '#000',
				lineWidth: 1.0,
				canvas: null,
				layer: 0,
				rotate: 0,
			};

			this.config = defaults;

			if(config) {
				for(var i in config) {
					if(config[i]) {
						this.config[i] = config[i];
					}
				}
			}

			if(this.config.canvas && !(this.config.canvas instanceof Canvas)) {
				this.config.canvas == null;
				throw new TypeError('Invalid canvas supplied');
			}

			return this;
		}
	},
	
	makeGetSet: function(object, properties) {
		for(var i in properties) {
			object.prototype[properties[i]] = new Function('value', '\
				if(value) {                                          \
					this.config.' + properties[i] + ' = value;       \
					this.render();                                   \
				}                                                    \
				return this.config.' + properties[i] + ';            ');
		}
	},
	make: function(parent, properties) {
		var object = {};
		object = ShapeFactory.makeConstructor();
		if(parent) {
			object.prototype = new parent;
		}
	   
		var properties = (properties && properties.concat && properties.concat(ShapeFactory.properties)) || ShapeFactory.properties;

		ShapeFactory.makeGetSet(object, properties);
		return object;
	}   
}

var Shape = ShapeFactory.make();
Shape.prototype.getConfig = function() { return this.config; };
Shape.prototype.getId = function() { return this.config.id; };
Shape.prototype.drawStart = function(canvas) {
	this.config.canvas = canvas || this.config.canvas;
	this.config.canvas.getContext().save();
	this.config.canvas.getContext().strokeStyle = this.config.strokeStyle;
	this.config.canvas.getContext().fillStyle = this.config.fillStyle;
	this.config.canvas.getContext().scale(this.config.scaleX, this.config.scaleY);
	this.config.canvas.getContext().rotate(this.config.rotate * (Math.PI / 180));		
};
Shape.prototype.drawEnd = function() { this.config.canvas.getContext().restore(); };
Shape.prototype.draw = function(canvas) { throw new Error('Calling abstract method draw'); };
Shape.prototype.render = function() {
	if(this.config.canvas) {
		this.config.canvas.removeShape(this);
		this.config.canvas.addShape(this);
	}
};

Shape.prototype.moveTo = function(x,y) {
	this.config.x = x;
	this.config.y = y; 
	this.render();
};
Shape.prototype.scale = function(scaleX, scaleY) {
	this.config.scaleX = scaleX || this.config.scaleX;
	this.config.scaleY = scaleY || this.config.scaleY;
	this.render();
};

var Rectangle = ShapeFactory.make(Shape);
Rectangle.prototype.draw = function(canvas) {

	this.drawStart(canvas);
	this.config.canvas.getContext().fillRect(this.config.x, this.config.y, this.config.width, this.config.height);
	this.drawEnd();
};


var Circle = ShapeFactory.make(Shape);
Circle.prototype.draw = function(canvas) {
	
	this.drawStart(canvas);
	
	this.config.canvas.getContext().beginPath();
	this.config.canvas.getContext().arc(this.config.x, this.config.y, this.config.width, 0, Math.PI * 2, true);
	this.config.canvas.getContext().closePath();
	if(this.config.fillStyle != null) {
		this.config.canvas.getContext().fill();
	}
	
	this.drawEnd();
};

var Line = ShapeFactory.make(Shape);
Line.prototype.setPath = function(path) { 
	if(!path.constructor == Array) {
		throw new TypeError('Invalid path supplied');
		return false;
	}
	this.path = path; 
}
Line.prototype.LINE_TO = 'lineTo';
Line.prototype.BEZIER_CURVE_TO = 'bezierCurveTo';
Line.prototype.getPath = function() { return this.path; }
Line.prototype.draw = function(canvas) {

	if(this.config.lineDrawingMethod != this.LINE_TO && this.config.lineDrawingMethod != this.BEZIER_CURVE_TO) {
		throw new RangeError('Invalid line drawing method \'' + this.config.lineDrawingMethod + '\'');
		return false;
	}
 
    this.drawStart(canvas);
	this.config.canvas.getContext().beginPath();                             
	
	this.config.canvas.getContext().moveTo(this.path[0][0], this.path[0][1]);
	switch(this.config.lineDrawingMethod) {
		case this.LINE_TO:
			for(var i = 1; i < this.path.length; i++) {
				this.config.canvas.getContext().lineTo(this.path[i][0], this.path[i][1]);
			}
			break;
		case this.BEZIER_CURVE_TO:  
			for(var i = 1; i < this.path.length; i++) {
				this.config.canvas.getContext().bezierCurveTo(this.path[i][2], this.path[i][3], this.path[i][4], this.path[i][5], this.path[i][0], this.path[i][1]);
			}
			break;		
	}
	
	this.config.canvas.getContext().stroke();
	this.drawEnd();

}

var Text = ShapeFactory.make(Shape, ['text', 'font', 'shadowBlur', 'shadowOffsetX', 'shadowOffsetY', 'shadowColor']);
Text.prototype.draw = function(canvas) {

	this.drawStart(canvas);
	this.config.canvas.getContext().font = this.config.font;
	this.config.canvas.getContext().shadowBlur = this.config.textShadowBlur;
	this.config.canvas.getContext().shadowOffsetX = this.config.textShadowOffsetX;
	this.config.canvas.getContext().shadowOffsetY = this.config.textShadowOffsetY;
	this.config.canvas.getContext().shadowColor = this.config.textShadowColor;
	this.config.canvas.getContext().fillText(this.config.text, this.config.x, this.config.y);	
	this.drawEnd();
}