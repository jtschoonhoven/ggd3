

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

  var ggd3 = {
    factories: {},
    components: {}
  };

  // "Create" is a one-step method to create a new
  // graphic. Internally it simply calls all (or some) of 
  // the other top level methods in order.

  var create = ggd3.create = function(opts) {
    if (opts.opts)   { this.configure(opts); }
    if (opts.data)   { this.data(data); }
    if (opts.el)     { this.draw(el, height, width); }
    if (opts.render) { this.render(); }
  };

  // Configure
  // ----------------------------------------------------
  // "Configure" is a top level method that configures
  // the component factories.

  var configure = ggd3.configure = function(opts) {
    var defaults = { flow: undefined, gridX: undefined, gridY: undefined };
    this.factories.facet = new FacetFactory()
  };

  // Set up a Factory class that the component factories
  // will inherit from.

  var Factory = function() {}

  _.extend(Factory.prototype, {
    initialize: function() {}
  })


  var FacetFactory = function(spec) {
    spec || spec = {};
    this.initialize.apply(this, arguments);
  };



  // "Extend" should look familiar if you've used 
  // Backbone. Returns a new object that inherits from
  // its parent and defined properties.

  var extend = function(protoProperties, instanceProperties) {
    var parent = this;
    var child = parent.apply(this, arguments);
    _.extend(child, parent, instanceProperties);
    child.prototype = parent.prototype;
    return child;
  };

  Factory.extend = extend;

  // Export global
  // ----------------------------------------------------
  // Export as a Node module if applicable. Either way,
  // attach ggd3 to the global object.

  if (isNode) { module.exports = ggd3; }
  this.ggd3 = ggd3;

})();