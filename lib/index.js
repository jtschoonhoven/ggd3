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
  this.applyData = function(data) { this.data = data; }
};


ggd3.create = function(spec, data) {
  var graphic = new Graphic();
  graphic.configure(spec);
  graphic.analyzeData();
  graphic.mapData();

  // If the graphic's dimensions were specified
  // or if they can be retrieved from "el", go
  // ahead and call graphic.draw.

  var el     = graphic.spec.el;
  var width  = graphic.spec.width;
  var height = graphic.spec.height;

  var hasDimensions = el || (height && width);
  if (hasDimensions) { graphic.draw(el, width, height); }

  return graphic;
};