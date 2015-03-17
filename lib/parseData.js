// Determine data types and some stats. 
// TODO: add parseAsBool
Graphic.prototype.parseData = function(data, spec, done) {
  var parsedData = [];
  var parsedCols = {};

  var mappings = [
    { name: 'x', type: spec.xType }
  , { name: 'y', type: spec.yType }
  ];

  function parseAsType(colName, parseFunc, next) {
    async.map(data, function(row, cb) { parseFunc(row[colName], cb); }, next)
  }

  async.eachSeries(mappings, function(mapping, next) {
    var colName = spec[mapping];

    // First check that column has not already been mapped.
    if (parsedCols[colName]) { return next(); }

    // Then check whether the type has been set explicitly.
    if (mapping.type === 'date') { return parseAsType(colName, parseAsDate, next); }
    if (mapping.type === 'number') { return parseAsType(colName, parseAsNumber, next); }
    if (mapping.type === 'string') { return parseAsType(colName, parseAsString, next); }

    
  });
};


function parseColumn(data, colName, done) {

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
