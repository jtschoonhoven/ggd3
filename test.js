
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

describe('Configure', function() {
  it('opts defined in an upper level component cascade to lower level components', function() {
    var inputOpts = { 
      x: 'X',
      y: 'Y',
      graphic: { gridX: 'A' }, 
      facets: { gridY: 'C', group: 'D', color: 'E' }, 
      layers: [{ geometry: 'F', color: 'G' }, { geometry: 'H', color: 'I' }]
    };

    var graphic = ggd3.create(inputOpts);

    // Calling graphic.configure() returns the parsed options.
    var outputOpts = graphic.configure();

    expect(outputOpts).to.have.keys(['graphic', 'facets', 'layers']);

    // The "X" property defined outside of a component class
    // cascades to all components.
    expect(outputOpts.graphic).to.have.deep.property('x', 'X');
    expect(outputOpts.facets).to.have.deep.property('x', 'X');
    expect(outputOpts.layers[0]).to.have.deep.property('x', 'X');

    // The "color" property exists on the graphic, but it is
    // undefined. It exists as specified on facets and layers.
    expect(outputOpts.graphic).to.contain.keys('color');
    expect(outputOpts.facets.graphic).to.be.undefined;
    expect(outputOpts.facets).to.have.deep.property('color', 'E');
    expect(outputOpts.layers[0]).to.have.deep.property('color', 'G');    
  });
});

describe('Facets', function() {

  it('creates a facet group for each key specified by the facet mapping (float)', function() {
    var el = addDiv();
    var opts = {
      facets: { flow: 'country' }, 
      layers: [{ geometry: 'point', x: 'day', y: 'units', color: 'country' }]
    };
    var graphic = ggd3.create(opts, data.threeDimensional, el, null, null, true);
    expect(d3.select(el).selectAll('svg .facet').size()).to.equal(2);
  });


  it('creates a layer group for each key specified by the group mapping', function() {
    var el = addDiv();
    var opts = {
      facets: {},
      layers: [{ geometry: 'point', x: 'day', y: 'units', color: 'country', group: 'country' }] 
    };
    var graphic = ggd3.create(opts, data.threeDimensional, el, null, null, true);
    expect(d3.select(el).selectAll('svg .facet').size()).to.equal(1);
  });

});


// var data = data.threeDimensional;
// var params = {
//   facets: { flow: 'country' }, 
//   layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }] 
// };