
// If Node...
if (typeof module !== 'undefined' && module.exports) {

  // Create a fake DOM.
  var jsdom = require('jsdom').jsdom;
  document = jsdom('<html><body><div class="container"></div></body></html>');
  window = document.parentWindow;

  d3 = require('d3');
  _  = require('underscore');

  var mocha      = require('mocha');
  var chai       = require('chai');
  var sampleData = require('./sampleData');

}

var expect = chai.expect;


describe('trying things out', function() {

  it('fails', function() {
    expect(false).to.be.true;
  })

})


// var examples = [

//   { 
//     params: { 
//       facets: { flow: 'country' }, 
//       layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }] 
//     },
//     data: threeDimensional
//   },

//   {
//     params: {
//       layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units' } }]
//     },
//     data: twoDimensional
//   }

// ];

// examples.forEach(function(example) {
//   var el = d3.select('.container').append('div').attr('class', 'example');
//   var graphic = new Graphic(example.data, example.params);
//   graphic.render(el);
// });