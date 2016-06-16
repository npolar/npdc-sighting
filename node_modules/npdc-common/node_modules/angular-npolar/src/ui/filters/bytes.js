'use strict';

module.exports = () => {
  'ngInject';

  // From https://gist.github.com/thomseddon/3511330
  return function(bytes, precision = 1) {

    if (isNaN(parseFloat(bytes)) || !isFinite(bytes)) {
      return '';
    }
    let units = ['bytes', 'Kb', 'Mb', 'Gb', 'Tb', 'Pb'];
    let number = Math.floor(Math.log(bytes) / Math.log(1024));

    return (bytes / Math.pow(1024, Math.floor(number))).toFixed(precision) + ' ' + units[number];
  };

};
