
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
  

  // =======
  // GRAPHIC
  // =======


  function Graphic(opts) {
    opts = _.defaults(opts || {}, { facets: {}, layers: {}, groups: {}, shapes: {}, scales })
    this.facets     = new FacetsController(opts.facets);
    this.layers     = new LayersController(opts.layers);
    this.groups     = new GroupsController(opts.groups);
    this.shapes     = new ShapesController(opts.shapes);
    this.scales     = new ScalesController(opts.scales);
  }


  // =============
  // DEFINE MODELS
  // =============

  // A Graphic is made up of layered instances of models.

  function Facet() {}

  function Layer() {}

  function Geometry() {}

  function Scale() {}


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