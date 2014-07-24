'use strict';
var gutil = require('gulp-util');
var through = require('through2');
var ngmin = require('ngmin');

module.exports = function (options) {
	return through.obj(function (file, enc, cb) {
		if (file.isNull()) {
			this.push(file);
			return cb();
		}

		if (file.isStream()) {
			this.emit('error', new gutil.PluginError('gulp-ngmin', 'Streaming not supported'));
			return cb();
		}

		try {
			file.contents = new Buffer(ngmin.annotate(file.contents.toString(), options));
		} catch (err) {
			this.emit('error', new gutil.PluginError('gulp-ngmin', err));
		}

		this.push(file);
		cb();
	});
};
