var gutil 	= require("gulp-util");
var log 	= gutil.log;
var color 	= gutil.colors;
var colors 	= [color.red, color.blue, color.magenta, color.gray, color.yellow, color.green]

module.exports = logger = function() {
	var args = Array.prototype.slice.call(arguments);

	args = args.map(function(arg, i) {
		return colors[i](arg);
	});

	log.apply(log, args);
}