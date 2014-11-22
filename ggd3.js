
// Based on https://github.com/gigamonkey/gg

if (!d3 || !_) { throw 'Requires D3 and Underscore.'; }


// ========
// GRAPHICS
// ========


function Graphic(data, params) {

  if (!data || !params) { throw 'Graphic initialized without data or parameters'; }

  _.defaults(params || {}, { facets: {},  layers: [] });

  this.data = data;
  this.params = params;

  if (params.facets && params.facets.grid) {
    this.facets = new GridFacets(this);
  }

  else if (params.facets && params.facets.flow) {
    this.facets = new FlowFacets(this);
  }

  else {
    this.facets = new SingleFacet(this);
  }

}


// ======
// FACETS
// ======


function Facets() {}


function SingleFacet(graphic) {

  this.graphic = graphic;
  this.data = [{ key: 'single facet', values: graphic.data }];

}


SingleFacet.prototype = new Facets();


function FlowFacets(graphic) {

  var that = this;

  this.graphic = graphic;
  this.field = graphic.params.facets.flow;

  this.data = graphic.data = d3.nest()
    .key(function(row){ return row[that.field] })
    .entries(graphic.data);

}


FlowFacets.prototype = new Facets();


function GridFacets(graphic) {

  var that = this;

  this.graphic = graphic;
  this.xField = graphic.params.facets.grid.x;
  this.yField = graphic.params.facets.grid.y;

  this.data = graphic.data = d3.nest()
    .key(function(row){ return row[that.xField] })
    .key(function(row){ return row[that.yField] })
    .entries(graphic.data);

}


GridFacets.prototype = new Facets();



// ======
// SCALES
// ======


function Scale() {}


function CategoricalScale() {

}


// ======
// CHARTS
// ======



function Chart(data, params) {

  this.data = data;

  // Chart layers consist of a geometry ("line", "bar", "point") 
  // and mappings that relate data fields (e.g. "month", "frequency")
  // to aesthetics (e.g. "x", "color").

  this.layers = params.layers;

}


// ======
// LAYERS
// ======


function Layer(opts) {

  this.geometry = undefined;

  // ================================================================
  // Mapping relates a field in the dataset to an aesthetic (visible
  // attribute) in the graphic. Most commonly this includes x and y
  // coordinates. Can also include color, size, alpha, etc.

  this.mapping = {};

  // Type of scale will be determined automagically based on the
  // aesthetic and the data type, but can also be specified by
  // the user.

  this.scales = {};

}


// ==========
// GEOMETRIES
// ==========


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


// ==============
// RENDER GRAPHIC
// ==============


Graphic.prototype.render = function(el, width, height) {

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

  this.el = el.append('svg');

  this.el
    .attr('width', this.width)
    .attr('height', this.height);

  this.facets.render();

}


// =============
// RENDER FACETS
// =============


Facets.prototype.render = function() {



  this.el = this.graphic.el.selectAll('g.facet');
  this.el
    .data(this.data)
    .enter()
    .append('g')
    .attr('class', 'facet')
    .attr('data-key', function(d) { return d.key; });

}

