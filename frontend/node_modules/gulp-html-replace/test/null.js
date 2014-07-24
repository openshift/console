'use strict';

var plugin = require('../lib/index');
var gutil = require('gulp-util');
var assert = require('assert');

describe('null files', function () {
    it('should be passed through', function (done) {

        var fakeFile = new gutil.File({
            contents: null
        });

        var stream = plugin();
        stream.write(fakeFile);

        stream.once('data', function (file) {
            assert(file.isNull());
            done();
        });
    });
});