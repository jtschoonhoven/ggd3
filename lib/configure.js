Graphic.prototype.configure = function(spec) {
  if (!spec) { spec = {}; }

  // Properties at the top level of spec are "global".
  var components = ['global', 'facets', 'groups', 'shapes'];
  var globalSpecs = _.omit(spec || {}, components);

  // Fill in values in spec from defaults & globals.
  spec.global = _.defaults(spec.global || {}, globalSpecs, ggd3.defaults);
  spec.facets = _.defaults(spec.facets || {}, globalSpecs, ggd3.defaults);
  spec.groups = _.defaults(spec.groups || {}, globalSpecs, ggd3.defaults);
  spec.shapes = _.defaults(spec.shapes || {}, globalSpecs, ggd3.defaults);

  // Filter out any noncomponent specs & apply.
  spec = _.pick(spec, components);
  this.spec = spec;
  return this;
};