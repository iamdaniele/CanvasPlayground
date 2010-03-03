var Layer = function(id) {
	this.id = id;
	this.shapes = {};
	this.hidden = false;
};

Layer.prototype = {
	getId: function() { return this.id; },
	getShapes: function() { return this.shapes; },
	addShape: function(shape) { 
		if(!(shape instanceof Shape)) {
			throw new Error('Object is not a Shape');
			return false;
		}

		if(!this.shapes[shape.getId()] || this.shapes[shape.getId()] == null) {
			this.shapes[shape.getId()] = shape;                                  
		}
	},

	removeShape: function(shape) {
		if(this.shapes[shape.getId()] && this.shapes[shape.getId()] !== null) {
			this.shapes[shape.getId()] = null;
		}
		return shape;
	},
	toggle: function() { this.hidden = !this.hidden; },
	isHidden: function() { return this.hidden; },
	show: function() { this.hidden = false; },
	hide: function() { this.hidden = true; },
	draw: function(canvas) {
		for(var i in this.shapes) {
			if(this.shapes[i] != null) {
				this.shapes[i].draw(canvas, this.id);
			}
		}
	}
};

var Canvas = function(id, width, height) {

	this.canvas = document.getElementById(id);
	if(this.canvas == null || this.canvas.tagName.toLowerCase() != 'canvas') {
		this.canvas = document.createElement('canvas');		
		this.canvas.id = id;
		document.body.appendChild(this.canvas);
	}

	if(this.canvas.width && this.canvas.height) {
		this.canvas.width = width;
		this.canvas.height = height;               
	}
	else {
		throw new Error('Width and/or height missing');
		return null;
	}
	
	this.layers = [new Layer(0)];
	return this;
};

Canvas.prototype = {
	
	addShape: function(shape, index) {

		index = index || this.layers.length - 1;
		
		if(!this.layers[index] || this.layers[index] == null) {
			throw new Error('Invalid Layer index supplied');
			return false;		   
		}
		shape.layer(index);
		shape.draw(this);
		this.layers[index].addShape(shape);
	},
	
	getContext: function(context) {
		context = context || '2d';
		return this.canvas.getContext(context);
	},

	hideShape: function(shape) {
		this.canvas.width = this.canvas.width;

		for(var l = 0; l < this.layers.length; l++) {
			this.layers[l].draw();
		}
	},
	
	removeShape: function(shape) {
		this.hideShape(shape);
		this.layers[shape.layer()].removeShape(shape);
	},

	createLayer: function() {
		this.layers.push(new Layer(this.layers.length));
		return this.layers.length - 1;
	},

	deleteLayer: function(index) {
		if(this.layers.length == 1) {
			throw new Error('Base layer cannot be removed');
			return false;
		}

		this.hideLayer(index);
		this.layers[index] = null;
	},
 
    drawLayers: function() {
		this.canvas.width = this.canvas.width;

		for(var l = 0; l < this.layers.length; l++) {
			if(this.layers[l].isHidden()) continue;
			this.layers[l].draw(this);
		}
	},
	
	showLayer: function(index) {
 		if(!this.layers[index] || this.layers[index] == null) {
			throw new Error('Invalid Layer index supplied');
			return false;		   
		}		
	    
		if(this.layers[index].isHidden()) {
			this.layers[index].show();
			this.drawLayers();                 
	    }
	},

	hideLayer: function(index) {
 		if(!this.layers[index] || this.layers[index] == null) {
			throw new Error('Invalid Layer index supplied');
			return false;		   
		}		
	    
		if(!this.layers[index].isHidden()) {
			this.layers[index].hide();
			this.drawLayers();                
		}
	}
}