
// Export global
// ----------------------------------------------------
// Export as a Node module if applicable. Else
// attach ggd3 to the global object.

if (isNode) { module.exports = ggd3; }
else { this.ggd3 = ggd3; }