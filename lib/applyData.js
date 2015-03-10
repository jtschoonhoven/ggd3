// Apply Data
// ----------------------------------------------------
// Raw data may be passed in as an array. Or a named
// dataset may be passed as { key: '', values: [] }.

Graphic.prototype.applyData = function() {
  var data = [];

  // If one dataset was passed in, assign it to this.data.
  if (arguments.length === 1) {
    var dataset = arguments[0] || [];
    if (_.isArray(dataset))       { this.data = dataset; }
    else if (_.isObject(dataset)) { this.data = dataset.values; }
    return this;
    
  }

  // If multiple sets were passed in, join them.
  _.each(arguments, function(dataset, index) {
    if (_.isArray(dataset)) {
      _.each(dataset, function(row) { row.dataset = row.dataset || index });
      data = data.concat(dataset);
    }

    else if (_.isObject(dataset)) {
      _.each(dataset.values, function(row) { row.dataset = row.dataset || dataset.key || index });
      data = data.concat(dataset.values);
    }
  });

  this.data = data;
  return this;
};