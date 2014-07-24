'use strict';

var Parser = require('./parser');
var through = require('through2');

module.exports = function (options, keepUnassigned) {
    var tasks = getTasks(options || {});

    return through.obj(function (file, enc, callback) {
        var parser = new Parser(tasks, !!keepUnassigned);

        if (file.isBuffer()) {
            parser.write(file.contents);
            parser.end();

            var contents = new Buffer(0);
            parser.on('data', function (data) {
                contents = Buffer.concat([contents, data]);
            });
            parser.once('end', function () {
                file.contents = contents;

                this.push(file);
                return callback();
            }.bind(this));
        } else {
            if (file.isStream()) {
                file.contents = file.contents.pipe(parser);
            }

            this.push(file);
            return callback();
        }
    });

};

/**
 * tasks = {
 *     'task-name': {
 *         'src': [file1, file2],
 *         'tpl': '<script src="%s"></script>'
 *     },
 *     ....
 * }
 */
function getTasks(options) {
    var tasks = {};

    Object.keys(options).forEach(function (key) {
        var item = options[key];
        var src = [];
        var tpl = null;

        if (item.src) {
            src = src.concat(item.src);
            tpl = item.tpl || null;
        } else {
            src = src.concat(item);
        }

        tasks[key] = {
            src: src,
            tpl: tpl
        };
    });

    return tasks;
}
