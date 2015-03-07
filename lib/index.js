// Configure for Node and the browser.
var isNode = false;
if (typeof module !== 'undefined' && module.exports) {
  isNode = true; 
  this.d3 = require('d3');
  this._  = require('underscore');

  // Uses jsdom to build HTML server side.
  document = require('jsdom').jsdom();
  window = document.parentWindow;
}

if (!d3 || !_) { throw 'ggd3 requires D3 and Underscore.'; }


var ggd3 = {};
ggd3.VERSION = '0.0.0';


// Each chart is an instance of Graphic.
var Graphic = function() {
  this.el = d3.select(document.createElement('div'));
};


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
  geometry: 'point',
  floatFacetScaleX: false,
  floatFacetScaleY: false
};