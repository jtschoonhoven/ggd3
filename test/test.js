
// ===========
// NODE CONFIG
// ===========

if (typeof module !== 'undefined' && module.exports) {
  d3 = require('d3');
  _  = require('underscore');

  var fs    = require('fs');
  var mocha = require('mocha');
  var chai  = require('chai');
  var ggd3  = require('../ggd3');
  var data  = require('../data');

  // Copy HTML from test.html and write to fake DOM.
  var html = fs.readFileSync('./test/test.html', { encoding: 'utf8' });
  d3.select('html').html(html);
}

var expect = chai.expect;


describe('configure', function() {

  var graphic = ggd3.create();
  var components = Object.keys(graphic.spec);

  describe('defaults', function() {

      it('are used to fill in missing values for each component', function() {
        graphic.configure({});
        _.each(components, function(component) {
          expect(graphic.spec[component]).to.eql(ggd3.defaults);
        });
      });

      it('do not overwrite user defined properties', function() {
        graphic.configure({ title: 'Test' });
        _.each(components, function(component) {
          expect(graphic.spec[component]['title']).to.equal('Test');
        });
      });

  });
});


describe('applyData', function() {

  var graphic = ggd3.create();

  describe('Apply a single dataset', function() {

    it('from an array', function() {
      var dataset = [{ item: 'A', units: 1 }, { item: 'B', units: 2 }];
      graphic.applyData(dataset);
      expect(graphic.data).to.eql(dataset);
    });

    it('from an object', function() {
      var dataset = { key: 'Test', values: [{ item: 'A', units: 1 }, { item: 'B', units: 2 }] };
      graphic.applyData(dataset);
      expect(graphic.data).to.eql(dataset.values);
    });

  });


  describe('Apply multiple datasets', function() {

    it('and automatically add a "dataset" field to each set', function() {
      var set1 = [{ item: 'A', units: 1 }];
      var set2 = [{ item: 'B', units: 2 }];
      var expected = [{ item: 'A', units: 1, dataset: 0 }, { item: 'B', units: 2, dataset: 1 }];
      graphic.applyData(set1, set2);
      expect(graphic.data).to.eql(expected);
    });

    it('but do not overwrite an existing "dataset" field', function() {
      var set1 = [{ item: 'A', units: 1, dataset: 'first' }];
      var set2 = [{ item: 'B', units: 2, dataset: 'second' }];
      var expected = set1.concat(set2);
      graphic.applyData(set1, set2);
      expect(graphic.data).to.eql(expected);
    });

    it('from objects and specify the "dataset" field', function() {
      var set1 = { key: 'first', values: [{ item: 'A', units: 1 }] };
      var set2 = { key: 'second', values: [{ item: 'B', units: 2 }] };
      var expected = [{ item: 'A', units: 1, dataset: 'first' }, { item: 'B', units: 2, dataset: 'second' }];
      graphic.applyData(set1, set2);
      expect(graphic.data).to.eql(expected);
    });

  });


  describe.skip('Map data', function() {

    it('to x-facets', function() {
      var spec = { facetX: 'country' };
      var data = [{ country: 'AA', units: 1 }, { country: 'BB', units: 2 }];
      var graphic = ggd3.create(spec, data);
    });

  });


  describe('Draw', function() {

    it('...', function() {
      var spec = { facetY: 'country' };
      var data = [{ country: 'AA', units: 1 }, { country: 'BB', units: 2 }];
      var graphic = ggd3.create(spec, data);
      graphic.draw(null, 20, 20)
      console.log(graphic.el.html());
    });

  });
});