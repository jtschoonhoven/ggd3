

// GGD3
// ====


(function () {



  // Configure for Node and the browser
  // ----------------------------------------------------
  // GGD3 needs a DOM in order to build an SVG. If used
  // outside of the browser, the DOM is stubbed by jsdom.

  var isNode = false;

  if (typeof module !== 'undefined' && module.exports) {
    isNode = true;

    document = require('jsdom').jsdom();
    window = document.parentWindow;

    this.d3 = require('d3');
    this._  = require('underscore');

  }

  if (!d3 || !_) { throw 'ggd3 requires D3 and Underscore.'; }



  // Declare the module and top level methods
  // ----------------------------------------------------
  // GGD3 starts as a humble object literal. It contains
  // all methods used to create a new Graphic and will
  // be exported to the global object.

  var ggd3 = {};

  ggd3.VERSION = '0.0.0';



  // "Create" returns a new instance of Graphic and
  // optionally configures and renders it to the DOM.
  // All arguments are optional and can be set later. 

  ggd3.create = function(opts, data, selector, width, height, renderNow) {
    var graphic = new Graphic();

    graphic.configure(opts);

    if (data) { graphic.data(data); }
    if (selector || (height && width)) { graphic.draw(selector, height, width); }
    if (renderNow) { graphic.render(); }

    return graphic;
  };



  // The Graphic constructor
  // ----------------------------------------------------
  // A new Graphic contains all the methods that 
  // configure and render an SVG. That process is
  // represented by four functions. In order,
  // **configure**, **data**, **draw**, and **render**.

  var Graphic = function() {};



  // Step #1: Configure
  // ----------------------------------------------------
  // Our end goal is to represent a dataset with various
  // components (facets, layers, geometries) and to
  // render those to the DOM. The first step is to
  // configure factory functions for those components so
  // that, when data is applied to the factory function,
  // a properly configured component is returned.

  // The following options may be passed as opts to
  // graphic.configure. 

  var optionsDefaults = {
    flow: undefined,
    gridX: undefined,
    gridY: undefined,
    x: undefined,
    y: undefined,
    color: undefined,
    size: undefined,
    group: undefined,
    geometry: 'point',
    scaleX: 'categorical',
    scaleY: 'linear',
    coordinates: 'cartesian',
    facets: {},
    layers: []
  };



  // Components.
  var gridFacets = {};
  var flowFacets = {};
  var layers = {};
  var geometry = {};
  var pointGeometry = {};
  var lineGeometry = {};



  // "ComponentFactory" is a generic factory that will be
  // used to extend new component factories.

  var ComponentFactory = function() {
    var that = this;
    this.Constructor = function(properties) { _.extend(this, properties); };
    this.create = function(properties) { return new that.Constructor(properties); };
  };


  // "FacetFactory" extends ComponentFactory and then
  // creates an array of LayerFactories for each layer
  // in opts (at least one). If the user has specified
  // grid faceting then extend from GridFacets.
  // Otherwise extend from FlowFacets.

  var FacetFactory = function(opts) {
    this.opts = _.extend(opts, opts.facets);
    ComponentFactory.apply(this);

    this.layerFactory = new LayerFactory(opts);

    if (opts.gridX || opts.gridY) { _.extend(this, gridFacets); }
    else { _.extend(this, flowFacets); }
  };



  var LayerFactory = function(opts) {
    opts.layers[0] = opts.layers[0] || {};

    this.opts = opts.layers.map(function(layerOpts, index) {
      opts.layers[index] = _.extend({}, opts, opts.facets, layerOpts);
      return opts.layers[index];
    });

    ComponentFactory.apply(this);
    this.geometryFactory = new GeometryFactory(opts);

    _.extend(this, layers);
  };



  var GeometryFactory = function(opts) {
    this.opts = opts.layers.map(function(layerOpts, index) {
      return _.extend(opts, opts.facets, layerOpts);
    });

    ComponentFactory.apply(this);

    _.extend(this, geometry);
    if (opts.geometry === 'line') { _.extend(this, lineGeometry); }
    else { _.extend(this, pointGeometry); }
  };



  Graphic.prototype.configure = function(opts) {
    this.opts = _.defaults(opts || {}, optionsDefaults);
    this.facetFactory = new FacetFactory(opts);
    this.opts = opts;
  };



  // Step #2: Apply data
  // ----------------------------------------------------
  // Now that component factories have been created and
  // configured, the next step is to apply that data to
  // the factories and manufacture the components.

  Graphic.prototype.data = function(dataset) {
    this.facets = this.facetFactory.data(dataset);
    console.log(JSON.stringify(this.facets, null, 1));
  };



  gridFacets.data = function(dataset) {};



  flowFacets.data = function(dataset) {
    var that = this;

    var facets = d3.nest()
      .key(function(row) { return row[that.opts.flow]; })
      .entries(dataset);

    facets = facets.map(function(facet, index) {
      var layers = that.layerFactory.data(facet.values);
      return that.create({ key: facet.key, layers: layers });
    });

    return facets;
  };



  layers.data = function(facetValues) {
    var that = this;

    var layers = this.opts.map(function(layerOpts, index) {
      var groups = that.geometryFactory.data(facetValues, layerOpts);
      return that.create({ layerIndex: index, geometry: layerOpts.geometry, groups: groups });
    });

    return layers;
  }



  geometry.data = function(facetValues, layerOpts) {
    var that = this;

    var geometries = d3.nest()
      .key(function(row) { return row[layerOpts.group]; })
      .entries(facetValues);

    geometries = geometries.map(function(geom, index) {
      return that.create({ key: geom.key, values: geom.values });
    });

    return geometries;
  };



  // Step #3: Draw SVG
  // ----------------------------------------------------
  // Now that components have been created, representing
  // them as an SVG is trivial. Note that the SVG is not
  // attached to the DOM. That is accomplished in step 4.

  Graphic.prototype.draw = function(selector, width, height) {
    var that = this;

    if (!selector && (!width || !height)) {
      throw { message: '"Draw" called without dimensions or selector.' }
    }

    this.el = d3.select(document.createElement('div'));
    this.target = selector ? d3.select(selector) : undefined;

    this.width  = width  || parseInt(this.target.style('width'));
    this.height = height || parseInt(this.target.style('height'));

    this.facets.forEach(function(facet) {
      facet.draw();
    });
  };



  flowFacet.draw = function() {
    
  };



  // Step #4: Render SVG
  // ----------------------------------------------------
  // The SVG has been drawn, all that is left is to
  // attach it to the DOM.

  Graphic.prototype.render = function(selector) {
    this.target.html(this.el.html());
  };



  // Return SVG HTML or undefined.

  Graphic.prototype.html = function() {};



  // Export global
  // ----------------------------------------------------
  // Export as a Node module if applicable. Either way,
  // attach ggd3 to the global object.

  if (isNode) { module.exports = ggd3; }
  this.ggd3 = ggd3;



})();

ggd3.create({ geometry: 'line', group: 'name', layers: [{}, {}]}, [{ name: 'ok', value: 1 }], null, 200, 200);