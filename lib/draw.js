
// Draw SVG
// ----------------------------------------------------

Graphic.prototype.draw = function(el, width, height) {
  if (el)     { this.spec.el = el; }
  if (width)  { this.spec.width = width; }
  if (height) { this.spec.height = height; }

  var noDimensions = (!el && (!width && !height));
  if (noDimensions) { throw Error('An element or height & width must be specified.'); }

  if (this.spec.el) { el = d3.select(this.spec.el); }
  width = this.spec.width   || parseInt(el.style('width'));
  height = this.spec.height || parseInt(el.style('height'));

  var svg = this.el.selectAll('svg')
    .data([1])
    .enter().append('svg')
    .attr('width', width)
    .attr('height', height)
    .attr('class', 'graphic');

  this.drawFacetY(svg, width, height);
};


// Y facets divide the svg horizontally. Each facet gets an
// equal share of the canvas.
Graphic.prototype.drawFacetY = function(svg, width, height) {
  var facetHeight = height / (this.facetY.length || 1);

  // Even if y facets aren't defined we still want to create
  // an element for them (to hold x & flow facets). If data
  // is empty, bind yFacet element to an empty object.

  var data = this.facetY;
  if (_.isEmpty(data)) { data = [{}]; }

  var facetY = svg.selectAll('g.facetY')
    .data(data)
    .enter().append('g')
    .attr('class', 'facetY')
    .attr('data-key', function(d) { return d.key; })
    .attr('data-value', function(d) { return d.value; })
    .attr('transform', function(d,i) {
      return 'translate('+ (facetHeight * i) +',0)';
    });

  // By default, y-axes are drawn at the left of each yFacet.
  if (!this.spec.independentAxes) {
    
  }

  this.drawFacetX(facetY, width, facetHeight);
};


// X facets divide each Y facet vertically. Each x facet gets
// an equal share of each y facet.
Graphic.prototype.drawFacetX = function(facetY, width, height) {
  var facetWidth = width / (this.facetX.length || 1);

  var data = this.facetX;
  if (_.isEmpty(data)) { data = [{}]; }

  var facetX = facetY.selectAll('g.facetX')
    .data(data)
    .enter().append('g')
    .attr('class', 'facetX')
    .attr('data-key', function(d) { return d.key; })
    .attr('data-value', function(d) { return d.value; })
    .attr('transform', function(d,i) {
      return 'translate(0,'+ (facetWidth * i) +')';
    });

  this.drawFacetFlow(facetX, facetWidth, height);
};


// Flow facets (elsewhere just called "facets") divide up the canvas
// as evenly as possible.
Graphic.prototype.drawFacetFlow = function(facetX, width, height) {
  var numFacets = this.facet.length || 1;

  // To calculate best fit, first we have to determine the ratio
  // of width:height to use for each facet.
  var widerThanTall = width/height >=1;
  var ratio = widerThanTall ? Math.floor(width/height) : 1/Math.floor(height/width);

  // Now that we have the ratio along with the actual dimensions 
  // of the canvas, we can calculate the total number of rows & cols.
  var numRows = ratio >= 1 ? Math.floor(width/height) : Math.ceil(ratio/numFacets);
  var numCols = Math.ceil(numFacets/numRows);

  var facetWidth = width/numCols;
  var facetHeight = height/numRows;

  var data = this.facet;
  if (_.isEmpty(data)) { data = [{}]; }

  var facetFlow = facetX.selectAll('g.facet')
    .data(data)
    .enter().append('g')
    .attr('class', 'facet')
    .attr('data-key', function(d) { return d.key; })
    .attr('data-value', function(d) { return d.value; })
    .attr('transform', function(d,i) {
      var colNum = i % ratio;
      var rowNum = Math.floor(i/ratio);
      return 'translate('+ (colNum * facetWidth) +','+ (rowNum * facetHeight) +')';
    });

  this.drawGroup(facetFlow, facetWidth, facetHeight);
};


// Groups organize data points. E.g. each separate line on a line
// chart is a group of data.
Graphic.prototype.drawGroup = function(facet, width, height) {
  var data = this.group;
  if (_.isEmpty(data)) { data = [{}]; }

  var group = facet.selectAll('g.group')
    .data(data)
    .enter().append('g')
    .attr('class', 'group')
    .attr('data-key', function(d) { return d.key; })
    .attr('data-value', function(d) { return d.value; });

  this.drawPointGeometry(group, width, height);
};


Graphic.prototype.drawPointGeometry = function(group, width, height) {
  var that = this;

  // Users might want to change geometry types without having to 
  // pass in arguments to the functions. Set vars here if undefined.
  group = group   || d3.selectAll('g.group');
  width = width   || parseInt(group.style('width'));
  height = height || parseInt(group.style('height'));

  d3.selectAll(group).each(function(datum, index) {
    var data = that.geometry[index];
    var selection = d3.selectAll(this);

    selection.selectAll('circle.point')
      .data(data)
      .enter().append('circle')
      .attr('class', 'point')
      .attr('r', 2)
      .attr('cx', 20)
      .attr('cy', 20)
  });
};