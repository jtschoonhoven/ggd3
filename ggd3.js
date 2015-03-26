(function() {

  // Configure for Node and the browser.
  var isNode = false;
  if (typeof module !== 'undefined' && module.exports) {
    var d3    = require('d3');
    var _     = require('underscore');
    var async = require('async');
  
    // Uses jsdom to build HTML server side.
    isNode   = true; 
    document = require('jsdom').jsdom();
    window   = document.parentWindow;
  }
  
  if (!d3 || !_ || !async) { throw 'ggd3 requires D3, Async, and Underscore.'; }
  
  
  var ggd3 = {};
  ggd3.VERSION = '0.0.0';
  
  
  var Graphic = function() {
    this.el = d3.select(document.createElement('div'));
  
    this.stats = {};
    this.data = [];
  
    this.yFacets    = [];
    this.xFacets    = [];
    this.facets     = [];
    this.groups     = [];
    this.geometries = [];
  
    this.applyData = function(data) { this.data = data; }
  };
  
  
  ggd3.create = function(spec, data, done) {
    var graphic = new Graphic();
  
    graphic.data = data || [];
    graphic.spec = graphic.configure(spec);
  
    if (done) {
      async.waterfall([
        async.apply(graphic.parseData.bind(graphic), graphic.data, graphic.spec),
        async.apply(graphic.mapData.bind(graphic), graphic.data),
        async.apply(graphic.draw.bind(graphic), graphic.spec.el, graphic.spec.width, graphic.spec.height)
      ], 
      done);
    }
  
    else { return graphic; }
  };
  
  
  
  ggd3.defaults = {
  
    // Display a title above the chart.
    title: undefined,
  
    // Selector for destination graphic.
    el: undefined,
  
    // Draw a graphic of these dimensions, else inherit from el.
    width: undefined,
    height: undefined,
  
    // If desired, min and max can be forced.
    xMin: undefined,
    xMax: undefined,
    yMin: undefined,
    yMax: undefined,
  
    // Map column names to attributes/components.
    x: undefined,
    y: undefined,
    color: undefined,
    size: undefined,
    facet: undefined,
    facetX: undefined,
    facetY: undefined,
  
    // Geoms may be point, line, or bar (more to come).
    geometry: 'point',
  
    // If true, each X/Y facet will scale its axis independently.
    floatFacetScaleX: false,
    floatFacetScaleY: false,
  
    // If true, each facet gets its own independently-scaled axis.
    independentAxes: false,
  
    // Datatypes may be string, number, or time.
    xType: undefined,
    yType: undefined,
    colorType: undefined,
    sizeType: undefined,
    facetType: undefined,
    facetXType: undefined,
    facetYType: undefined
  };
  
  
  Graphic.prototype.configure = function(spec, done) {
    spec = _.defaults(spec || {}, ggd3.defaults)
    if (done) { done(null, spec); }
    else { return spec; }
  };
  
  
  // Determine data types and some stats. 
  // TODO: add parseAsBool
  // TODO: refactor for clarity.
  Graphic.prototype.parseData = function(data, spec, done) {
    data = data || [];
    spec = spec || {};
  
    var parsedColumns = {};
    var mappings = [
      { name: 'x', type: spec.xType }
    , { name: 'y', type: spec.yType }
    , { name: 'color', type: spec.colorType }
    , { name: 'size', type: spec.sizeType }
    , { name: 'facet', type: spec.facetType }
    , { name: 'facetX', type: spec.facetXType }
    , { name: 'facetY', type: spec.facetYType }
    ];
  
    // Parse, then add to parsedData to keep track of.
    function parseAndAdd(colName, parseFunc, next) {
      async.map(data, function(row, cb) { parseFunc(row[colName], cb); }
      , function(err, res) {
        if (err) { return next(err); }
        parsedColumns[colName] = res;
        next(null, res);
      });
    }
  
    async.eachSeries(mappings, function(mapping, next) {
      var colName = spec[mapping];
  
      // Check that the mapping is defined and has not already been parsed.
      if (!colName || parsedColumns[colName]) { return next(); }
  
      // Then check whether the type has been set explicitly.
      if (mapping.type === 'date') { return parseAndAdd(colName, parseAsDate, next); }
      if (mapping.type === 'number') { return parseAndAdd(colName, parseAsNumber, next); }
      if (mapping.type === 'string') { return parseAndAdd(colName, parseAsString, next); }
  
      // Otherwise we'll figure out the datatype for ourselves.
      getColumnTypeAndParse(data, colName, function(err, res, type) {
        if (err) { return next(err); }
        spec[mapping + 'Type'] = type;
        parsedColumns[colName] = res;
        next();
      });
    }, 
  
    // Handle parsed data after eachSeries completes.
    function(err) {
      if (err) { return done(err); }
  
      var parsedData = [];
      var columns = Object.keys(parsedColumns);
  
      // For each row of data.
      var i = 0;
      async.map(data, function(row, cb) {
        var parsedRow = {};
  
        columns.forEach(function(colName) { 
          parsedRow[colName] = parsedColumns[colName][i]; 
        });
  
        parsedData.push(parsedRow);
        i++;
        cb(null, parsedRow);
      }, done)
  
    });
  };
  
  
  function getColumnTypeAndParse(data, colName, done) {
  
    function parseAsType(parseFunc, next) {
      async.map(data, function(row, cb) { parseFunc(row[colName], cb); }, next)
    }
  
    // Try first to parse as date, then as number, finally coerce to string.
    parseAsType(parseAsDate, function(err, res) {
      if (!err) { return done(null, res, 'date'); }
  
      parseAsType(parseAsNumber, function(err, res) {
        if (!err) { return done(null, res, 'number'); }
        parseAsType(parseAsString, function(err, res) { done(err, res, 'string'); });
      });
  
    });
  }
  
  
  function parseAsDate(val, done) {
    var parsed;
  
    if (val instanceof Date) { return done(null, val); }
    
    // If value is falsey and nonzero, interpret as undefined.
    if (!val && val!== 0) { return done(null, undefined); }
  
    // Attempt to parse val with given length and format.
    function tryParse(val, len, format) {
      var isValid = typeof val === 'string'
        && val.length === len 
        && d3.time.format(format).parse(val);
      return isValid ? d3.time.format(format).parse(val) : false;
    }
  
    // TODO: add more valid date formats.
    parsed = tryParse(val, 4, '%Y')
      || tryParse(val, 7,  '%Y-%m')
      || tryParse(val, 10, '%Y-%m-%d')
      || tryParse(val, 19, '%Y-%m-%d %H:%M:%S')
      || tryParse(val, 24, '%Y-%m-%dT%H:%M:%S.%LZ')
  
    if (parsed) { done(null, parsed); }
    else { done(new Error('Failed to parse value as date.')); }
  }
  
  
  function parseAsNumber(val, done) {
    var parsed;
  
    if (typeof val === 'number' && isFinite(val)) { done(null, val); }
  
    // If value is falsey and nonzero, interpret as undefined.
    else if (!val) { done(null, undefined); }
  
    // Match integers including decimals.
    else if (typeof val === 'string' && /^[-+]?([0-9]*\.[0-9]+|[0-9]+)$/.test(val)) {
      done(null, parseFloat(val));
    }
  
    // Match integers/decimals ending in %, then divide by 100.
    else if (typeof val === 'string' && /^[-+]?([0-9]*\.[0-9]+|[0-9]+)%$/.test(val)) {
      done(null, parseFloat(val)/100);
    }
  
    else { done(new Error('Failed to parse value as number.')); }
  }
  
  
  // Convert any nonfalsey, nonzero value to string.
  function parseAsString(val, done) {
    if (!val && val!== 0) { return done(null, undefined); }
    done(null, String(val));
  }
  
  
  
  // Map Data to Components.
  Graphic.prototype.mapData = function(data, spec, done) {
    spec = spec || {};
    data = data || [];
  
    // Unless facets are floated or independent, get min and max here.
    if (!spec.independentAxes && !spec.floatFacetScaleY) {
      var yExtent = d3.extent(data, function(row) { return row[spec.y]; });
    }
  
    mapYFacets.call(this, data, function() {
      if (done) { done(); } 
    });
  };
  
  
  // Like a SQL group by, D3's nest organizes the given
  // dataset by key. Each group is sent to iterator.
  function nest(data, key, iterator, done) {
    var nestedData = d3.nest()
      .key(function(row) { return row[key]; })
      .entries(data)
  
    // Apply iterator to each group, then callback with nestedData.
    async.each(nestedData, iterator, function() { done(nestedData); });
  }
  
  
  function mapYFacets(data, done) {
    var that = this;
    var key = this.spec.facetY;
  
    nest(data, key, function(nested, cb) {
      var yFacet = { key: key, value: nested.key };
  
      // If y-facets are floated, we'll need the extent of each.
      if (that.spec.floatFacetScaleY) {
        yFacet.extent = d3.extent(nested.values, function(row) { return row[that.spec.y]; });
      }
  
      // And unless they're independent, grab extent from spec.
      else if (!that.spec.independentAxes) {
        yFacet.extent = [that.spec.yMin, that.spec.yMax];
      }
  
      that.yFacets.push(yFacet);
      mapXFacets.call(that, nested.values, cb);
    },
    done);
  }
  
  
  function mapXFacets(data, done) {
    var that = this;
    var key  = this.spec.facetX;  
  
    nest(data, key, function(nested, cb) {
      var xFacet = { key: key, value: nested.key };
  
      if (that.spec.floatFacetScaleY) {
        xFacet.extent = d3.extent(nested.values, function(row) { return row[that.spec.x]; });
      }
      else if (!that.spec.independentAxes) {
        xFacet.extent = [that.spec.xMin, that.spec.xMax];
      }
  
      that.xFacets.push(xFacet);
      mapFlowFacets.call(that, nested.values, cb);
    }, 
    done);
  }
  
  
  function mapFlowFacets(data, done) {
    var that = this;
    var key  = this.spec.facet;
  
    nest(data, key, function(nested, cb) {
      var facet = { key: key, value: nested.key };
      if (nested.key !== 'undefined') { that.facets.push(facet); }
      mapGroups.call(that, nested.values, cb);
    }, 
    done);
  }
  
  
  function mapGroups(data, done) {
    var that = this;
    var key  = this.spec.group;
  
    nest(data, key, function(nested, cb) {
      var group = { key: key, value: nested.key };
      if (nested.key !== 'undefined') { that.group.push(group); }
      mapGeometries.call(that, nested.values, cb);
    }, 
    done);
  }
  
  
  function mapGeometries(data, done) {
    var that = this;
    var key  = this.spec.geometry;
    
    nest(data, key, function(nested, cb) {
      that.geometries.push(nested.values);
      cb();
    }, 
    done);
  }
  
  
  
  
  // Draw SVG
  // ----------------------------------------------------
  
  Graphic.prototype.draw = function(el, width, height) {
    if (el)     { this.spec.el = el; }
    if (width)  { this.spec.width = width; }
    if (height) { this.spec.height = height; }
  
    var noDimensions = (!el && (!width && !height));
    if (noDimensions) { throw Error('Cannot draw SVG without an element or height & width must specified.'); }
  
    if (this.spec.el) { el = d3.select(this.spec.el); }
    width = this.spec.width   || parseInt(el.style('width'));
    height = this.spec.height || parseInt(el.style('height'));
  
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
    var facetHeight = height / (this.yFacets.length || 1);
  
    // Even if y facets aren't defined we still want to create
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
  
    // By default, y-axes are drawn at the left of each yFacet.
    if (!this.spec.independentAxes) {
      
    }
  
    this.drawFacetX(facetY, width, facetHeight);
  };
  
  
  // X facets divide each Y facet vertically. Each x facet gets
  // an equal share of each y facet.
  Graphic.prototype.drawFacetX = function(facetY, width, height) {
    var facetWidth = width / (this.xFacets.length || 1);
  
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
    var numFacets = this.facets.length || 1;
  
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
  
    var facetFlow = facetX.selectAll('g.facet')
      .data(data)
      .enter().append('g')
      .attr('class', 'facet')
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
  
    this.drawPointGeometry(group, width, height);
  };
  
  
  Graphic.prototype.drawPointGeometry = function(group, width, height) {
    var that = this;
  
    // Users might want to change geometry types without having to 
    // pass in arguments to the functions. Set vars here if undefined.
    group = group   || d3.selectAll('g.group');
    width = width   || parseInt(group.style('width'));
    height = height || parseInt(group.style('height'));
  
    d3.selectAll(group).each(function(datum, index) {
      var data = that.geometries[index] || [];
      var selection = d3.selectAll(this);
  
      selection.selectAll('circle.point')
        .data(data)
        .enter().append('circle')
        .attr('class', 'point')
        .attr('r', 2)
        .attr('cx', 20)
        .attr('cy', 20)
    });
  };
  
  
  
  // Export global
  // ----------------------------------------------------
  // Export as a Node module if applicable. Else
  // attach ggd3 to the global object.
  
  if (isNode) { module.exports = ggd3; }
  else { this.ggd3 = ggd3; }

})()
//# sourceMappingURL=ggd3.js.map
