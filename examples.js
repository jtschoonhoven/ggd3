
var threeDimensional = [
  { day: 1, country: 'US', units: 3 },
  { day: 2, country: 'US', units: 4 },
  { day: 3, country: 'US', units: 5 },
  { day: 1, country: 'CA', units: 6 },
  { day: 2, country: 'CA', units: 3 },
  { day: 3, country: 'CA', units: 1 }
];

var twoDimensional = [
  { day: 1, units: 9 },
  { day: 2, units: 3 },
  { day: 3, units: 5 },
  { day: 4, units: 1 },
];

var examples = [

  { 
    params: { 
      facets: { flow: 'country' }, 
      layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units', color: 'country' } }] 
    },
    data: threeDimensional
  },

  {
    params: {
      layers: [{ geometry: 'point', mapping: { x: 'day', y: 'units' } }]
    },
    data: twoDimensional
  }

];

examples.forEach(function(example) {
  var el = d3.select('.container').append('div').attr('class', 'example');
  var graphic = new Graphic(example.data, example.params);
  graphic.render(el);
});