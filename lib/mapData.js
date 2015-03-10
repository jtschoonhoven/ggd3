// Map Data to Components.
Graphic.prototype.mapData = function(done) {
  this.yFacets    = [];
  this.xFacets    = [];
  this.facets     = [];
  this.groups     = [];
  this.geometries = [];
  mapYFacets.call(this, this.data, function() {
    if (done) { done(); }
  });
};


// Like an SQL group by, D3's nest organizes the given
// dataset by key. Each group is sent to iterator.
function nest(data, key, iterator, done) {
  var nestedData = d3.nest()
    .key(function(row) { return row[key]; })
    .entries(data)
  async.each(nestedData, iterator, done);
}


function mapYFacets(data, done) {
  var that = this;
  var key  = this.spec.facetY

  nest(data, key, function(nested, cb) {
    var yFacet = { key: key, value: nested.key };
    if (nested.key !== 'undefined') { that.yFacets.push(yFacet); }
    mapXFacets.call(that, nested.values, cb);
  }, 
  done);
}


function mapXFacets(data, done) {
  var that = this;
  var key  = this.spec.facetX;

  nest(data, key, function(nested, cb) {
    var xFacet = { key: key, value: nested.key };
    if (nested.key !== 'undefined') { that.xFacets.push(xFacet); }
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
  
  nest(data, key, function(nested, cb) {
    that.geometries.push(nested.values);
    cb();
  }, 
  done);
}