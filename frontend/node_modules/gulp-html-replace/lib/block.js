'use strict';

var util = require('util');
var path = require('path');

var Block = function (config, file) {
    this.inUse = false;
    this.originals = [];
    this.replacements = [];
    this.config = config;
    this.indent = '';
    this.template = null;
    this.file = file;
};

Block.prototype.compile = function () {
    this.inUse = false;

    if (!this.replacements.length) {
        return this.config.keepUnassigned ? this.originals : [];
    }

    // get the replacement strings and do replacements for extensions
    if (this.uniqueExts) {
        var basename = path.basename(this.file.path);
        var extname = path.extname(basename);
        basename = basename.slice(0, basename.lastIndexOf(extname));
        if (this.uniqueExts['%f']) {
            this.uniqueExts['%f'].value = basename;
        }
        if (this.uniqueExts['%e']) {
            this.uniqueExts['%e'].value = extname;
        }

        Object.keys(this.uniqueExts).forEach(function (key) {
            var unique = this.uniqueExts[key];
            this.template = this.template.replace(unique.regex, unique.value);
        }.bind(this));
    }

    if (this.srcIsNull) {
        return this.indent + this.template;
    }

    return this.replacements.map(function (replacement) {
        if (this.template) {
            if (Array.isArray(replacement)) {
                replacement.unshift(this.template);
                return this.indent + util.format.apply(util, replacement);
            } else {
                return this.indent + util.format(this.template, replacement);
            }
        }

        if (this.config.resolvePaths) {
            var replacementPath = path.resolve(this.file.cwd, replacement);
            replacement = path.relative(this.file.base, replacementPath);
        }

        var ext = replacement.split('.').pop().toLowerCase();

        //add build version or timestamp support
        //some file like main.js?ts=123124
        //some file like main.js?sha1=0a9d
        ext = ext.split('?')[0].toLowerCase();

        if (ext === 'js') {
            return util.format('%s<script src="%s"></script>', this.indent, replacement);
        } else if (ext === 'css') {
            return util.format('%s<link rel="stylesheet" href="%s">', this.indent, replacement);
        }
        return this.indent + replacement;
    }.bind(this));
};


Block.prototype.reset = function () {
    this.originals = [];
    this.replacements = [];
    this.template = null;
    this.uniqueExts = null;
    this.srcIsNull = false;
};

Block.prototype.setTask = function (task) {
    this.reset();
    this.inUse = true;

    if (task) {
        this.replacements = task.src;
        this.template = task.tpl;
        this.uniqueExts = task.uni;
        this.srcIsNull = task.srcIsNull;
    }
};

module.exports = Block;
