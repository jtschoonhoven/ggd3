
// Based on https://github.com/gigamonkey/gg


(function () {


  // ===================
  // NODE/BROWSER CONFIG
  // ===================

  var isNode = false;

  // If Node, create a fake DOM with jsdom and require dependencies.
  if (typeof module !== 'undefined' && module.exports) {

    isNode = true;

    document = require('jsdom').jsdom();
    window = document.parentWindow;

    this.d3 = require('d3');
    this._  = require('underscore');

  }


  if (!d3 || !_) { throw 'ggd3 requires D3 and Underscore.'; }
  

  // =======
  // GRAPHIC
  // =======


  // The Graphic constructor is the entry point to ggd3.
  // All arguments are optional.

  function Graphic(opts, data, el, width, height, renderNow) {
    if(opts)      { this.setup(opts); }
    if(data)      { this.data(data); }
    if(el)        { this.build(el, width, height); }
    if(renderNow) { this.render(); }
  }


  Graphic.prototype.setup = function(opts) {
    _.defaults(opts || {}, { facets: {}, layers: [] });
    this.facetsController = new FacetsController(opts);
  };


  Graphic.prototype.data = function(data) {
    if (!_.isArray(data)) { return this.data || []; }
    this.data = data;
    this.facetsController.applyData(data);
  };


  Graphic.prototype.build = function(el, width, height) {

    if (!_.isString(el)) { return this.el; }

    this.target = d3.select(el);

    this.width  = width  || parseInt(this.target.style('width'));
    this.height = height || parseInt(this.target.style('height'));

    this.el = d3.select(document.createElement('div'));
    this.el.append('svg').attr('width', this.width).attr('height', this.height).attr('class', 'graphic');

    this.facetsController.applyElement(this.el, this.width, this.height);

  };


  Graphic.prototype.render = function() { this.target.html(this.el.html()); };


  // ======
  // FACETS
  // ======


  var facetsDefaults = {
    flow: undefined,
    gridX: undefined,
    gridY: undefined
  };


  function Facet(data) {
    _.extend(this, data);
  }


  function FacetsController(opts) {
    _.extend(this, facetsDefaults, opts.facets);
    if (this.gridX || this.gridY) { _.extend(this, new GridFacetController()); }
    else { _.extend(this, new FlowFacetController()); }
    this.layersController = new LayersController(opts);
    this.facets = [];
    this.scale = { x: d3.scale.ordinal(), y: d3.scale.ordinal(), domain: [] };
  }


  function FlowFacetController() {

    this.applyData = function(data) {

      var that = this;

      var facets = d3.nest()
        .key(function(row) { return row[that.flow]; })
        .entries(data);

      facets.forEach(function(facet, index) {
        var facet = new Facet(facet);
        that.layersController.applyData(facet);
        that.scale.domain.push(index);
        that.facets.push(facet);
      });

    };

    this.setRangeX = function(width, height, ratio, numFacets, numCols) {
      var that = this;
      var xRange = this.scale.domain.map(function(index) {
        if (numFacets < ratio) { return index * (width/numFacets); }
        var colNum = index % ratio;
        return (colNum/numCols) * that.width; 
      });
      this.scale.x.range(xRange);
    };

    this.setRangeY = function(width, height, ratio, numFacets, numRows) {
      var yRange = this.scale.domain.map(function(index) {
        var rowNum = Math.floor(index/ratio);
        return (rowNum/numRows) * height;
      });
      this.scale.y.range(yRange);
    };

  }


  FacetsController.prototype.applyElement = function(el, width, height) {

    var that = this;

    var numFacets = this.facets.length;
    var ratio     = width/height >= 1 ? Math.floor(width/height) : 1/Math.floor(height/width);
    var numRows   = ratio >= 1 ? Math.ceil(numFacets/ratio) : Math.ceil(ratio/numFacets);
    var numCols   = Math.ceil(numFacets/numRows);

    this.width  = width/numCols;
    this.height = height/numRows;

    this.setRangeX(width, height, ratio, numFacets, numCols);
    this.setRangeY(width, height, ratio, numFacets, numRows);

    this.el = el.select('svg');
    this.el.selectAll('g.facet')
      .data(this.facets)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(facet) { return facet.key; })
      .attr('transform', function(facet) {
        return 'translate(' + that.scale.x(facet.key) + ',' + that.scale.y(facet.key) + ')';
      })
      .each(function(facet, index) {
        that.layersController.applyElement(facet, this);
      });

  };


  // ======
  // LAYERS
  // ======


  var layerDefaults = {
    geometry: 'point',
    mapping: {}
  };


  function Layer(facet, opts) {
    _.extend(this, opts, facet);
  }


  function LayersController(opts) {
    opts.layers.forEach(function(layerOpts) { _.defaults(layerOpts, layerDefaults); });
    this.layersOptions = opts.layers;
    this.layers = [];
    this.GeometriesController = new GeometriesController(opts);
  }


  LayersController.prototype.applyData = function(facet) {
    var that = this;
    this.layersOptions.forEach(function(layerOpts) {
      var layer = new Layer(facet, layerOpts);
      that.GeometriesController.applyData(layer);
      that.layers.push(layer);
    });
  };


  LayersController.prototype.applyElement = function(facet, el) {
    var that = this;
    this.el = d3.select(el);
    this.el.selectAll('g.layer')
      .data(this.layers)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('data-geometry', function(layer) { return layer.geometry; })
      .each(function(layer) {
        that.GeometriesController.applyElement(layer, this);
      });
  };


  // ==========
  // GEOMETRIES
  // ==========


  var geometriesDefaults = {
    group: undefined
  };


  function Group(data) {
    _.extend(this, data);
  }


  function GeometriesController(opts) {
    _.extend(this, geometriesDefaults);
    this.groups = [];
  };


  GeometriesController.prototype.applyData = function(layer) {

    var that = this;
    var groups = d3.nest().key(function(row) { return row[that.group]; }).entries(layer.values);

    groups.forEach(function(data, index) {
      var group = new Group(data);
      that.groups.push(group);
    });

  };


  GeometriesController.prototype.applyElement = function(layer, el) {
    this.el = d3.select(el);
    this.el.selectAll('g.group')
      .data(this.groups)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('data-group', function(group) { return group.key; });
  };


  // =============
  // EXPORT GLOBAL
  // =============


  // Export as Node module.
  if (isNode) {
    module.exports = Graphic;
  }

  // Export to global context.
  this.Graphic = Graphic;


})();