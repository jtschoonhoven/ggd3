
var data = {

  simple: [
    { units: 1, frequency: 2 },
    { units: 3, frequency: 4 }
  ],

  threeDimensional: [
    { day: 1, country: 'US', units: 1 },
    { day: 2, country: 'US', units: 2 },
    { day: 3, country: 'US', units: 3 },
    { day: 1, country: 'CA', units: 2 },
    { day: 2, country: 'CA', units: 3 },
    { day: 3, country: 'CA', units: 4 }
  ],

  twoDimensional: [
    { day: 1, units: 9 },
    { day: 2, units: 3 },
    { day: 3, units: 5 },
    { day: 4, units: 1 },
  ]

};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = data;
}