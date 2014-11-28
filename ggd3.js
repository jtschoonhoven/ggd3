
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

    this.d3    = require('d3');
    this._     = require('underscore');

  }


  if (!d3 || !_) { throw 'GGD3 requires D3 and Underscore.'; }
  

  // =======
  // GRAPHIC
  // =======


  // The Graphic constructor is the entry point to ggd3.
  // All arguments are optional.

  function Graphic(opts, data, el, width, height, renderNow) {
    if(opts)      { this.setup(opts); }
    if(data)      { this.data(data); }
    if(el)        { this.el(el, width, height); }
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


  Graphic.prototype.el = function(el, width, height) {

    if (!_.isString(el)) { return this.el; }

    this.target = d3.select(el);

    this.width  = width  || parseInt(this.target.style('width'));
    this.height = height || parseInt(this.target.style('height'));

    this.el = d3.select(document.createElement('div'));
    this.el.append('svg').attr('width', this.width).attr('height', this.height).attr('class', 'graphic');

    this.facetsController.applyElement(this.el, width, height);

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
  }


  function FlowFacetController() {

    this.applyData = function(data) {

      var that = this;

      var facets = d3.nest()
        .key(function(row) { return row[that.flow]; })
        .entries(data);

      facets.forEach(function(facet) {
        // that.scale.domain.push(facet.key);
        var facet = new Facet(facet);
        that.layersController.applyData(facet);
        that.facets.push(facet);
      });

    };

  }


  FacetsController.prototype.applyElement = function(el, width, height) {
    this.el = el.select('svg');
    this.el.selectAll('g.facet')
      .data(this.facets)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(facet) { console.log(facet); return facet.key; });
  };


  // ======
  // LAYERS
  // ======


  function LayersController(opts) {}


  LayersController.prototype.applyData = function(data) {

  }


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