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


ggd3.create = function(spec, data, done) {
  var graphic = new Graphic();

  graphic.data = data || [];
  graphic.spec = graphic.configure(spec);

  async.series([
    function(cb) { graphic.parseData(data, spec, cb); },
    
    function(cb) { graphic.mapData(data, spec, function(err, mappings) {
      graphic.mappings = mappings;
      cb();
    })},

    function(cb) { graphic.draw(data, spec, graphic.mappings, function(err, el) {
      graphic.el = el
    })}
  ])

  graphic.parseData(graphic.data, graphic.spec, function(err) {

  })

  if (done) {
    async.waterfall([
      async.apply(graphic.analyzeData, graphic.data, graphic.spec),
      async.apply(graphic.mapData, graphic.data, graphic.spec),
      async.apply(graphic.draw, graphic.data, graphic.spec, graphic.mappings)
    ], 
    done);
  }

  else { return graphic; }
};