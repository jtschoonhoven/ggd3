
// Based on https://github.com/gigamonkey/gg


(function () {


  // ===================
  // NODE/BROWSER CONFIG
  // ===================

  var isNode = false;

  // If Node, get dependencies, add to globals and export gg.
  if (typeof module !== 'undefined' && module.exports) {
    isNode = true;
    this.d3 = require('d3');
    this._  = require('underscore');
  }

  if (!d3 || !_) { throw 'GGD3 requires D3 and Underscore.'; }


  // ========
  // GRAPHICS
  // ========


  function Graphic(data, params) {

    this.data = data || [];
    this.params = params || {};

    if (this.params.facets && this.params.facets.grid) {
      this.facets = new GridFacets(this);
    }

    else if (this.params.facets && this.params.facets.flow) {
      this.facets = new FlowFacets(this);
    }

    else {
      this.facets = new SingleFacet(this);
    }

  }


  // ======
  // FACETS
  // ======


  function Facets() {
    this.scale = {};
    this.scale.x = d3.scale.ordinal();
    this.scale.y = d3.scale.ordinal();
    this.setRange = _.noop;
  }


  function SingleFacet(graphic) {

    this.graphic = graphic;
    this.data = [{ key: 'single facet', values: graphic.data }];

    // Scales simply return 0 because there is only one facet.
    this.scale.x.range([0]);
    this.scale.y.range([0]);

  }


  SingleFacet.prototype = new Facets();


  function FlowFacets(graphic) {

    var that = this;

    this.graphic = graphic;
    this.field = graphic.params.facets.flow;

    // Nest the data so that facet fields are at the first level
    // of the object hierarchy.
    this.data = graphic.data = d3.nest()
      .key(function(row){ return row[that.field]; })
      .entries(graphic.data);

    // Get the unique facet values from the nested data.
    // These form the scale domain.
    var domain = this.data.map(function(facet) { return facet.key; });
    this.scale.x.domain(domain);
    this.scale.y.domain(domain);

    // Range depends on the width of the target element and so
    // can't be computed until render() is called.

    this.setRange = function() {

      var that = this;
      var width = parseInt(graphic.width);
      var height = parseInt(graphic.height);

      // Get the ratio of width to height.
      // Ratio happens to answer the question, "how many
      // facet columns are there for every facet row?"
      var aspectRatio = Math.floor(width/height) || 1;

      var rangeX = domain.map(function(d,i) {
        return domain.length < aspectRatio ? i * (width/domain.length) : (i%aspectRatio) * (width/aspectRatio); 
      });

      var rangeY = domain.map(function(d,i) { 
        return Math.floor(i / aspectRatio) * (domain.length/aspectRatio) * height; 
      });

      this.scale.x.range(rangeX);
      this.scale.y.range(rangeY); 

    };


  }


  FlowFacets.prototype = new Facets();


  function GridFacets(graphic) {

    var that = this;

    this.graphic = graphic;
    this.xField = graphic.params.facets.grid.x;
    this.yField = graphic.params.facets.grid.y;

    this.data = graphic.data = d3.nest()
      .key(function(row){ return row[that.xField]; })
      .key(function(row){ return row[that.yField]; })
      .entries(graphic.data);

  }


  GridFacets.prototype = new Facets();


  // ======
  // SCALES
  // ======


  function Scale() {
    this.domain = [];
    this.range = [];
  }


  function CategoricalScale(graphic) {

    this.scale = d3.scale.ordinal();

  }


  CategoricalScale.prototype = new Scale();


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

    return this;

  };


  // =============
  // RENDER FACETS
  // =============


  Facets.prototype.render = function() {

    var that = this;

    // Now that the element width is defined we can set
    // the range of the facet scale.
    this.setRange();

    this.el = this.graphic.el.selectAll('g.facet');
    this.el
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(d) { return d.key; })
      .attr('transform', function(d, i) { 
        return 'translate(' + that.scale.x(d.key) + ',' + that.scale.y(d.key) + ')'; 
      });

  };


  // ===
  // API
  // ===


  // Export as Node module.
  if (isNode) {
    module.exports = Graphic;
  }

  // Export to global context.
  this.Graphic = Graphic;



})();