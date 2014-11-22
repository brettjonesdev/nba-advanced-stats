var Handlebars = require('handlebars');
var accounting = require('accounting');
var _ = require('underscore');

var formatNumber = function(val, precision) {
    if (_.isNumber(val) ) {
        if (!_.isNumber(precision) ) {
            precision = 0;
        }
        return accounting.formatNumber(val, precision);
    }
}

Handlebars.registerHelper('formatNumber', formatNumber);
Handlebars.registerHelper('formatPercent', function(val, precision) {
    if ( val <= 1 ) {
        val = val * 100;
    }
    return formatNumber(val, precision) + '%';
});