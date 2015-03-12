// Determine data types and some stats.
Graphic.prototype.analyzeData = function(data, done) {

};


// A dataType will have to be determined for every attribute/component
// with length > 0 where a type has not already been set.
// Keys is an array of colnames that map to chart attributes.
function mapValidTypes(data, keys, done) {
  
  function eachRow(row, next) {
    if (!_.isArray(keys)) { keys = [keys]; }
    async.each(keys, function(key, cb) { eachKey(key, row, cb); }, next);
  }

  function eachKey(key, row, next) {
    getValidTypes(key, function(err, validTypes) { 
      row[key] = validTypes;
      next();
    });
  }

  async.each(data, eachRow, done);
}


// Returns object with parsed val for each type, undefined if unable to parse.
function getValidTypes(val, done) {
  async.parallel([
    async.apply(parseAsDate, val),
    async.apply(parseAsNumber, val),
    async.apply(parseAsString, val)
  ],

  function(err, res) {
    done(err, { datetime: res[0], number: res[1], string: res[2] }) ;
  });
}


// Return a Date object or undefined if unable to parse.
function parseAsDate(val, done) {
  if (val instanceof Date) { return done(null, val); }

  // Attempt to parse val with given length and format.
  function tryParse(val, len, format) {
    var isValid = typeof val === 'string'
      && val.length === len 
      && !!d3.time.format(format).parse(val);
    return isValid ? d3.time.format(format).parse(val) : false;
  }

  var parsed = tryParse(val, 4, '%Y')
    || tryParse(val, 7,  '%Y-%m')
    || tryParse(val, 10, '%Y-%m-%d')
    || tryParse(val, 19, '%Y-%m-%d %H:%M:%S')
    || tryParse(val, 24, '%Y-%m-%dT%H:%M:%S.%LZ')
    || undefined;

  done(null, parsed);
}


// Return Number or false if unable to parse.
function parseAsNumber(val, done) {
  var parsed;

  if (typeof val === 'number' && isFinite(val)) { done(null, val); }

  // Match integers decimals.
  else if (typeof val === 'string' && /^[-+]?([0-9]*\.[0-9]+|[0-9]+)$/.test(val)) {
    done(null, parseFloat(val));
  }

  // Match integers/decimals ending in %, then divide by 100.
  else if (typeof val === 'string' && /^[-+]?([0-9]*\.[0-9]+|[0-9]+)%$/.test(val)) {
    done(null, parseFloat(val)/100);
  }

  else { done(null, undefined); }
}


// If val is NaN, undefined, empty, or null, return undefined.
// In all other cases cast as string.
function parseAsString(val, done) {
  if (typeof val === 'string') { done(null, val); }
  else if (!val && val !== 0 && val !== false) { done(null, undefined); }
  else { done(null, String(val)); }
}