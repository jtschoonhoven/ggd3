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


  // "Create" returns a new instance of Graphic.
  ggd3.create = function(spec, data) {
    var graphic = new Graphic();
    graphic.configure(spec);
    graphic.applyData(data);
    return graphic;
  };


  // Graphic defaults
  // ----------------------------------------------------

  ggd3.defaults = {
    title: undefined,
    el: undefined,
    width: undefined,
    height: undefined,
    x: undefined,
    y: undefined,
    color: undefined,
    size: undefined,
    facet: undefined,
    facetX: undefined,
    facetY: undefined
  };


  // The Graphic constructor
  // ----------------------------------------------------
  // A new Graphic contains all the methods that 
  // configure and render an SVG. 

  var Graphic = function() {};


  // Configure
  // ----------------------------------------------------

  Graphic.prototype.configure = function(spec) {
    if (!spec) { spec = {}; }

    // Properties at the top level of spec are "global".
    var components = ['global', 'facets', 'groups', 'shapes'];
    var globalSpecs = _.omit(spec || {}, components);

    // Fill in values in spec from defaults & globals.
    spec.global = _.defaults(spec.global || {}, globalSpecs, ggd3.defaults);
    spec.facets = _.defaults(spec.facets || {}, globalSpecs, ggd3.defaults);
    spec.groups = _.defaults(spec.groups || {}, globalSpecs, ggd3.defaults);
    spec.shapes = _.defaults(spec.shapes || {}, globalSpecs, ggd3.defaults);

    // Filter out any noncomponent specs & apply.
    spec = _.pick(spec, components);
    this.spec = spec;
    return this;
  };


  // Apply Data
  // ----------------------------------------------------
  // Raw data may be passed in as an array. Or a named
  // dataset may be passed as { key: '', values: [] }.

  Graphic.prototype.applyData = function() {
    var data = [];

    // If only one dataset was passed, set this.data.
    if (arguments.length === 1) {
      var dataset = arguments[0];
      if (_.isArray(dataset))       { this.data = dataset; }
      else if (_.isObject(dataset)) { this.data = dataset.values; }
      return this;
    }

    // If multiple sets were passed in, join them.
    _.each(arguments, function(dataset, index) {
      if (_.isArray(dataset)) {
        _.each(dataset, function(row) { row.dataset = row.dataset || index });
        data = data.concat(dataset);
      }

      else if (_.isObject(dataset)) {
        _.each(dataset.values, function(row) { row.dataset = row.dataset || dataset.key || index });
        data = data.concat(dataset.values);
      }
    });

    this.data = data;
    return this;
  };


  // Map Data to Components
  // ----------------------------------------------------
  // Once the graphic has been configured and has had
  // data applied, that data may be mapped to components.

  Graphic.prototype.mapData = function() {
    var that = this;

    var mappings = ['facetY', 'facetX', 'facet', 'color', 'size'];

    // Use d3.nest() to perform a GroupBy of the dataset.
    // The result is a list of keys
    function nest(mapIndex, data, parentIndex) {
      var mapping = mappings[mapIndex];
      that[mapping] = [];

      d3.nest()
        .key(function(row) { return row[that.spec.global[mapping]]; })
        .entries(data)
        .forEach(function(group, index) {
          var result = { key: group.key, parentIndex: parentIndex || 0 };
          if (group.key !== 'undefined') { that[mapping].push(result); }
          if (mapIndex < mappings.length) { nest(mapIndex+1, group.values, parentIndex); }
        });
    }

    nest(0, this.data);
  };


  // Draw SVG
  // ----------------------------------------------------


  Graphic.prototype.draw = function(el, width, height) {
    if (el)     { this.spec.global.el = el; }
    if (width)  { this.spec.global.width = width; }
    if (height) { this.spec.global.height = height; }

    // This will throw an error if "el" is not set else if
    // width OR height are not set.

    if (this.spec.global.el) { el = d3.select(this.spec.global.el); }
    width = this.spec.global.width   || parseInt(el.style('width'));
    height = this.spec.global.height || parseInt(el.style('height'));

    this.facets.draw();
  };


  // Export global
  // ----------------------------------------------------
  // Export as a Node module if applicable. Either way,
  // attach ggd3 to the global object.

  if (isNode) { module.exports = ggd3; }
  this.ggd3 = ggd3;

})();