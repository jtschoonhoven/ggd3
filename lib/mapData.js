// Map Data to Components.
Graphic.prototype.mapData = function(data, spec, done) {
  spec = spec || {};
  data = data || [];

  // Unless facets are floated or independent, get min and max here.
  if (!spec.independentAxes && !spec.floatFacetScaleY) {
    var yExtent = d3.extent(data, function(row) { return row[spec.y]; });
  }

  mapYFacets.call(this, data, function() {
    if (done) { done(); } 
  });
};


// Like a SQL group by, D3's nest organizes the given
// dataset by key. Each group is sent to iterator.
function nest(data, key, iterator, done) {
  var nestedData = d3.nest()
    .key(function(row) { return row[key]; })
    .entries(data)

  // Apply iterator to each group, then callback with nestedData.
  async.each(nestedData, iterator, function() { done(nestedData); });
}


function mapYFacets(data, done) {
  var that = this;
  var key = this.spec.facetY;

  nest(data, key, function(nested, cb) {
    var yFacet = { key: key, value: nested.key };

    // If y-facets are floated, we'll need the extent of each.
    if (that.spec.floatFacetScaleY) {
      yFacet.extent = d3.extent(nested.values, function(row) { return row[that.spec.y]; });
    }

    // And unless they're independent, grab extent from spec.
    else if (!that.spec.independentAxes) {
      yFacet.extent = [that.spec.yMin, that.spec.yMax];
    }

    that.yFacets.push(yFacet);
    mapXFacets.call(that, nested.values, cb);
  },
  done);
}


function mapXFacets(data, done) {
  var that = this;
  var key  = this.spec.facetX;  

  nest(data, key, function(nested, cb) {
    var xFacet = { key: key, value: nested.key };

    if (that.spec.floatFacetScaleY) {
      xFacet.extent = d3.extent(nested.values, function(row) { return row[that.spec.x]; });
    }
    else if (!that.spec.independentAxes) {
      xFacet.extent = [that.spec.xMin, that.spec.xMax];
    }

    that.xFacets.push(xFacet);
    mapFlowFacets.call(that, nested.values, cb);
  }, 
  done);
}


function mapFlowFacets(data, done) {
  var that = this;
  var key  = this.spec.facet;

  nest(data, key, function(nested, cb) {
    var facet = { key: key, value: nested.key };
    if (nested.key !== 'undefined') { that.facets.push(facet); }
    mapGroups.call(that, nested.values, cb);
  }, 
  done);
}


function mapGroups(data, done) {
  var that = this;
  var key  = this.spec.group;

  nest(data, key, function(nested, cb) {
    var group = { key: key, value: nested.key };
    if (nested.key !== 'undefined') { that.group.push(group); }
    mapGeometries.call(that, nested.values, cb);
  }, 
  done);
}


function mapGeometries(data, done) {
  var that = this;
  var key  = this.spec.geometry;
  console.log('!!!!!!!')
  console.log(data)
  
  nest(data, key, function(nested, cb) {
    that.geometries.push(nested.values);
    cb();
  }, 
  done);
}