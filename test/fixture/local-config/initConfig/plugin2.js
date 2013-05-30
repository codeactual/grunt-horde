module.exports = function() {
  'use strict';

  var orig = this.learn('plugin2.p2k2.d');
  this.demand('plugin2.p2k2.d', orig.concat('merge'));

  return {
    p2k3: {e: 5, f: 6},
    p2k4: {g: 7, h: 8}
  };
};
