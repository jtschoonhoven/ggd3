
// Map Data to Components
// ----------------------------------------------------
// Once the graphic has been configured and has had
// data applied, that data may be mapped to components.

Graphic.prototype.mapData = function() {
  var that = this;

  var mappings = ['facetY', 'facetX', 'facet', 'group', 'geometry'];
  var mapping, result;

  // Add an empty array to graphic for each mapping.
  mappings.forEach(function(mapping) { that[mapping] = []; });

  // Use d3.nest() to perform a GroupBy of the dataset.
  nest(0, this.data);
  function nest(mapIndex, data) {
    var mapping = mappings[mapIndex];

    d3.nest()
      .key(function(row) { return row[that.spec.global[mapping]]; })
      .entries(data)
      .forEach(function(group, index) {
        if (mapping === 'geometry') { that.geometry.push(group.values); }

        else { 
          result = { key: that.spec.global[mapping], value: group.key };
          if (group.key !== 'undefined') { that[mapping].push(result); }
          nest(mapIndex+1, group.values);
        }
      });   
  }

  return this;
};