
// Based on https://github.com/gigamonkey/gg

if (!d3 || !_) { throw 'Requires D3 and Underscore.'; }


function Graphic(data, opts) {

  this.data = data;

  // Graphic mapping relates a field in the data source to a facet
  // aesthetic ("flow", "x", or "y"). Most often this will be left
  // empty and the graphic will render in a single facet (chart).

  this.mapping = {};

  // Graphic layers primarily consist of charts (which in turn)
  // contain their own sublayers) and axes.

  this.facets = [];

}


function Chart(data, opts) {

  this.data = data;

  // Chart layers consist of a geometry ("line", "bar", "point") 
  // and mappings that relate data fields (e.g. "month", "frequency")
  // to aesthetics (e.g. "x", "color").

  this.layers = [];

}


// A layer 
function Layer(opts) {

  this.geometry = undefined;

  // Layer mapping relates a field in the data source to an aesthetic
  // on the geometry. E.g. a "month" field would usually relate to the
  // "x" aesthetic of the geometry. A "frequency" field might map to 
  // the "color" aesthetic.

  this.mapping = {};

  // Type of scale will be determined automagically based on the
  // aesthetic and the data type, but can also be specified by
  // the user.

  this.scales = {};

}


// Geometry sets the shape or path that represents a value.
// A "point" geometry forms a scatterplot, "bar" a bar chart, etc.

function Geometry() {}


function PointGeometry(opts) {

  this.x     = opts.x     || 0;
  this.y     = opts.y     || 0;
  this.color = opts.color || 'black';
  this.size  = opts.size  || 3;
  this.alpha = opts.alpha || 1;

}


PointGeometry.prototype = new Geometry();


function Aesthetic() {}


function ColorAesthetic() {
  this.scale = {};
}


Chart.prototype.render = function(el, width, height) {}


Graphic.prototype.render = function(el, width, height) {

  this.el = el;

  // If width and height are given, draw facets to those dimensions.
  // Otherwise set to the current dimensions of the element.

  if (width && height) {
    this.width  = width;
    this.height = height;
  }

  else {
    this.width  = el.style('width');
    this.height = el.style('height');
  }

  this.svg = el.append('svg');
  this.svg
    .attr('width', this.width)
    .attr('height', this.height);

  this.facets = this.svg.selectAll('g.facet');
  this.facets
    .data(this.facets)
    .enter()
    .append('g')
    .attr('class', 'facet');

  // needs to split up the el into equal portions (less axis) for
  // facets. If w/h > 1.5

}

