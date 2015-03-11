ggd3.defaults = {

  // Display a title above the chart.
  title: undefined,

  // Selector for destination graphic.
  el: undefined,

  // Draw a graphic of these dimensions, else inherit from el.
  width: undefined,
  height: undefined,

  // Map column names to attributes/components.
  x: undefined,
  y: undefined,
  color: undefined,
  size: undefined,
  facet: undefined,
  facetX: undefined,
  facetY: undefined,

  // Geoms may be point, line, or bar (more to come).
  geometry: 'point',

  // If true, each facet will scale its x-axis independently.
  floatFacetScaleX: false,
  floatFacetScaleY: false,

  // Datatypes may be string, number, or time.
  xType: undefined,
  yType: undefined,
  colorType: undefined,
  sizeType: undefined,
  facetType: undefined,
  facetXType: undefined,
  facetYType: undefined
};


Graphic.prototype.configure = function(spec, done) {
  this.spec = _.defaults(spec || {}, ggd3.defaults)
  if (done) { done(); }
};