'use strict';

var util = require('util');
var Transform = require('stream').Transform;
var Block = require('./block');


function Parser(tasks, config, file) {
    Transform.call(this);

    this.tasks = tasks;
    this.config = config;
    this.file = file;
}
util.inherits(Parser, Transform);

var REGEX_BEGIN = /<!--\s*build:(\w+(-\w+)*)\s*-->/i;
var REGEX_END = /<!--\s*endbuild\s*-->/i;

Parser.prototype._transform = function (chunk, enc, done) {
    var content = chunk.toString('utf8');
    var linefeed = '\n';
    var lines = content.split(linefeed);

    if (lines.length === 1) {
        content = content.split('><').join('>' + linefeed + '<');
        lines = content.split(linefeed);
        linefeed = '';
    }

    var buffered = [];

    var block = new Block(this.config, this.file);

    lines.forEach(function (line) {
        var block_begin = line.match(REGEX_BEGIN);
        var block_end = REGEX_END.test(line);

        if (block_begin) {
            var name = block_begin[1];
            var task = this.tasks[name];

            block.setTask(task);
            block.indent = line.match(/^\s*/)[0];
            if (this.config.keepBlockTags) {
                buffered.push(line);
            }
        } else if (block_end && block.inUse) {
            buffered = buffered.concat(block.compile());
            if (this.config.keepBlockTags) {
                buffered.push(line);
            }
        } else {
            block.inUse ? block.originals.push(line) : buffered.push(line);
        }
    }.bind(this));

    this.push(buffered.join(linefeed));
    done();
};

module.exports = Parser;
