ggd3.defaults = {
  title: undefined,
  el: undefined,
  width: undefined,
  height: undefined,
  x: undefined,
  y: undefined,
  color: undefined,
  size: undefined,
  facet: undefined,
  facetX: undefined,
  facetY: undefined,
  geometry: 'point',
  floatFacetScaleX: false,
  floatFacetScaleY: false
};

Graphic.prototype.configure = function(spec) {
  this.spec = _.defaults(spec || {}, ggd3.defaults)
  return this;
};