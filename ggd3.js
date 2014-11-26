
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


  function Graphic(data, opts) {

    var that = this;
    this.opts = opts;
    this.data = data || [];

    if (this.opts.facets.x || this.opts.facets.y) {

      var facets = d3.nest()
        .key(function(row) { return row[that.opts.facets.x]; })
        .key(function(row) { return row[that.opts.facets.y]; })
        .entries(data || []);

      this.facets = _.map(facets, function(facet, index) {
        return new Facet(facet, index, that);
      });

    }

    else {

      var facets = d3.nest()
        .key(function(row) { return row[that.opts.facets.flow ]; })
        .entries(data || []);

      this.facets = _.map(facets, function(facet, index) {
        return new Facet(facet, index, that);
      });

    }

    this.scales = new Scales(this);

  }


  // ======
  // FACETS
  // ======


  function Facet(data, index, graphic) {
    _.extend(this, data);
    var that = this;
    this.index = index;
    this.graphic = graphic;
    this.layers = _.map(graphic.opts.layers, function(opts, index) { return new Layer(opts, index, that, graphic); });
  }


  // ======
  // LAYERS
  // ======


  function Layer(opts, index, facet, graphic) {
    _.extend(this, opts);
    var that    = this;
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
    this.el.attr('transform', function(facet) {
      return 'translate(' + that.graphic.scales.facets.x(facet.index) + ',' + that.graphic.scales.facets.y(facet.index) + ')';
    });

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
      .attr('cx', function(row) { return that.graphic.scales.layer.x(row[that.layer.mapping.y]); });

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
    this.domain = _.map(graphic.facets, function(facet, index) { return index; });
    this.x = d3.scale.ordinal().domain(this.domain);
    this.y = d3.scale.ordinal().domain(this.domain);
    this.setRange = graphic.opts.facets.x || graphic.opts.facets.y ? setRangeGrid : setRangeFlow;
  }


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


  function setRangeGrid(width, height) {}


  function LayersScale(graphic) {}


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