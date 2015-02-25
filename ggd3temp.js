(function() {

  var _  = require('underscore');
  var d3 = require('d3');



  // The Graphic Constructor
  // =========================================================
  // spec: a hash of properties that define a graphic.

  function Graphic(spec) {
    this.configure(spec);
  }



  // Defaults
  // =========================================================

  var specDefaults = {
    // Chart options.
    el          : undefined,
    width       : undefined,
    height      : undefined,

    // Mapping.
    x           : undefined,
    y           : undefined,
    color       : undefined,
    size        : undefined,
    facet       : undefined,
    facetGridX  : undefined,
    facetGridY  : undefined,
    group       : undefined,
    layer       : undefined,

    // Scales.
    xScale      : 'auto',
    yScale      : 'auto',
    colorScale  : 'auto',
    sizeScale   : 'auto',

    // Data.
    dataset     : undefined,
    transforms  : [],

    // Geometry.
    shape       : 'point',
    coordinates : 'cartesian',

    // Components.
    facets      : {},
    layers      : {},
    shapes      : {}
  };



  // Configure Graphic
  // =========================================================
  // I.e. the "initialize" function, called when a new Graphic 
  // is created. The end result is an object that may be 
  // passed an arbitrary dataset to return an SVG to spec.
  // Sets up transformations, mapping, axes, etc.

  Graphic.prototype.configure = function(spec) {
    if (!spec) { spec = {}; }

    // Force component specs to be arrays.
    if (!_.isArray(spec.facets)) { spec.facets = [spec.facets || {}]; }
    if (!_.isArray(spec.layers)) { spec.layers = [spec.layers || {}]; }
    if (!_.isArray(spec.shapes)) { spec.shapes = [spec.shapes || {}]; }

    var blacklist      = ['facets', 'layers', 'shapes', 'dataset'];
    var globalSpec     = _.omit(spec, components);
    var globalDefaults = _.omit(specDefaults, components);

    if (_.isEmpty(spec.facets)) { spec.facets.push({}); }

    // Apply globals to facets and cascade spec to layers.
    _.each(spec.facets, function(facetSpec, i) {
      var childLayer = spec.layers[i] || spec.layers[i-1] || {};
      _.defaults(facetSpec, globalSpec, globalDefaults);
      _.defaults(childLayer, facetSpec);
    });

    // Layer specs cascade down to shapes.
    _.each(spec.layers, function(layerSpec, i) {
      var childShape = spec.shapes[i] || spec.shapes[i-1] || {};
      _.defaults(childShape, layerSpec);
    });

    this.spec = spec;
    this.applyData();
  };



  // Apply Data
  // =========================================================
  // Accepts data as an array where each row is an object with
  // a name:value pair for each column. Uses graphic spec and
  // common defaults to 

  Graphic.prototype.applyData = function(data) {
    if (data) 


    // Add some sample data & coerce to object.
    if (!data) { data = [{testKey: 'a', testVal: 1}, {testKey: 'b', testVal: 2}]; }

    this.facets = _.map(this.spec.facets, function(facetSpec) {
      return d3.nest()
        .key(function(row) { return row[facetSpec.facetGridY] || ''; })
        .key(function(row) { return row[facetSpec.facetGridX] || ''; })
        .key(function(row) { return row[facetSpec.facet]      || ''; })
        .entries(data);
    });
  };


  module.exports = Graphic;

}.call(this))