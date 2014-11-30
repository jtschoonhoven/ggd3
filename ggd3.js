
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
    if(data)      { this.data(data); }
    if(el)        { this.build(el, width, height); }
    if(renderNow) { this.render(); }
  }


  Graphic.prototype.configure = function(opts) {
    opts = _.defaults(opts || {}, { graphic: {}, facets: {}, layers: [], groups: [] });
    opts.facets = this.facetsController.configure(opts);
    opts.layers = this.layersController.configure(opts);
    opts.groups = this.groupsController.configure(opts);
    opts.geometries = this.geometriesController.configure(opts);
  };


  Graphic.prototype.data = function(dataset) {
    if (!_.isArray(dataset)) { return this.dataset || []; }
    this.dataset = dataset;
    this.facetsController.train(dataset);
    this.layersController.train(dataset);
    this.groupsController.train(dataset);
    this.facets = this.facetsController.nest(dataset);
  };


  Graphic.prototype.build = function(el, width, height) {
    if (!_.isString(el)) { return this.el; }
    this.target = d3.select(el);
    this.width  = width  || parseInt(this.target.style('width'));
    this.height = height || parseInt(this.target.style('height'));
    this.el = d3.select(document.createElement('div'));
    this.el.append('svg').attr('width', this.width).attr('height', this.height).attr('class', 'graphic');
    this.facetsController.build(this.facets, this.el, this.width, this.height);
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
    this.key = data.key;
    this.layers = data.layers;
    this.opts = data.opts;
    this.index = data.index;
  }


  function FacetsController(layersController) {
    this.scale = { x: d3.scale.ordinal(), y: d3.scale.ordinal(), domain: [] };
    this.layersController = layersController;
  }


  FacetsController.prototype.configure = function(opts) {
    this.opts = _.extend({}, facetsDefaults, opts.graphic, opts.facets);
    if (this.opts.gridX || this.opts.gridY) { _.extend(this, new GridFacetController()); }
    else { _.extend(this, new FlowFacetController()); }
    return this.opts;
  };


  function FlowFacetController() {


    this.train = function(dataset) {
      var that = this;
      this.scale.domain = d3.set(dataset.map(function(row) { return row[that.opts.flow]; })).values();
    };


    this.nest = function(dataset) {
      var that = this;
      var facets = d3.nest()
        .key(function(row) { return row[that.opts.flow]; })
        .entries(dataset)
        .map(function(facet, index) {
          var facet = { opts: that.opts, values: facet.values, index: index };
          facet.layers = that.layersController.nest(facet);
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


  FacetsController.prototype.build = function(facets, el, width, height) {

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
        that.layersController.build(facet, this);
      });

  };


  // ======
  // LAYERS
  // ======


  var layerDefaults = {
    geometry: 'point',
    mapping: {}
  };


  function Layer(data) {
    this.opts = data.opts;
    this.groups = data.groups;
  }


  function LayersController(groupsController) {
    this.groupsController = groupsController;
  }


  LayersController.prototype.configure = function(opts) {
    if (!opts.layers.length > 0) { opts.layers[0] = _.extend({}, layerDefaults, opts.graphic); }
    this.opts = opts.layers.map(function(layerOpts) { return _.extend({}, layerDefaults, opts.graphic, layerOpts); });
    return this.opts;
  };


  LayersController.prototype.train = function(dataset) {};


  LayersController.prototype.nest = function(facet) {
    var that = this;
    var layers = this.opts.map(function(layerOpts, index) {
      var layer = { opts: layerOpts, values: facet.values, index: index };
      layer.groups = that.groupsController.nest(layer);
      return new Layer(layer);
    });
    return layers;
  };


  LayersController.prototype.build = function(facet, el) {
    var that = this;
    this.el = d3.select(el);
    this.el.selectAll('g.layer')
      .data(facet.layers)
      .enter()
      .append('g')
      .attr('class', 'layer')
      .attr('data-geometry', function(layer) { return layer.geometry; })
      .each(function(layer) {
        that.groupsController.build(layer, this);
      });
  };


  // ======
  // GROUPS
  // ======


  var groupsDefaults = {
    group: undefined
  };


  function Geometry(data) {
    console.log('new geo');
  }


  function GroupsController(geometriesController) {
    this.geometriesController = geometriesController;
  }


  GroupsController.prototype.configure = function(opts) {
    if (!opts.groups.length > 0) { opts.groups = opts.layers.map(function(layer) { return _.extend(layer, groupsDefaults); }); }
    this.opts = opts.groups.map(function(groupOpts, index) { 
      return _.extend({}, groupsDefaults, opts.graphic, opts.facets, opts.layers[index], groupOpts); 
    });
    return this.opts;
  };


  GroupsController.prototype.train = function(dataset) {};


  GroupsController.prototype.nest = function(layer) {
    var that = this;
    var groups = d3.nest()
      .key(function(row) { return row[layer.opts.mapping.group]; })
      .entries(layer.values)
      .map(function(group) {
        group.opts = that.opts[layer.index];
        return that.geometriesController.create(group);
      });
    return groups;
  };


  GroupsController.prototype.build = function(layer, el) {
    var that = this;
    this.el = d3.select(el);
    this.el.selectAll('g.group')
      .data(layer.groups)
      .enter()
      .append('g')
      .attr('class', 'group')
      .attr('data-group', function(group) {
        // ok
      })
      .each(function(group) {

      });
  };



  // ========
  // GEOMETRY
  // ========


  var geometriesDefaults = {};


  function GeometriesController() {}


  GeometriesController.prototype.configure = function(opts) {
    if (!opts.geometries.length > 0) { opts.geometries = opts.groups.map(function(groupOpts) { return _.extend(groupOpts, geometriesDefaults); }); }
    this.opts = opts.geometries.map(function(geometriesOpts, index) {
      return _.extend({}, geometriesDefaults, opts.graphic, opts.facets, opts.layers[index], opts.groups[index], geometriesOpts); 
    });
    return this.opts;
  };


  GeometriesController.prototype.create = function(group) {
    console.log(group)
  };


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