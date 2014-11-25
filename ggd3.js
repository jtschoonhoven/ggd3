
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


  function Graphic(data, spec) {

    this.data = data || [];
    this.spec = new Spec(spec);

    if (this.spec.facets.x || this.spec.facets.y) {
      this.facets = new GridFacets(this);
    }

    else {
      this.facets = new FlowFacets(this);
    }

  }


  // ====
  // SPEC
  // ====


  function Spec(opts) {
    _.extend(this, opts);
    this.facets = _.defaults(this.facets || {}, { flow: undefined });
  }


  // ======
  // FACETS
  // ======


  function Facets(graphic) {}

  Facets.prototype.initialize = function() {
    this.x = new CategoricalScale(this.data, 'key');
    this.y = new CategoricalScale(this.data, 'key');
  };


  // Calculate the dimensions of the facet group and apply scale range.
  Facets.prototype.onRender = function() {

    this.width = parseInt(this.graphic.width);
    this.height = parseInt(this.graphic.height);

    // The (rounded) ratio of width to height is used to determine
    // how facets are arranged across the graphic.
    this.ratio = this.width/this.height >= 1 ? Math.floor(this.width/this.height) : 1/Math.floor(this.height/this.width);

    // Calculate the number of rows and cols based on the aspect ratio.
    this.numRows = this.ratio >= 1 ? Math.ceil(this.y.domain.length/this.ratio) : Math.ceil(this.ratio/this.y.domain.length);
    this.numCols = Math.ceil(this.x.domain.length/this.numRows);

    // Calculate the range of the x and y scales.
    this.x.scale.range(this.xRange());
    this.y.scale.range(this.yRange());

  };


  function FlowFacets(graphic) {

    var that = this;
    this.graphic = graphic;
    this.field = graphic.spec.facets.flow;

    // Nest the data so that facets are at the top of the tree.
    this.data = graphic.data = d3.nest()
      .key(function(row){ return row[that.field]; })
      .entries(graphic.data);

    // Create an instance of Chart for each key in this.data.
    this.charts = this.data.map(function(data) {  return new Chart(that, data); });

    this.initialize();

  }


  FlowFacets.prototype = new Facets();


  FlowFacets.prototype.xRange = function() {
    var that = this;
    return this.x.domain.map(function(d, i) {
      if (that.x.domain.length < that.ratio) { return i * (that.width/that.x.domain.length); }
      var colNum = i % that.ratio;
      return (colNum/that.numCols) * that.width; 
    });
  };


  FlowFacets.prototype.yRange = function() {
    var that = this;
    return this.y.domain.map(function(d, i) {
      var rowNum = Math.floor(i/that.ratio);
      return (rowNum/that.numRows) * that.height;
    });
  };




  function GridFacets(graphic) {

    var that = this;

    this.graphic = graphic;

    this.xField = graphic.spec.facets.grid.x;
    this.yField = graphic.spec.facets.grid.y;

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
    this.data;
    this.scale;
    this.domain;
  }


  // ===================
  // SCALES: CATEGORICAL
  // ===================


  function CategoricalScale(data, key) {
    this.key = key;
    this.scale = d3.scale.ordinal();
    this.domain = data.map(function(row) { return row[key]; });
    this.scale.domain(this.domain);
  }

  CategoricalScale.prototype = new Scale();


  // ==============
  // SCALES: LINEAR
  // ==============


  function LinearScale(data, key) {
    this.key = key;
    this.scale = d3.scale.linear();
    this.domain = d3.extent( data.map(function(row) { return row[key]; }) );
    this.scale.domain(this.domain);
  }

  LinearScale.prototype = new Scale();


  // =============
  // SCALES: COLOR
  // =============


  function ColorScale(data, key) {
    this.key = key;
    this.scale = d3.scale.category10();
    this.domain = data.map(function(row) { return row[key]; });
    this.scale.domain(this.domain);
  }

  LinearScale.prototype = new Scale();


  // ======
  // CHARTS
  // ======


  function Chart(facets, data) {

    var that = this;

    this.facets = facets;
    this.key = data.key;
    this.data = data.values;

    var layerOpts = facets.graphic.spec.layers || [];
    this.layers = layerOpts.map(function(opts) { return new Layer(that, opts); });

  }


  Chart.prototype.onRender = function() {
    this.width = this.facets.width / this.facets.numCols;
    this.height = this.facets.height / this.facets.numRows;
  };


  // ======
  // LAYERS
  // ======


  function Layer(chart, opts) {

    this.chart = chart;
    this.data = chart.data;

    this.mapping = opts.mapping || {};
    this.scale = {};

    this.x = new LinearScale(this.data, this.mapping.x);
    this.y = new LinearScale(this.data, this.mapping.y);

    if (opts.geometry === 'point') {
      this.geometry = new PointGeometry(this);
    }

    else {
      this.geometry = new PointGeometry(this);
    }

    this.xRange = function() { return [0, this.chart.width]; };
    this.yRange = function() { return [this.chart.height, 0]; };

  }


  Layer.prototype.onRender = function() {
    this.x.scale.range(this.xRange());
    this.y.scale.range(this.yRange());
  };



  // ==========
  // GEOMETRIES
  // ==========


  function Geometry() {}

  Geometry.prototype.onRender = function() {};

  Geometry.prototype.initialize = function() {
    var color = this.layer.mapping.color;
    this.color = new ColorScale(this.data, color);
  };


  // =================
  // GEOMETRIES: POINT
  // =================


  function PointGeometry(layer) {

    var that = this;

    this.layer = layer;
    this.type = 'point';

    // Nest data by "group" mapping.
    this.data = d3.nest()
      .key(function(row){ return row[that.layer.mapping.group]; })
      .entries(layer.data);

    this.initialize();

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
      .attr('height', this.height)
      .attr('class', 'graphic');

    this.facets.render();

  };


  // =============
  // RENDER FACETS
  // =============


  Facets.prototype.render = function() {

    var that = this;
    this.onRender();

    // Create a "facet" group bound to each chart in this.charts.
    this.el = this.graphic.el.selectAll('g.facet');
    this.el
      .data(this.charts)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(chart) { return chart.key; })
      .attr('transform', function(chart) { 
        return 'translate(' + that.x.scale(chart.key) + ',' + that.y.scale(chart.key) + ')'; 
      })
      .each(function(chart, index) { 
        chart.render(this, index); 
      });

  };


  // =============
  // RENDER CHARTS
  // =============


  Chart.prototype.render = function(el, index) {

    var that = this;
    this.onRender();

    this.el = d3.select(el);
    this.el.selectAll('g.layers')
      .data(this.layers)
      .enter()
      .append('g')
      .attr('class', 'layers')
      .each(function(layer, index) { 
        layer.render(this, index); 
      });

  };


  // =============
  // RENDER LAYERS
  // =============


  Layer.prototype.render = function(el, index) {

    this.onRender();

    var that = this;

    this.el = d3.select(el).append('g').attr('class', 'layer');
    this.el
      .attr('data-geometry', function(d){ return d.geometry.type; });

    this.geometry.render(this.el);

  };


  // =====================
  // RENDER POINT GEOMETRY
  // =====================


  PointGeometry.prototype.render = function(el) {

    var that = this;
    this.el = el;

    var groups = this.el.selectAll('g.group')
      .data(this.data)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('data-group', function(group){ return group.key; });

    groups.selectAll('circle')
      .data(function(group) { return group.values; })
      .enter()
      .append('circle')
      .attr('cx', function(row) { return that.layer.x.scale(row[that.layer.x.key]); })
      .attr('cy', function(row) { return that.layer.y.scale(row[that.layer.y.key]); })
      .attr('r', 3)
      .attr('fill', function(row) { return that.color.scale(row[that.color.key]); })
      .attr('stroke', 'none');

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