'use strict';

var Parser = require('./parser');
var through = require('through2');

module.exports = function (options, userConfig) {
    var tasks = getTasks(options || {});

    var config = {
        keepUnassigned: false,
        keepBlockTags: false,
        resolvePaths: false
    };

    if (typeof userConfig === 'boolean') {
        config.keepUnassigned = userConfig;
    } else if (typeof userConfig === 'object') {
        config = extend(config, userConfig);
    }

    return through.obj(function (file, enc, callback) {
        var parser = new Parser(tasks, config, file);

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
var utilExtensions = /%f|%e/g;

function getTasks(options) {
    var tasks = {};

    Object.keys(options).forEach(function (key) {
        var item = options[key];
        var src = [];
        var tpl = null;
        var uniqueExtensions = {};
        var result;
        var srcIsNull;

        if (typeof item.src !== 'undefined') {
            srcIsNull = item.src === null;
            src = src.concat(item.src);
            tpl = item.tpl;
        } else {
            src = src.concat(item);
        }

        while (result = utilExtensions.exec(tpl)) {
            var type = result[0];
            var unique = {};

            if (uniqueExtensions[type]) {
                continue;
            }

            unique.regex = new RegExp(result[0], "g");
            unique.value = null;
            uniqueExtensions[type] = unique;
        }

        tasks[key] = {
            src: src,
            tpl: tpl,
            uni: uniqueExtensions,
            srcIsNull: srcIsNull
        };
    });

    return tasks;
}

function extend(source, dest) {
    Object.keys(dest).forEach(function (key) {
        source[key] = dest[key];
    });
    return source;
}
