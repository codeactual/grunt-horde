module.exports = function(grunt) {
  return {debug: {grunt: grunt, context: Object.keys(this)}};
};
