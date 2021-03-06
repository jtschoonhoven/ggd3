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

  this.yFacets    = [];
  this.xFacets    = [];
  this.facets     = [];
  this.groups     = [];
  this.geometries = [];

  this.applyData = function(data) { this.data = data; }
};


ggd3.create = function(spec, data, done) {
  var graphic = new Graphic();

  graphic.data = data || [];
  graphic.spec = graphic.configure(spec);

  if (done) {
    async.waterfall([
      async.apply(graphic.parseData.bind(graphic), graphic.data, graphic.spec),
      async.apply(graphic.mapData.bind(graphic), graphic.data),
      async.apply(graphic.draw.bind(graphic), graphic.spec.el, graphic.spec.width, graphic.spec.height)
    ], 
    done);
  }

  else { return graphic; }
};
