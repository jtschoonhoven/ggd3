
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


describe('Render', function() {


  it('if no parameters are given, defaults to single facet scatterplot', function() {

    var el = addDiv();
    var graphic = addGraphic(el);

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

  // addGraphic(el, data, params);

  // it('test');

});


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