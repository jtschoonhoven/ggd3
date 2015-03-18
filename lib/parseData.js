// Determine data types and some stats. 
// TODO: add parseAsBool
// TODO: refactor for clarity.
Graphic.prototype.parseData = function(data, spec, done) {
  data = data || [];
  spec = spec || {};

  var parsedColumns = {};
  var mappings = [
    { name: 'x', type: spec.xType }
  , { name: 'y', type: spec.yType }
  , { name: 'color', type: spec.colorType }
  , { name: 'size', type: spec.sizeType }
  , { name: 'facet', type: spec.facetType }
  , { name: 'facetX', type: spec.facetXType }
  , { name: 'facetY', type: spec.facetYType }
  ];

  // Parse, then add to parsedData to keep track of.
  function parseAndAdd(colName, parseFunc, next) {
    async.map(data, function(row, cb) { parseFunc(row[colName], cb); }
    , function(err, res) {
      if (err) { return next(err); }
      parsedColumns[colName] = res;
      next(null, res);
    });
  }

  async.eachSeries(mappings, function(mapping, next) {
    var colName = spec[mapping];

    // Check that the mapping is defined and has not already been parsed.
    if (!colName || parsedColumns[colName]) { return next(); }

    // Then check whether the type has been set explicitly.
    if (mapping.type === 'date') { return parseAndAdd(colName, parseAsDate, next); }
    if (mapping.type === 'number') { return parseAndAdd(colName, parseAsNumber, next); }
    if (mapping.type === 'string') { return parseAndAdd(colName, parseAsString, next); }

    // Otherwise we'll figure out the datatype for ourselves.
    getColumnTypeAndParse(data, colName, function(err, res, type) {
      if (err) { return next(err); }
      spec[mapping + 'Type'] = type;
      parsedColumns[colName] = res;
      next();
    });
  }, 

  // Handle parsed data after eachSeries completes.
  function(err) {
    if (err) { return done(err); }

    var parsedData = [];
    var columns = Object.keys(parsedColumns);

    // For each row of data.
    var i = 0;
    async.map(data, function(row, cb) {
      var parsedRow = {};

      columns.forEach(function(colName) { 
        parsedRow[colName] = parsedColumns[colName][i]; 
      });

      parsedData.push(parsedRow);
      i++;
      cb(null, parsedRow);
    }, done)

  });
};


function getColumnTypeAndParse(data, colName, done) {

  function parseAsType(parseFunc, next) {
    async.map(data, function(row, cb) { parseFunc(row[colName], cb); }, next)
  }

  // Try first to parse as date, then as number, finally coerce to string.
  parseAsType(parseAsDate, function(err, res) {
    if (!err) { return done(null, res, 'date'); }

    parseAsType(parseAsNumber, function(err, res) {
      if (!err) { return done(null, res, 'number'); }
      parseAsType(parseAsString, function(err, res) { done(err, res, 'string'); });
    });

  });
}


function parseAsDate(val, done) {
  var parsed;

  if (val instanceof Date) { return done(null, val); }
  
  // If value is falsey and nonzero, interpret as undefined.
  if (!val && val!== 0) { return done(null, undefined); }

  // Attempt to parse val with given length and format.
  function tryParse(val, len, format) {
    var isValid = typeof val === 'string'
      && val.length === len 
      && d3.time.format(format).parse(val);
    return isValid ? d3.time.format(format).parse(val) : false;
  }

  // TODO: add more valid date formats.
  parsed = tryParse(val, 4, '%Y')
    || tryParse(val, 7,  '%Y-%m')
    || tryParse(val, 10, '%Y-%m-%d')
    || tryParse(val, 19, '%Y-%m-%d %H:%M:%S')
    || tryParse(val, 24, '%Y-%m-%dT%H:%M:%S.%LZ')

  if (parsed) { done(null, parsed); }
  else { done(new Error('Failed to parse value as date.')); }
}


function parseAsNumber(val, done) {
  var parsed;

  if (typeof val === 'number' && isFinite(val)) { done(null, val); }

  // If value is falsey and nonzero, interpret as undefined.
  else if (!val) { done(null, undefined); }

  // Match integers including decimals.
  else if (typeof val === 'string' && /^[-+]?([0-9]*\.[0-9]+|[0-9]+)$/.test(val)) {
    done(null, parseFloat(val));
  }

  // Match integers/decimals ending in %, then divide by 100.
  else if (typeof val === 'string' && /^[-+]?([0-9]*\.[0-9]+|[0-9]+)%$/.test(val)) {
    done(null, parseFloat(val)/100);
  }

  else { done(new Error('Failed to parse value as number.')); }
}


// Convert any nonfalsey, nonzero value to string.
function parseAsString(val, done) {
  if (!val && val!== 0) { return done(null, undefined); }
  done(null, String(val));
}
