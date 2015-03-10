
// ===========
// NODE CONFIG
// ===========

if (typeof module !== 'undefined' && module.exports) {
  async = require('async');
  d3    = require('d3');
  _     = require('underscore');

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

// Add a method to d3.selection that returns number 
// of elements in selection.
d3.selection.prototype.size = function() {
  var n = 0;
  this.each(function() { ++n; });
  return n;
};


describe('configure', function() {
  var graphic = ggd3.create();

  describe('defaults', function() {

      it('are used to fill in missing values for each component', function() {
        graphic.configure({});
        expect(graphic.spec).to.eql(ggd3.defaults);
      });

      it('do not overwrite user defined properties', function() {
        graphic.configure({ title: 'Test' });
        expect(graphic.spec.title).to.equal('Test');
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


  describe.skip('y-facets', function() {

    var data = [
      { country: 'AA', units: 1 }, 
      { country: 'BB', units: 2 }, 
      { country: 'CC', units: 3 }
    ];

    var graphic = ggd3.create(null, data);

    it('are created even if not mapped to data', function() {
      graphic.mapData().draw(null, 10, 60);
      var yFacets = graphic.el.selectAll('g.facetY');
      expect(yFacets.size()).to.equal(1);
    });

    it.skip('are created for each unique value in grouping', function() {
      var spec = { facetY: 'country' };
      graphic.configure(spec).mapData().draw(null, 10, 60);
      var yFacets = graphic.el.selectAll('g.facetY');
      expect(yFacets.size()).to.equal(3);
    });

    it.skip('evenly divide the vertical space of the svg', function() {
      var graphic = ggd3.create({ facetY: 'country' }, data);
      graphic.draw(null, 10, 60);
      var yFacets = graphic.el.selectAll('g.facetY');
      yFacets.each(function(facet) {
        var height = parseInt(facet.style('height'));
        console.log(height)
      });
    });

  });


  describe.skip('', function() {

    it('facetY', function() {
      var spec = { facetY: 'country' };
      var data = [{ country: 'AA', units: 1 }, { country: 'BB', units: 2 }];
      var graphic = ggd3.create(spec, data);
      graphic.draw(null, 20, 20)
      console.log(graphic.el.html());
    });

    it('facetX', function() {
      var spec = { facetX: 'country' };
      var data = [{ country: 'AA', units: 1 }, { country: 'BB', units: 2 }];
      var graphic = ggd3.create(spec, data);
      graphic.draw(null, 20, 20)
      console.log(graphic.el.html());
    });

    it('facetFlow', function() {
      var spec = { facet: 'country' };
      var data = [{ country: 'AA', units: 1 }, { country: 'BB', units: 2 }, { country: 'BB', units: 2 }];
      var graphic = ggd3.create(spec, data);
      graphic.draw(null, 20, 20)
      console.log(graphic.el.html());
    });

  });
});