
// Based on https://github.com/gigamonkey/gg

if (!d3 || !_) { throw 'Requires D3 and Underscore.'; }


function Facets(data, opts) {

  this.data = data;

  // Mapping a field in the dataset to a type of facet will
  // create a separate chart for each unique value in that field.
  // Possible facets are "flow", "x", and "y". It is possible to
  // specify an x *and* a y, but neither may combine with flow.

  this.mapping = {};

  // An array that contains individual facets i.e. instances of
  // the Chart class.

  this.facets = [];

}


function Chart(data, opts) {

  this.data = data;

  // Data will be represented among one or more layers. Each layer
  // has a geometry and a mapping that relates fields to aesthetics.
  // For example, a Chart may have both line and point geometries.
  // Subsequent layers are positioned on top of previous layers.

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


// Render a chart to the given element.
// If width & height are provided, will render an SVG of those
// dimensions. Otherwise, use the current dimensions of the el.
Chart.prototype.render = function(el, width, height) {

  this.el = el;

  if (width && height) {
    this.width  = width;
    this.height = height;
  }

  else {
    this.width  = el.style('width');
    this.height = el.style('height');
  }

  this.el.append('svg');

}


Facets.prototype.render = function(el, width, height) {

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

  // "Flowing" facets will render inside of floated divs.
  // Cartesian facets ("x" or "y") render inside a table.
  // If no mapping is chosen, render chart directly in el.

  if (this.mapping.flow) {
    var facets = el.selectAll('div.facet.flow');
    facets
      .data(this.facets)
      .enter()
      .append('div')
      .attr('class', 'facet flow');
  }

  else if (this.mapping.x || this.mapping.y) {
    var facets = el.append('table.facets.grid');
    facets
      .data([1])
      .enter()
      .append('table')
      .attr('class', 'facets grid');
  }

  else {
    // Render a chart.
  }



}

