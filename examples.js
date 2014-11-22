
var sampleData = [
  { day: 1, country: 'US', units: 3 },
  { day: 2, country: 'US', units: 4 },
  { day: 3, country: 'US', units: 5 },
  { day: 1, country: 'CA', units: 6 },
  { day: 2, country: 'CA', units: 3 },
  { day: 3, country: 'CA', units: 1 }
];

var el = d3.select('#example-1');
var graphic = new Graphic(sampleData);

graphic.render(el);
