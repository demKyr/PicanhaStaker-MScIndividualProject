function truncateDecimals(number, decimalPlaces) {
    const multiplier = Math.pow(10, decimalPlaces);
    return Math.trunc(number * multiplier) / multiplier;
  }
  
  module.exports = {
    truncateDecimals
  };