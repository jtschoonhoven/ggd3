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
    graphic.mapData(graphic.data);

    // If the graphic's dimensions were specified
    // or if they can be retrieved from "el", go
    // ahead and call graphic.draw.

    var el     = graphic.spec.global.el;
    var width  = graphic.spec.global.width;
    var height = graphic.spec.global.height;

    var hasDimensions = el || (height && width);
    if (hasDimensions) { graphic.draw(el, width, height); }

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
    facetY: undefined,
    geometry: 'point'
  };


  // The Graphic constructor
  // ----------------------------------------------------
  // A new Graphic contains all the methods that 
  // configure and render an SVG. 

  var Graphic = function() {
    this.el = d3.select(document.createElement('div'));
  };


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

    // If one dataset was passed in, assign it to this.data.
    if (arguments.length === 1) {
      var dataset = arguments[0] || [];
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

    var mappings = ['facetY', 'facetX', 'facet', 'group'];
    var mapping, result;

    // Use d3.nest() to perform a GroupBy of the dataset.
    // This whole block needs refactoring/commenting for clarity.
    nest(0, this.data);
    function nest(mapIndex, data, parentIndex) {
      var mapping = mappings[mapIndex];
      if (!mapping) { return; }

      d3.nest()
        .key(function(row) { return row[that.spec.global[mapping]]; })
        .entries(data)
        .forEach(function(group, index) {

          mapping = mappings[mapIndex];
          if (!that[mapping]) { that[mapping] = []; }

          result = {
            key: that.spec.global[mapping], 
            value: group.key,
            parentIndex: parentIndex || 0 
          };

          // Add result to instance and recurse;
          if (group.key !== 'undefined') { that[mapping].push(result); }
          nest(mapIndex+1, group.values, parentIndex);
        });   
    }

    return this;
  };


  // Draw SVG
  // ----------------------------------------------------


  Graphic.prototype.draw = function(el, width, height) {
    if (el)     { this.spec.global.el = el; }
    if (width)  { this.spec.global.width = width; }
    if (height) { this.spec.global.height = height; }

    var noDimensions = (!el && (!width && !height));
    if (noDimensions) { throw Error('An element or height & width must be specified.'); }

    if (this.spec.global.el) { el = d3.select(this.spec.global.el); }
    width = this.spec.global.width   || parseInt(el.style('width'));
    height = this.spec.global.height || parseInt(el.style('height'));

    var svg = this.el.selectAll('svg')
      .data([1])
      .enter().append('svg')
      .attr('width', width)
      .attr('height', height)
      .attr('class', 'graphic');

    this.drawFacetY(svg, width, height);
  };


  // Y facets divide the svg horizontally. Each facet gets an
  // equal share of the canvas.
  Graphic.prototype.drawFacetY = function(svg, width, height) {
    var facetHeight = height / (this.facetY.length || 1);

    // Even if y facets weren't defined we still want to create
    // an element for them (to hold x & flow facets). If data
    // is empty, bind yFacet element to an empty object.

    var data = this.facetY;
    if (_.isEmpty(data)) { data = [{}]; }

    var facetY = svg.selectAll('g.facetY')
      .data(data)
      .enter().append('g')
      .attr('class', 'facetY')
      .attr('data-key', function(d) { return d.key; })
      .attr('data-value', function(d) { return d.value; })
      .attr('transform', function(d,i) {
        return 'translate('+ (facetHeight * i) +',0)';
      });

    this.drawFacetX(facetY, width, facetHeight);
  };


  // X facets divide each Y facet vertically. Each x facet gets
  // an equal share of each y facet.
  Graphic.prototype.drawFacetX = function(facetY, width, height) {
    var facetWidth = width / (this.facetX.length || 1);

    var data = this.facetX;
    if (_.isEmpty(data)) { data = [{}]; }

    var facetX = facetY.selectAll('g.facetX')
      .data(data)
      .enter().append('g')
      .attr('class', 'facetX')
      .attr('data-key', function(d) { return d.key; })
      .attr('data-value', function(d) { return d.value; })
      .attr('transform', function(d,i) {
        return 'translate(0,'+ (facetWidth * i) +')';
      });

    this.drawFacetFlow(facetX, facetWidth, height);
  };


  // Flow facets (elsewhere just called "facets") divide up the canvas
  // as evenly as possible.
  Graphic.prototype.drawFacetFlow = function(facetX, width, height) {
    var numFacets = this.facet.length || 1;

    // To calculate best fit, first we have to determine the ratio
    // of width:height to use for each facet.
    var widerThanTall = width/height >=1;
    var ratio = widerThanTall ? Math.floor(width/height) : 1/Math.floor(height/width);

    // Now that we have the ratio along with the actual dimensions 
    // of the canvas, we can calculate the total number of rows & cols.
    var numRows = ratio >= 1 ? Math.floor(width/height) : Math.ceil(ratio/numFacets);
    var numCols = Math.ceil(numFacets/numRows);

    var facetWidth = width/numCols;
    var facetHeight = height/numRows;

    var data = this.facet;
    if (_.isEmpty(data)) { data = [{}]; }

    var facetFlow = facetX.selectAll('g.facetFlow')
      .data(data)
      .enter().append('g')
      .attr('class', 'facetFlow')
      .attr('data-key', function(d) { return d.key; })
      .attr('data-value', function(d) { return d.value; })
      .attr('transform', function(d,i) {
        var colNum = i % ratio;
        var rowNum = Math.floor(i/ratio);
        return 'translate('+ (colNum * facetWidth) +','+ (rowNum * facetHeight) +')';
      });

    this.drawGroup(facetFlow, facetWidth, facetHeight);
  };


  // Groups organize data points. E.g. each separate line on a line
  // chart is a group of data.
  Graphic.prototype.drawGroup = function(facet, width, height) {
    var data = this.group;
    if (_.isEmpty(data)) { data = [{}]; }

    var group = facet.selectAll('g.group')
      .data(data)
      .enter().append('g')
      .attr('class', 'group')
      .attr('data-key', function(d) { return d.key; })
      .attr('data-value', function(d) { return d.value; });
  };


  // Export global
  // ----------------------------------------------------
  // Export as a Node module if applicable. Either way,
  // attach ggd3 to the global object.

  if (isNode) { module.exports = ggd3; }
  this.ggd3 = ggd3;

})();