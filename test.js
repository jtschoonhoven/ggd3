
// ===========
// NODE CONFIG
// ===========

if (typeof module !== 'undefined' && module.exports) {

  d3 = require('d3');
  _  = require('underscore');

  var fs         = require('fs');
  var mocha      = require('mocha');
  var chai       = require('chai');
  var Graphic    = require('./ggd3');
  var data       = require('./data');

  // Copy HTML from test.html and write to fake DOM.
  var html = fs.readFileSync('./test.html', { encoding: 'utf8' });
  d3.select('html').html(html);

}


// =====================
// CONVENIENCE FUNCTIONS
// =====================

var i = 0;

function addDiv() {
  i++;
  d3.select('.container').append('div').attr('class', 'example').attr('id', 'example-' + i);
  return '#example-' + i;
}


// =====
// TESTS
// =====


var expect = chai.expect;

describe('Facets', function() {

  it('creates a facet group for each key specified by the facet mapping (float)', function() {
    var el = addDiv();
    var opts = {
      facets: { flow: 'country' }, 
      layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }]
    };
    var graphic = new Graphic(opts, data.threeDimensional, el, null, null, true);
    expect(d3.select(el).selectAll('svg .facet').size()).to.equal(2);
  });


  it('creates a layer group for each key specified by the group mapping', function() {
    var el = addDiv();
    var opts = {
      facets: {},
      layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country', group: 'country' } }] 
    };
    var graphic = new Graphic(opts, data.threeDimensional, el, null, null, true);
    expect(d3.select(el).selectAll('svg .facet').size()).to.equal(1);
  });

});


// var data = data.threeDimensional;
// var params = {
//   facets: { flow: 'country' }, 
//   layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }] 
// };