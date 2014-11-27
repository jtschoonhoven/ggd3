
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

  // The Graphic constructor is the entry point to ggd3.
  // All arguments are optional.

  function Graphic(opts, data, el, width, height) {

    // These arguments map to the three methods on a new Graphic.
    // opts() configures the graphic's controllers so that it knows
    // how to handle the data applied by the data() method. Render()
    // creates an SVG in the given element.

    if(opts) { this.opts(opts); }
    if(data) { this.data(data); }
    if(el)   { this.render(el, width, height); }

  }

  // =============
  // GRAPHIC: OPTS
  // =============


  Graphic.prototype.opts = function(opts) {
    this.opts = _.defaults(opts || {}, { facets: {}, layers: {}, groups: {}, shapes: {}, scales: {} });
    this.facets = new FacetsController(opts);
  };


  // =============
  // GRAPHIC: DATA
  // =============


  Graphic.prototype.data = function(data) { 
    this.data = data;
    this.facets.data(data); 
  };


  // ======
  // FACETS
  // ======


  var facetDefaults = {
    flow: undefined,
    gridX: undefined,
    gridY: undefined
  };


  // ==================
  // FACETS: CONTROLLER
  // ==================


  function FacetsController(opts) {
    _.extend(this, facetDefaults, opts.facets);
    this.collection = [];
    this.scale = new FacetsScale();
    this.setRange = this.gridX || this.gridY ? setRangeFlow : setRangeGrid;
    // _.bind(this.setRange, this);
  }


  function Facet(data, opts) {
    _.extend(this, data);
    this.layers = new LayersController(opts);
  }


  // ============
  // FACETS: DATA
  // ============


  FacetsController.prototype.data = function(data) {

    var that = this;
    var facets;

    if (this.gridX || this.gridY) {

      facets = d3.nest()
        .key(function(row) { return row[that.gridX]; })
        .key(function(row) { return row[that.gridY]; })
        .entries(data);

      facets.forEach(function(facet) { 
        that.scale.domain.push(facet.key);
        that.collection.push(new Facet(facet, that.opts));
      });

    } else {

      facets = d3.nest()
        .key(function(row) { return row[that.flow]; })
        .entries(data);

      facets.forEach(function(facet) {
        that.scale.domain.push(facet.key);
        that.collection.push(new Facet(facet, that.opts));
      });

    }

  };


  function FacetsScale() {
    this.x = d3.scale.ordinal();
    this.y = d3.scale.ordinal();
    this.domain = [];
    this.range = [];
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

    this.scale.x.range(xRange);
    this.scale.y.range(yRange);

  }


  function setRangeGrid(width, height) {}


  // ==============
  // FACETS: RENDER
  // ==============


  FacetsController.prototype.render = function(el, width, height) {

    var that = this;

    this.setRange(width, height);

    this.el = el.selectAll('g.facet');
    this.el
      .data(this.collection)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(facet) { return facet.key; })
      .attr('transform', function(facet) { 
        return 'translate(' + that.scale.x(facet.key) + ',' + that.scale.y(facet.key) + ')'; 
      })
      .each(function() {
        that.layers.render(this, this.width, this.height);
      });

  };


  // =================
  // LAYERS CONTROLLER
  // =================


  var layerDefaults = {};


  function LayersController(opts) {
    this.model = Layer;
    this.collection = [];
    this.groups = new GroupsController(opts);
  }


  function Layer() {}


  // =================
  // GROUPS CONTROLLER
  // =================


  var groupsDefaults = {};


  function GroupsController(opts) {
    this.model = Group;
    this.collection = [];
  }


  function Group() {}


  // ===============
  // GRAPHIC: RENDER
  // ===============


  Graphic.prototype.render = function(el, width, height) {

    // If width and height are given, draw facets to those dimensions.
    // Otherwise set to the current dimensions of the element.

    if (width && height) {
      this.width  = width;
      this.height = height;
    }

    else {
      this.width  = parseInt(d3.select(el).style('width'));
      this.height = parseInt(d3.select(el).style('height'));
    }

    this.el = d3.select(el).append('svg');
    this.el
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('class', 'graphic');

    this.facets.render(this.el, this.width, this.height);

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