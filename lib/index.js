

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

ggd3.Graphic = function() {
  this.el = d3.select(document.createElement('div'));
};

// "Create" returns a new instance of Graphic.
ggd3.create = function(spec, data) {
  var graphic = new this.Graphic();
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

