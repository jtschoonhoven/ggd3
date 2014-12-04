

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
    if (opts)   { graphic.configure(opts); }
    if (data)   { graphic.data(data); }
    if (el)     { graphic.draw(el, height, width); }
    if (render) { graphic.render(); }
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

  var gridFacet = {};
  var flowFacet = {};
  var layer = {};



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
  // grid faceting then extend from GridFacet.
  // Otherwise extend from FlowFacet.

  var FacetFactory = function(opts) {
    this.opts = _.extend(opts, opts.facets);
    ComponentFactory.apply(this);

    opts.layers[0] = opts.layers[0] || {};
    this.layerFactories = opts.layers.map(function(layer, index) {
      return new LayerFactory(opts, index);
    });

    if (opts.gridX || opts.gridY) { this.data = gridFacet.data; }
    else { this.data = flowFacet.data; }
  };



  var LayerFactory = function(opts, index) {
    this.opts = _.extend(opts, opts.facets[index]);
    ComponentFactory.apply(this);
    _.extend(this.Constructor.prototype, new Layer());
    this.geometryFactory = new GeometryFactory(opts, index);
  };



  var GeometryFactory = function(opts, index) {
    this.opts = _.extend(opts, opts.facets[index]);
    ComponentFactory.apply(this);
  };



  Graphic.prototype.configure = function(opts) {
    this.opts = _.defaults(opts || {}, optionsDefaults);
    this.facetFactory = new FacetFactory(opts);
  };



  // Step #2: Apply data
  // ----------------------------------------------------
  // Now that component factories have been created and
  // configured, the next step is to apply that data to
  // the factories and manufacture some components.

  Graphic.prototype.data = function(dataset) {
    this.facets = this.FacetFactory.data(dataset);
  };



  flowFacets.data = function(dataset) {
    var that = this;
  };



  // Step #3: Draw SVG
  // ----------------------------------------------------
  // Now that components have been created, representing
  // them as an SVG is trivial. Note that the SVG is not
  // attached to the DOM. That is accomplished in step 4.

  Graphic.prototype.draw = function(selector, height, width) {};



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