

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
    coordinates: 'cartesian'
  };



  // "defaultOpts" is used to set the default values
  // in the opts object. More importantly, it also
  // holds the logic that cascades options down the
  // component hierarchy, graphic >> facets >> layers.

  var defaultOpts = function(opts) {
    var opts = opts || {};
    var components = ['graphic', 'facets', 'layers'];

    _.defaults(opts, { graphic: {}, facets: {}, layers: [{}] });
    _.defaults(opts.graphic, optionsDefaults, _.omit(opts, components));
    _.defaults(opts.facets, opts.graphic);

    opts.layers.map(function(layerOpts) {
      return _.defaults(layerOpts, opts.facets);
    });

    // Only return opts.graphic, .facets & .layers.
    return _.pick(opts, components);
  };



  // Components.
  var gridFacets = {};
  var flowFacets = {};
  var layers = {};
  var groups = {};
  var geometry = {};
  var lineGeometry = {};
  var barGeometry = {};
  var pointGeometry = {};



  // "ComponentFactory" is a generic factory that will be
  // used to extend new component factories.

  var ComponentFactory = function(opts, childFactory) {
    var that = this;
    this.opts = opts;

    this.childFactory = childFactory;
    this.Constructor = function(properties) { _.extend(this, properties); };
    this.create = function(properties) { return new that.Constructor(properties); };
    this.extend = function(model) { _.extend(that, model); };
  };


  // "FacetFactory" extends ComponentFactory and then
  // creates an array of LayerFactories for each layer
  // in opts (at least one). If the user has specified
  // grid faceting then extend from GridFacets.
  // Otherwise extend from FlowFacets.

  var FacetFactory = function(opts, layerFactory) {
    ComponentFactory.apply(this, [opts, layerFactory]);
    if (opts.facets.gridX || opts.facets.gridY) { this.extend(gridFacets); }
    else { this.extend(flowFacets); }
  };



  var LayerFactory = function(opts, geometryFactory) {
    ComponentFactory.apply(this, [opts, geometryFactory]);
    this.extend(layers);
  };


  // "GeometryFactory" is extended by the generic
  // geometry component as well as the specific geometry
  // defined in opts ("point" by default).

  var GeometryFactory = function(opts) {
    var that = this;
    ComponentFactory.apply(this, opts);

    this.extend(geometry);
    this.geometries = opts.layers.map(function(layerOpts) {
      if (layerOpts.geometry === 'line') { return lineGeometry; }
      if (layerOpts.geometry === 'bar') { return barGeometry; }
      else { return pointGeometry; }
    });
  };


  // Configure and create the factory instances.
  // The defaultOpts function applies default values to
  // the opts object and cascades properties down the
  // graphic hierarchy. If called without argument,
  // return current opts.

  Graphic.prototype.configure = function(opts) {
    if (!opts) { return this.opts; }
    this.opts = defaultOpts(opts);
    this.geometryFactory = new GeometryFactory(this.opts);
    this.layerFactory = new LayerFactory(this.opts, this.geometryFactory);
    this.facetFactory = new FacetFactory(this.opts, this.layerFactory);
  };



  // Step #2: Apply data
  // ----------------------------------------------------
  // Now that component factories have been created and
  // configured, the next step is to apply that data to
  // the factories and manufacture the components.

  Graphic.prototype.data = function(dataset) {
    this.facets = this.facetFactory.data(dataset);
  };



  gridFacets.data = function(dataset) {};



  flowFacets.data = function(dataset) {
    var that = this;

    var facets = d3.nest()
      .key(function(row) { return row[that.opts.facets.flow]; })
      .entries(dataset);

    facets = facets.map(function(facet, index) {
      var layers = that.childFactory.data(facet.values);
      return that.create({ key: facet.key, layers: layers });
    });

    return facets;
  };



  layers.data = function(facetValues) {
    var that = this;

    var layers = this.opts.layers.map(function(layerOpts, index) {
      var groups = that.childFactory.data(facetValues, layerOpts);
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

    this.el = d3.select(document.createElement('div'));
    this.target = selector ? d3.select(selector) : undefined;

    this.width  = width  || parseInt(this.target.style('width'));
    this.height = height || parseInt(this.target.style('height'));

    this.facetFactory.draw.apply(this, this.facets);
  };



  flowFacets.draw = function(facets) {
    var that = this;
    this.el.append('svg')
      .attr('width', this.width)
      .attr('height', this.height)
      .selectAll('g.facet')
      .data(this.facets)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(facet) { 
        return facet.key; 
      })
      .each(function(facet) {
        that.layerFactory.draw.apply(that, [facet.layers, this]);
      });
  };



  layers.draw = function(layers, el) {
    var that = this;
    d3.select(el)
      .selectAll('g.layer')
      .data(layers)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('data-geometry', function(layer) { 
        return layer.geometry; 
      })
      .each(function(layer, index) {
        var geometry = that.geometryFactory.geometries[index];
        groups.draw.apply(that, [layer.groups, this, geometry]);
      });
  };



  groups.draw = function(groups, el, geometry) {
    var that = this;
    d3.select(el)
      .selectAll('g.group')
      .data(groups)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('data-key', function(group) {
        return group.key;
      })
      .each(function(group) {
        geometry.draw.apply(that, [group, this, geometry]);
      });
  };



  pointGeometry.draw = function(group, el, geometry) {
    var that = this;
    console.log(geometry)
    d3.select(el).selectAll('circle.point')
      .data(group.values)
      .enter()
      .append('circle')
      .attr('class', 'point')
      .attr('cx', function(d) {
        // return that.geometryFactory
      });
  };



  lineGeometry.draw = function(groups, el) {
    console.log('TODO');
  };



  // Step #4: Render SVG
  // ----------------------------------------------------
  // The SVG has been drawn, all that is left is to
  // attach it to the DOM.

  Graphic.prototype.render = function(selector) {
    this.target.html(this.el.html());
  };



  // Return SVG HTML or undefined.

  Graphic.prototype.html = function() {
    return this.el ? this.el.html() : undefined; 
  };



  // Export global
  // ----------------------------------------------------
  // Export as a Node module if applicable. Either way,
  // attach ggd3 to the global object.

  if (isNode) { module.exports = ggd3; }
  this.ggd3 = ggd3;



})();

ggd3.create({ flow: 'name', geometry: 'line', group: 'name', layers: [{ geometry: 'point' }, {}]}, [{ name: 'ok', value: 1 }, { name: 'nok', value: 2}], null, 200, 200);