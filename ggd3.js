

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

  var ggd3 = {};
  ggd3.VERSION = 0.0.0

  // "Create" returns a new instance of Graphic and
  // optionally configures and renders it to the DOM.
  // None of the arguments are required. 

  ggd3.create = function(opts, data, selector, width, height, renderNow) {
    var graphic = new Graphic();
    if (opts)   { graphic.configure(opts); }
    if (data)   { graphic.data(data); }
    if (el)     { graphic.draw(el, height, width); }
    if (render) { graphic.render(); }
    return graphic;
  };

  // The Graphic constructor
  // ----------------------------------------------------
  // A new Graphic contains all the methods that 
  // configure and render an SVG. That process is
  // represented by four functions. In order,
  // **configure**, **data**, **draw**, and **render**.

  var Graphic = function() {}

  // Step #1: Configure
  // ----------------------------------------------------
  // Our end goal is to represent a dataset with various
  // components (facets, layers, geometries) and to
  // render those to the DOM. The first step is to
  // configure factory functions for those components so
  // that, when data is applied to the factory function,
  // a properly configured component is returned.

  Graphic.prototype.configure = function(opts) {};

  // Step #2: Apply data
  // ----------------------------------------------------
  // Now that component factories have been created and
  // configured, the next step is to apply that data to
  // the factories and manufacture some components.

  Graphic.prototype.data = function(data) {};

  // Step #3: Draw SVG
  // ----------------------------------------------------
  // Now that components have been created, representing
  // them as an SVG is trivial. Note that the SVG is not
  // attached to the DOM. That is accomplished in step 4.

  Graphic.prototype.draw = function(selector, height, width) {};

  // Step #4: Render SVG
  // ----------------------------------------------------
  // The SVG has been drawn, all that is left is to
  // attach it to the DOM.

  Graphic.prototype.render = function(selector) {
    this.target.html(this.el.html());
  };

  // Return SVG HTML or undefined.

  Graphic.prototype.html = function() {};

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