
// Based on https://github.com/gigamonkey/gg


(function () {


  // ===================
  // NODE/BROWSER CONFIG
  // ===================

  var isNode = false;

  if (typeof module !== 'undefined' && module.exports) {
    isNode = true;
    document = require('jsdom').jsdom();
    window = document.parentWindow;
    this.d3 = require('d3');
    this._  = require('underscore');
  }

  if (!d3 || !_) { throw 'ggd3 requires D3 and Underscore.'; }


  // =======
  // GRAPHIC
  // =======


  function Graphic(opts, data, el, width, height, renderNow) {
    _.defaults(opts || {}, { facets: {}, layers: [], groups: [], geometries: [] });
    this.geometriesController = new GeometriesController();
    this.groupsController = new GroupsController(this.geometriesController);
    this.layersController = new LayersController(this.groupsController);
    this.facetsController = new FacetsController(this.layersController);
    if(opts)      { this.configure(opts); }
    if(data)      { this.calculate(data); }
    if(el)        { this.draw(el, width, height); }
    if(renderNow) { this.render(); }
  }


  // ==========
  // COMPONENTS
  // ==========


  function Facet(data) {
    this.key = data.key;
    this.layers = data.layers;
    this.opts = data.opts;
    this.index = data.index;
  }


  function Layer(data) {
    this.opts = data.opts;
    this.groups = data.groups;
  }


  function Geometry(data) {
    // console.log('new geo');
  }


  // ===========
  // CONTROLLERS
  // ===========


  function FacetsController(layersController) {
    this.scale = { x: d3.scale.ordinal(), y: d3.scale.ordinal(), domain: [] };
    this.layersController = layersController;
  }


  function GridFacetsController(layersController) {}


  function FlowFacetsController() {


    this.train = function(dataset) {
      var that = this;
      this.scale.domain = d3.set(dataset.map(function(row) { return row[that.opts.flow]; })).values();
    };


    this.calculate = function(dataset) {
      var that = this;
      var facets = d3.nest()
        .key(function(row) { return row[that.opts.flow]; })
        .entries(dataset)
        .map(function(facet, index) {
          var facet = { opts: that.opts, values: facet.values, index: index };
          facet.layers = that.layersController.calculate(facet);
          return new Facet(facet);
      });
      return facets;
    };


    this.setRangeX = function(width, height, ratio, numFacets, numCols) {
      var that = this;
      var xRange = this.scale.domain.map(function(key, index) {
        if (numFacets < ratio) { return index * (width/numFacets); }
        var colNum = index % ratio;
        return (colNum/numCols) * that.width; 
      });
      this.scale.x.range(xRange);
    };


    this.setRangeY = function(width, height, ratio, numFacets, numRows) {
      var yRange = this.scale.domain.map(function(key, index) {
        var rowNum = Math.floor(index/ratio);
        return (rowNum/numRows) * height;
      });
      this.scale.y.range(yRange);
    };

  }


  function LayersController(groupsController) {
    this.groupsController = groupsController;
  }


  function GroupsController(geometriesController) {
    this.geometriesController = geometriesController;
  }


  function GeometriesController() {}


  // ========
  // DEFAULTS
  // ========


  var facetsDefaultOpts = {
    flow: undefined,
    gridX: undefined,
    gridY: undefined
  };


  var layerDefaultOpts = {
    geometry: 'point',
    mapping: {}
  };


  var groupDefaultOpts = {
    group: undefined
  };


  var geometriesDefaults = {};


  // =========
  // CONFIGURE
  // =========


  Graphic.prototype.configure = function(opts) {
    this.opts = _.defaults(opts || {}, { graphic: {}, facets: {}, layers: [], groups: [] });
    this.opts.facets = this.facetsController.configure(opts);
    this.opts.layers = this.layersController.configure(opts);
    this.opts.groups = this.groupsController.configure(opts);
    this.opts.geometries = this.geometriesController.configure(opts);
  };


  FacetsController.prototype.configure = function(opts) {
    this.opts = _.extend({}, facetsDefaultOpts, opts.graphic, opts.facets);
    if (this.opts.gridX || this.opts.gridY) {
      
    }
    else { _.extend(this, new FlowFacetsController()); }
    return this.opts;
  };


  LayersController.prototype.configure = function(opts) {
    if (!opts.layers.length > 0) { opts.layers[0] = _.extend({}, layerDefaultOpts, opts.graphic); }
    this.opts = opts.layers.map(function(layerOpts) { return _.extend({}, layerDefaultOpts, opts.graphic, layerOpts); });
    return this.opts;
  };


  GroupsController.prototype.configure = function(opts) {
    if (!opts.groups.length > 0) { opts.groups = opts.layers.map(function(layer) { return _.extend(layer, groupDefaultOpts); }); }
    this.opts = opts.groups.map(function(groupOpts, index) { 
      return _.extend({}, groupDefaultOpts, opts.graphic, opts.facets, opts.layers[index], groupOpts); 
    });
    return this.opts;
  };


  GeometriesController.prototype.configure = function(opts) {
    if (!opts.geometries.length > 0) { opts.geometries = opts.groups.map(function(groupOpts) { return _.extend(groupOpts, geometriesDefaults); }); }
    this.opts = opts.geometries.map(function(geometriesOpts, index) {
      return _.extend({}, geometriesDefaults, opts.graphic, opts.facets, opts.layers[index], opts.groups[index], geometriesOpts); 
    });
    return this.opts;
  };


  // =========
  // CALCULATE
  // =========


  Graphic.prototype.calculate = function(dataset) {
    if (!_.isArray(dataset)) { return this.dataset || []; }
    this.dataset = dataset;
    this.facetsController.train(dataset);
    this.layersController.train(dataset);
    this.groupsController.train(dataset);
    this.facets = this.facetsController.calculate(dataset);
  };


  LayersController.prototype.calculate = function(facet) {
    var that = this;
    var layers = this.opts.map(function(layerOpts, index) {
      var layer = { opts: layerOpts, values: facet.values, index: index };
      layer.groups = that.groupsController.calculate(layer);
      return new Layer(layer);
    });
    return layers;
  };


  GroupsController.prototype.calculate = function(layer) {
    var that = this;
    var groups = d3.nest()
      .key(function(row) { return row[layer.opts.mapping.group]; })
      .entries(layer.values)
      .map(function(group) {
        group.opts = that.opts[layer.index];
        return that.geometriesController.calculate(group);
      });
    return groups;
  };


  GeometriesController.prototype.calculate = function(group) {
    // console.log(group)
  };



  // =====
  // TRAIN
  // =====


  LayersController.prototype.train = function(dataset) {};


  GroupsController.prototype.train = function(dataset) {};


  // ====
  // DRAW
  // ====


  Graphic.prototype.draw = function(el, width, height) {
    if (!_.isString(el)) { return this.el; }
    this.target = d3.select(el);
    this.width  = width  || parseInt(this.target.style('width'));
    this.height = height || parseInt(this.target.style('height'));
    this.el = d3.select(document.createElement('div'));
    this.el.append('svg').attr('width', this.width).attr('height', this.height).attr('class', 'graphic');
    this.facetsController.draw(this.facets, this.el, this.width, this.height);
  };


  FacetsController.prototype.draw = function(facets, el, width, height) {

    var that = this;

    var numFacets = facets.length;
    var ratio     = width/height >= 1 ? Math.floor(width/height) : 1/Math.floor(height/width);
    var numRows   = ratio >= 1 ? Math.ceil(numFacets/ratio) : Math.ceil(ratio/numFacets);
    var numCols   = Math.ceil(numFacets/numRows);

    this.width  = width/numCols;
    this.height = height/numRows;
    this.setRangeX(width, height, ratio, numFacets, numCols);
    this.setRangeY(width, height, ratio, numFacets, numRows);

    this.el = el.select('svg');
    this.el.selectAll('g.facet')
      .data(facets)
      .enter()
      .append('g')
      .attr('class', 'facet')
      .attr('data-key', function(facet) { return facet.key; })
      .attr('transform', function(facet) {
        return 'translate(' + that.scale.x(facet.key) + ',' + that.scale.y(facet.key) + ')';
      })
      .each(function(facet, index) {
        that.layersController.draw(facet, this);
      });

  };


  LayersController.prototype.draw = function(facet, el) {
    var that = this;
    this.el = d3.select(el);
    this.el.selectAll('g.layer')
      .data(facet.layers)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('data-geometry', function(layer) { return layer.geometry; })
      .each(function(layer) {
        that.groupsController.draw(layer, this);
      });
  };


  GroupsController.prototype.draw = function(layer, el) {
    var that = this;
    this.el = d3.select(el);
    this.el.selectAll('g.group')
      .data(layer.groups)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('data-group', function(group) {})
      .each(function(group) {
        // ok
      });
  };


  // ======
  // RENDER
  // ======


  Graphic.prototype.render = function() { this.target.html(this.el.html()); };


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