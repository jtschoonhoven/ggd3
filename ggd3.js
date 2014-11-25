
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


  // ========
  // GRAPHICS
  // ========


  function Graphic(data, spec) {

    var that = this;
    this.data = data;
    this.spec = new Spec(spec);

    if (this.spec.facets.x || this.spec.facets.y) {

      var facets = d3.nest()
        .key(function(row) { return row[that.spec.facets.x]; })
        .key(function(row) { return row[that.spec.facets.y]; })
        .entries(this.data);

      this.facets = facets.map(function(facet) { 
        return new GridFacet(facet, that); 
      });

    }

    else {

      var facets = d3.nest()
        .key(function(row) { return row[that.spec.facets.flow ]})
        .entries(this.data);

      this.facets = facets.map(function(facet) {
        return new FlowFacet(facet, that);
      });

    }

  }


  // ====
  // SPEC
  // ====


  function Spec(opts) {
    this.facets = _.defaults(opts.facets, { type: 'flow', key: undefined });
  }


  // ======
  // FACETS
  // ======


  var facetDefaults = {
    key: undefined
  };


  function Facet() {}


  // ============
  // FACETS: FLOW
  // ============


  function FlowFacet(data, graphic) {
    var spec = _.defaults(graphic.spec.facets, facetDefaults);
    _.extend(this, data, spec);
  }

  FlowFacet.prototype = new Facet();

  FlowFacets.prototype.xRange = function() {
    var that = this;
    return this.x.domain.map(function(d, i) {
      if (that.x.domain.length < that.ratio) { return i * (that.width/that.x.domain.length); }
      var colNum = i % that.ratio;
      return (colNum/that.numCols) * that.width; 
    });
  };

  FlowFacets.prototype.yRange = function() {
    var that = this;
    return this.y.domain.map(function(d, i) {
      var rowNum = Math.floor(i/that.ratio);
      return (rowNum/that.numRows) * that.height;
    });
  };


  // ======
  // SCALES
  // ======


  function Scale() {}


  // ===================
  // SCALES: CATEGORICAL
  // ===================


  function CategoricalScale(data, key) {
    this.key = key;
    this.scale = d3.scale.ordinal();
    this.domain = _.uniq(_.map(data, function(row) { return row[key]; }));
    this.scale.domain(this.domain);
  }

  CategoricalScale.prototype = new Scale();


  // ==============
  // SCALES: LINEAR
  // ==============


  function LinearScale(data, key) {
    this.key = key;
    this.scale = d3.scale.linear();
    this.domain = d3.extent( data.map(function(row) { return row[key]; }) );
    this.scale.domain(this.domain);
  }

  LinearScale.prototype = new Scale();


  // =============
  // SCALES: COLOR
  // =============


  function ColorScale(data, key) {
    this.key = key;
    this.scale = d3.scale.category20();
    this.domain = _.uniq(_.map(data, function(row) { return row[key]; }));
    this.scale.domain(this.domain);
  }

  ColorScale.prototype = new Scale();


  // ===
  // API
  // ===


  // Export as Node module.
  if (isNode) {
    module.exports = Graphic;
  }

  // Export to global context.
  this.Graphic = Graphic;



})();