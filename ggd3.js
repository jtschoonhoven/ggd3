
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
      this.facets = new FlowFacets(this);
    }


  }


  Graphic.prototype.onRender = function() {};


  // ======
  // FACETS
  // ======


  function Facets() {}


  function FlowFacets(graphic) {

    var that = this;

    this.graphic = graphic;
    this.data = graphic.data;

    var facet = graphic.params.facets ? graphic.params.facets.flow : undefined;

    this.domain = _.uniq(_.map(this.data, function(row) { return row[facet]; }));
    this.charts = this.domain.map(function(key) { return new Chart(that, key); });

    this.x = new CategoricalScale(this.data, facet);
    this.y = new CategoricalScale(this.data, facet);

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
    this.data = graphic.data;

    this.x, new CategoricalScale(this.data, this.graphic.params.facets.x);
    this.y, new CategoricalScale(this.data, this.graphic.params.facets.y);

  }

  GridFacets.prototype = new Facets();


  // ======
  // CHARTS
  // ======


  function Chart(facets, key) {

    var that = this;

    this.facets = facets;
    this.data = facets.data;
    this.key = key;

    var layerOpts = facets.graphic.params.layers || [];
    this.layers = layerOpts.map(function(opts) { return new Layer(that, opts); });

  }


  // ======
  // LAYERS
  // ======


  function Layer(chart, opts) {

    this.chart = chart;
    this.data = chart.data;

    this.mapping = opts.mapping || {};

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


  // ==========
  // GEOMETRIES
  // ==========


  function Geometry() {}

  Geometry.prototype.initialize = function() {

    this.color = this.layer.mapping.color;
    this.colors = new ColorScale(this.data, this.color);

    this.group = this.layer.mapping.group;
    this.groups = d3.nest().key(function(row) { return row[this.group]; }).entries(this.data);

  };


  // =================
  // GEOMETRIES: POINT
  // =================


  function PointGeometry(layer) {
    this.type = 'point';
    this.layer = layer;
    this.data = layer.data;
    this.initialize();
  }

  PointGeometry.prototype = new Geometry();


  // ======
  // SCALES
  // ======


  function Scale() {}


  // ===================
  // SCALES: CATEGORICAL
  // ===================


  function CategoricalScale(data, key) {
    this.key = key;
    this.scale = d3.scale.ordinal();
    this.domain = _.uniq(_.map(data, function(row) { return row[key]; }));
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
    this.scale = d3.scale.category20();
    this.domain = _.uniq(_.map(data, function(row) { return row[key]; }));
    this.scale.domain(this.domain);
  }

  ColorScale.prototype = new Scale();


  // ==============
  // RENDER GRAPHIC
  // ==============


  Graphic.prototype.render = function(el, width, height) {

    this.onRender();

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


  Facets.prototype.onRender = function() {

    this.width = parseInt(this.graphic.width);
    this.height = parseInt(this.graphic.height);

    this.ratio = this.width/this.height >= 1 ? Math.floor(this.width/this.height) : 1/Math.floor(this.height/this.width);

    this.numRows = this.ratio >= 1 ? Math.ceil(this.y.domain.length/this.ratio) : Math.ceil(this.ratio/this.y.domain.length);
    this.numCols = Math.ceil(this.x.domain.length/this.numRows);

    this.x.scale.range(this.xRange());
    this.y.scale.range(this.yRange());

  };


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
      })
      .each(function(chart, index) {
        chart.render(this, index);
      });

  };


  // =============
  // RENDER CHARTS
  // =============


  Chart.prototype.onRender = function() {
    this.width = this.facets.width / this.facets.numCols;
    this.height = this.facets.height / this.facets.numRows;
  };


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


  Layer.prototype.onRender = function() {
    this.x.scale.range(this.xRange());
    this.y.scale.range(this.yRange());
  };


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
      .data(this.groups)
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
      .attr('fill', function(row) { return that.colors.scale(row[that.color.key]); })
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