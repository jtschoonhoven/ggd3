
// ===========
// NODE CONFIG
// ===========

if (typeof module !== 'undefined' && module.exports) {

  // Create a fake DOM.
  document = require('jsdom').jsdom();
  window = document.parentWindow;

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


function addDiv() {
  return d3.select('.container').append('div').attr('class', 'example');
}

function addGraphic(el, data, params, width, height) {
  var graphic = new Graphic(data, params);
  return graphic.render(el, width, height);
}


// =====
// TESTS
// =====


var expect = chai.expect;


describe('Facets', function() {

  it('creates a facet group for each key specified by the facet mapping (float)', function() {
    var el = addDiv();
    var params = {
      facets: { flow: 'country' }, 
      layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }] 
    };
    var graphic = addGraphic(el, data.threeDimensional, params);
    expect(el.selectAll('svg .facet').size()).to.equal(2);
  });


  it('creates a layer group for each key specified by the group mapping', function() {
    var el = addDiv();
    var params = {
      layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country', group: 'country' } }] 
    };
    var graphic = addGraphic(el, data.threeDimensional, params);
    expect(el.selectAll('svg .facet').size()).to.equal(1);
  });

});


// var data = data.threeDimensional;
// var params = {
//   facets: { flow: 'country' }, 
//   layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }] 
// };