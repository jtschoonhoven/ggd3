
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
  

  // =======
  // GRAPHIC
  // =======


  var graphicDefaults = {
    flow: undefined,  // Facet in no particular order.
    gridX: undefined, // Facet and lock to horizontal grid.
    gridY: undefined  // Facet and lock to vertical grid.
  };


  function Graphic(data, opts) {

    opts = _.defaults(opts || {}, { graphic: {}, layers: [] });
    _.extend(this, graphicDefaults, opts.graphic);

    if (this.gridX || this.gridY) { 
      this.createGridFacets(data, opts); 
    }

    else { 
      this.createFlowFacets(data, opts); 
    }

  }
  

  Graphic.prototype.scale = {
    domain: _.map(this.facets, function(facet, index) { return index; }),
    x: d3.scale.ordinal().domain(this.domain);
    y: d3.scale.ordinal().domain(this.domain);
  };


  Graphic.prototype.createGridFacets = function(data, opts) {

    var that = this;
    var facets = d3.nest()
      .key(function(row) { return row[that.gridX]; })
      .key(function(row) { return row[that.gridY]; })
      .entries(data || []);

    this.facets = _.map(facets, function(facet, index) { 
      return new GridFacet(facet, index, opts); 
    });

    this.scale.setRange = setRangeGrid;

  };


  Graphic.prototype.createFlowFacets = function(data, opts) {

    var that = this;
    var facets = d3.nest()
      .key(function(row) { return row[that.flow]; })
      .entries(data || []);

    this.facets = _.map(facets, function(facet, index) { 
      return new FlowFacet(facet, index, opts);
    });

    this.scale.setRange = setRangeFlow;

  };


  function setRangeFlow(width, height) {

    var that    = this;
    var ratio   = width/height >= 1 ? Math.floor(width/height) : 1/Math.floor(height/width);
    var numRows = ratio >= 1 ? Math.ceil(this.domain.length/ratio) : Math.ceil(ratio/this.domain.length);
    var numCols = Math.ceil(this.domain.length/numRows);

    this.width  = width/numCols;
    this.height = height/numRows;

    var xRange = this.domain.map(function(index) {
      if (that.domain.length < ratio) { return index * (width/that.domain.length); }
      var colNum = index % ratio;
      return (colNum/numCols) * that.width; 
    });

    var yRange = this.domain.map(function(index) {
      var rowNum = Math.floor(index/ratio);
      return (rowNum/numRows) * height;
    });

    this.x.range(xRange);
    this.y.range(yRange);

  }


  // ======
  // FACETS
  // ======


  function Facet() {}

  Facet.prototype.initialize = function(data, opts, index) {
    _.extend(this, opts.facets);
    this.index = index;
    this.layers = _.map(opts.layers, function(opts, index) {
      return new Layer(data, opts, index);
    });
  };


  // ============
  // FACETS: FLOW
  // ============


  function FlowFacet(data, opts, index) {
    this.initialize(data, opts, index);
  }


  FlowFacet.prototype = new Facet();


  // ============
  // FACETS: GRID
  // ============


  function GridFacet(data, opts, index) {
    this.initialize(data, opts, index);
  }

  GridFacet.prototype = new Facet();


  // ==========
  // STATISTICS
  // ==========


  // Eventually, a statistics object will sit between facets and layers.
  function Statistic() {}


  // ======
  // LAYERS
  // ======


  function Layer(data, opts, index) {
    _.extend(this, opts, data);
    console.log(this)
    this.facet  = facet;
    this.index  = index;
    this.graphic = graphic;
    var groups  = d3.nest().key(function(row) { return row[that.mapping.group]; }).entries(facet.values);
    this.groups = _.map(groups, function(data, index) {
      return new PointGroup(data, index, that, graphic);
    });
  }


  // ============
  // GROUP: POINT
  // ============


  function PointGroup(data, index, layer, graphic) {
    _.extend(this, data);
    this.index = index;
    this.layer = layer;
    this.graphic = graphic;
  }


  // ===============
  // RENDER: GRAPHIC
  // ===============


  Graphic.prototype.render = function(el, width, height) {

    var that = this;

    // If width and height are given, draw graphic to those dimensions.
    // Otherwise set to the current dimensions of the element.

    if (width && height) {
      this.width  = width;
      this.height = height;
    }

    else {
      this.width  = parseInt(el.style('width'));
      this.height = parseInt(el.style('height'));
    }

    // With dimensions set, scale ranges may now be applied.

    this.scales.facets.setRange(this.width, this.height);

    this.el = el.append('svg').attr('class', 'graphic');
    this.el
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'graphic');

    this.el.selectAll('g.facet')
      .data(this.facets)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(facet) { return facet.key; })
      .attr('transform', function(facet) {
        return 'translate(' + that.scale.x(facet.index) + ',' + that.scale.y(facet.index) + ')';
      })
      .each(function(facet) {
        facet.render(this);
      });

  };


  // ==============
  // RENDER: FACETS
  // ==============


  Facet.prototype.render = function(el) {

    var that = this;

    this.el = d3.select(el);
    this.el.selectAll('g.layer')
      .data(this.layers)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('data-geometry', function(opts) { return opts.geometry; })
      .each(function(layer, index) {
        layer.render(this, index); 
      });

  };


  // ==============
  // RENDER: LAYERS
  // ==============


  Layer.prototype.render = function(el, index) {
    var that = this;
    this.el = d3.select(el);
    this.el.selectAll('g.group')
      .data(this.groups)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('data-group', function(group) { return group.key; })
      .each(function(group, index) {
        group.render(this, index);
      });
  };


  // =====================
  // RENDER: GROUPS: POINT
  // =====================


  PointGroup.prototype.render = function(el, index) {
    var that = this;
    this.el = d3.select(el);
    this.el.selectAll('circle.point')
      .data(this.values)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('data-value', function(row) { return row[that.layer.mapping.y]; })
      .attr('data-x', function(row) { return row[that.layer.mapping.x]; })
      // .attr('cx', function(row) { return that.graphic.scales.layer.x(row[that.layer.mapping.y]); });

  };


  // ======
  // SCALES
  // ======


  function Scales(graphic) {
    this.facets = new FacetsScale(graphic);
    this.layers = new LayersScale(graphic);
  }


  // ==============
  // SCALES: FACETS
  // ==============


  function FacetsScale(graphic) {

  }


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