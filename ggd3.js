
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


  Graphic.prototype.onRender = function() {};


  // ======
  // FACETS
  // ======


  function Facets() {
    // Listing methods here for clarity.
    this.charts;
    this.x;
    this.y;
    this.xRange;
    this.yRange;
    this.initialize;
    this.onRender;
  }


  Facets.prototype.initialize = function() {
    // Facets use x and y categorical scales to arrange themselves
    // across the graphic.
    this.x = new CategoricalScale(this.graphic, this.data);
    this.y = new CategoricalScale(this.graphic, this.data);
  };


  Facets.prototype.onRender = function() {

    this.width = parseInt(this.graphic.width);
    this.height = parseInt(this.graphic.height);

    // The (rounded) ratio of width to height is used to determing
    // how facets are arranged across the graphic.
    this.ratio = Math.floor(this.width/this.height) || 1;

    // Calculate the range of the x and y scales.
    this.x.scale.range(this.xRange());
    this.y.scale.range(this.yRange());

  };


  function SingleFacet(graphic) {

    this.graphic = graphic;
    this.data = [{ key: undefined, values: graphic.data }];
    this.charts = [ new Chart(this, this.data) ];

    // Range always returns 0 for a singleFacet.
    this.xRange = function() { return [0]; };
    this.yRange = function() { return [0]; };

    this.initialize();

  }


  SingleFacet.prototype = new Facets();


  function FlowFacets(graphic) {

    var that = this;

    this.graphic = graphic;
    this.field = graphic.params.facets.flow;

    // Nest the data so that facets are at the top of the tree.
    this.data = graphic.data = d3.nest()
      .key(function(row){ return row[that.field]; })
      .entries(graphic.data);

    // Create an instance of Chart for each key in this.data.
    this.charts = this.data.map(function(d) { return new Chart(that, d); });


    // Returns the range of the x scale.
    this.xRange = function() {
      return this.x.domain.map(function(d, i) {
        return that.x.domain.length < that.ratio ? i * (that.width/that.x.domain.length) : (i%that.ratio) * (that.width/that.ratio); 
      });
    };

    this.yRange = function() {
      return this.y.domain.map(function(d, i) {
        return Math.floor(i/that.ratio) * (that.y.domain.length/that.ratio) * that.height;
      });
    };

    this.initialize();

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


    this.initialize();

  }


  GridFacets.prototype = new Facets();


  // ======
  // SCALES
  // ======


  function Scale() {
    this.graphic;
    this.data;
    this.scale;
    this.domain;
  }


  function CategoricalScale(graphic, data) {
    this.graphic = graphic;
    this.data = data;
    this.scale = d3.scale.ordinal();
    this.domain = data.map(function(category) { return category.key; });
    this.scale.domain(this.domain);
  }


  CategoricalScale.prototype = new Scale();


  // ======
  // CHARTS
  // ======



  function Chart(facet) {

    this.facet = facet;
    this.data = facet.data;
    this.values = facet.data.values;

    // Chart layers consist of a geometry ("line", "bar", "point") 
    // and mappings that relate data fields (e.g. "month", "frequency")
    // to aesthetics (e.g. "x", "color").

    this.initialize();

  }

  Chart.prototype.initialize = function() {};

  Chart.prototype.onRender = function() {};


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

    if (this.onRender) { this.onRender(); }

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

  };


  // =============
  // RENDER FACETS
  // =============


  Facets.prototype.render = function() {

    var that = this;
    this.onRender();

    this.el = this.graphic.el.selectAll('g.facet');
    this.el
      .data(this.charts)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(chart) { return chart.key; })
      .attr('transform', function(chart) { 
        return 'translate(' + that.x.scale(chart.key) + ',' + that.y.scale(chart.key) + ')'; 
      });

    this.charts.forEach(function(chart) { chart.render(); });

  };


  // =============
  // RENDER CHARTS
  // =============


  Chart.prototype.render = function() {

    this.onRender();
    
    var that = this;

    this.el = this.facet.graphic.el.selectAll('g.chart');
    this.el
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'chart')
      .attr('data-key', this.key);

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