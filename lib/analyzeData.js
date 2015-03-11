// Determine data types and some stats.
Graphic.prototype.analyzeData = function() {

};


// A dataType will have to be determined for every attribute/component
// with length > 0 where a type has not already been set.
function determineDataType() {}



function parseAsDate(input) {
  var dateParsers = [
    function(input) { return input instanceof Date ? input : false; },
    function(input) { return typeof input == 'string' && input.length == 4  ? d3.time.format('%Y').parse(input) : false },
    function(input) { return typeof input == 'string' && input.length == 7  ? d3.time.format('%Y-%m').parse(input) : false },
    function(input) { return typeof input == 'string' && input.length == 10 ? d3.time.format('%Y-%m-%d').parse(input) : false },
    function(input) { return typeof input == 'string' && input.length == 19 ? d3.time.format('%Y-%m-%d %H:%M:%S').parse(input) : false },
    function(input) { return typeof input == 'string' && input.length == 24 ? d3.time.format('%Y-%m-%dT%H:%M:%S.%LZ').parse(input) : false }
  ]
  var parser = _.find(dateParsers, function(parser) { return parser(input) });
  return parser ? parser(input) : false;
},

// Return integer/float or false if parsing fails. Used by parseFormat function.
// Philosophical question: should null/undefined values be treated specially or as zeros?
// TODO: Parse strings with % sign to decimal.
function parseAsNumber(input) {
  var dateParsers = [
    function(input) { return typeof input === 'number' && !isNaN(input) ? input : false; },
    function(input) { return /^[-+]?([0-9]*\.[0-9]+|[0-9]+)$/.test(input) ? Number(input) : false; }
  ]
  var parser = _.find(dateParsers, function(parser) { return parser(input) || parser(input) === 0; });
  return parser ? parser(input) : false;
},

// Always returns a string.
function parseAsString(input) {
  return typeof input === 'string' ? input : String(input);
}