
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

describe('Render', function() {


  it('if no parameters are given, renders an empty single facet', function() {
    var el = addDiv();
    var graphic = addGraphic(el);
    expect(el.select('svg .facet').length).to.equal(1);
    expect(el.select('svg .facet').selectAll('*').empty()).to.be.true;
    expect(el.select('svg .facet').attr('data-key')).to.equal('single facet');
  });


  it('if width and height are not specified, renders to current dimensions of element');


});


describe('Facets', function() {

  // var el = addDiv();
  // var data = data.threeDimensional;
  // var params = {
  //   facets: { flow: 'country' }, 
  //   layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }] 
  // };

});