'use strict';

var plugin = require('../lib/index');
var fs = require('fs');
var path = require('path');
var gutil = require('gulp-util');
var assert = require('assert');

function compare(fixture, expected, stream, done) {
    var fakeFile = new gutil.File({
        contents: fixture
    });

    fakeFile.base = path.join(fakeFile.cwd, 'pages');
    fakeFile.path = path.join(fakeFile.cwd, path.join('pages', 'index.html'));

    stream.write(fakeFile);

    stream.once('data', function (file) {
        assert(file.isBuffer());
        assert.equal(String(file.contents), String(expected));
        done();
    });
}

describe('Buffer mode', function () {
    it('should replace blocks', function (done) {
        var fixture = fs.readFileSync(path.join('test', 'fixture.html'));
        var expected = fs.readFileSync(path.join('test', 'expected.html'));

        var stream = plugin({
            css: 'css/combined.css',
            js_files: ['js/one.js', 'js/two.js?ts=123'],
            js_files_tpl: {
                src: 'js/with_tpl.js',
                tpl: '<script src="%s"></script>'
            },
            js_files_tpl_multiple: {
                src: ['js/with_tpl.js', 'js/with_tpl_2.js'],
                tpl: '<script src="%s"></script>'
            },
            js_files_tpl_2vars: {
                src: [['js/with_tpl_2vars1.js', 'js/with_tpl_2vars2.js']],
                tpl: '<script data-main="%s" src="%s"></script>'
            },
            js_files_tpl_2vars_multiple: {
                src: [['js/with_tpl_2vars1.js', 'js/with_tpl_2vars2.js'], ['js/with_tpl_2vars1_2.js', 'js/with_tpl_2vars2_2.js']],
                tpl: '<script data-main="%s" src="%s"></script>'
            },
            js_files_x_tpl: {
                src: null,
                tpl: '<script src="js/%f.min.js"></script>'
            },
            js_files_x_tpl_src: {
                src: 'js',
                tpl: '<script src="%s/%f.min.js"></script>'
            },
            js_files_x_tpl_multiple: {
                src: ['js/with_tpl.js', 'js/with_tpl_2.js'],
                tpl: '<script data-src="%f.data" src="%s"></script>'
            },
            js_files_x_tpl_2vars: {
                src: [['js/with_tpl_2vars1.js', 'js/with_tpl_2vars2.js']],
                tpl: '<script data-src="%f%e" data-main="%s" src="%s"></script>'
            },
            js_files_x_tpl_2vars_multiple: {
                src: [['js/with_tpl_2vars1.js', 'js/with_tpl_2vars2.js'], ['js/with_tpl_2vars1_2.js', 'js/with_tpl_2vars2_2.js']],
                tpl: '<script data-src="%f.data" data-main="%s" src="%s"></script>'
            },
            'lorem-ipsum': 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.'
        });

        compare(fixture, expected, stream, done);
    });

    it('should work with inline html', function (done) {
        var fixture = '<!DOCTYPE html><head><!-- build:css --><link rel="stylesheet" href="_index.prefix.css"><!-- endbuild --></head>';
        var expected = '<!DOCTYPE html><head><link rel="stylesheet" href="css/combined.css"></head>';

        var stream = plugin({css: 'css/combined.css'});
        compare(new Buffer(fixture), new Buffer(expected), stream, done);
    });

    describe('Options', function () {

        describe('keepUnassigned', function () {
            it('Should keep empty blocks', function (done) {
                var fixture = '<html>\n<!-- build:js -->\nSome text\n<!-- endbuild -->\n</html>';
                var expected = '<html>\nSome text\n</html>';

                var stream = plugin({}, {keepUnassigned: true});
                compare(new Buffer(fixture), new Buffer(expected), stream, done);
            });

            it('Should remove empty blocks', function (done) {
                var fixture = '<html>\n<!-- build:js -->\nSome text\n<!-- endbuild -->\n</html>';
                var expected = '<html>\n</html>';

                var stream = plugin();
                compare(new Buffer(fixture), new Buffer(expected), stream, done);
            });
        });

        describe('keepBlockTags', function () {
            it('Should keep placeholder tags', function (done) {
                var fixture = '<html>\n<!-- build:js -->\nSome text\n<!-- endbuild -->\n</html>';
                var expected = '<html>\n<!-- build:js -->\n<!-- endbuild -->\n</html>';

                var stream = plugin({}, {keepBlockTags: true});
                compare(new Buffer(fixture), new Buffer(expected), stream, done);
            });

            it('Should remove placeholder tags', function (done) {
                var fixture = '<html>\n<!-- build:js -->\nSome text\n<!-- endbuild -->\n</html>';
                var expected = '<html>\n</html>';

                var stream = plugin();
                compare(new Buffer(fixture), new Buffer(expected), stream, done);
            });
        });

        describe('resolvePaths', function () {
            it('Should resolve relative paths', function (done) {
                var fixture = '<html>\n<!-- build:js -->\n<script src="file.js"></script>\n<!-- endbuild -->\n</html>';
                var expected = '<html>\n<script src="' + path.join('..', 'lib', 'script.js') + '"></script>\n</html>';

                var stream = plugin({js: 'lib/script.js'}, {resolvePaths: true});
                compare(new Buffer(fixture), new Buffer(expected), stream, done);
            });
        });
    });

    describe('Line endings', function () {
        it('should work with LF line endings', function (done) {
            var fixture = fs.readFileSync(path.join('test', 'line_endings', 'lf.html'));
            var expected = fs.readFileSync(path.join('test', 'line_endings', 'expected_lf.html'));

            var stream = plugin({
                'js-legacy-min': 'js-legacy-min.js',
                'js-angular-min': 'js-angular-min.js'
            });
            compare(fixture, expected, stream, done);
        });

        it('should work with mixed line endings', function (done) {
            var fixture = fs.readFileSync(path.join('test', 'line_endings', 'mixed.html'));
            var expected = fs.readFileSync(path.join('test', 'line_endings', 'expected_mixed.html'));

            var stream = plugin({
                'main': 'mixed.js'
            });
            compare(fixture, expected, stream, done);
        });
    });

    describe('Legacy versions', function () {
        it('[version <1.2] should keep empty blocks (keepUnassigned = true)', function (done) {
            var fixture = '<html>\n<!-- build:js -->\nThis should be removed if "keepUnassigned" is false\n<!-- endbuild -->\n</html>';
            var expected = '<html>\nThis should be removed if "keepUnassigned" is false\n</html>';

            var stream = plugin({}, true);
            compare(new Buffer(fixture), new Buffer(expected), stream, done);
        });

        it('[version <1.2] should remove empty blocks (keepUnassigned = false)', function (done) {
            var fixture = '<html>\n<!-- build:js -->\nThis should be removed if "keepUnassigned" is false\n<!-- endbuild -->\n</html>';
            var expected = '<html>\n</html>';

            var stream = plugin();
            compare(new Buffer(fixture), new Buffer(expected), stream, done);
        });
    });

});
