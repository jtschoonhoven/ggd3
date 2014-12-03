

// GGD3
// ====


(function () {

  // Configure for Node and the browser.
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

  // Declare the module and top level methods.
  // ----------------------------------------------------
  // GGD3 starts as a humble object literal. It contains
  // all methods used to create a new Graphic and will
  // be exported to the global object.

  var ggd3 = {};

  // "Create" is a one-step method to create a new
  // graphic. Internally it simply calls the four other
  // top level methods in order.
  // ----------------------------------------------------

  var create = ggd3.create = function(opts) {
    if (opts.opts)   { this.options(opts); }
    if (opts.data)   { this.data(data); }
    if (opts.el)     { this.draw(el, height, width); }
    if (opts.render) { this.render(); }
  };


  var Graphic = ggd3.Graphic = function() {}

  _.extend(Graphic.prototype, {});


  var configure = ggd3.configure = function(opts) {

  };


  var Controller = ggd3.Controller = function(spec) {
    spec || spec = {};
    this.initialize.apply(this, arguments);
  };


  _.extend(Controller.prototype, {
    initialize: function() {}
  });



  // =============
  // EXPORT GLOBAL
  // =============


  // Export as Node module.
  // if (isNode) {
    // module.exports = Graphic;
  // }

  // Export to global context.
  // this.Graphic = Graphic;


})();