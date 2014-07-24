'use strict';

var util = require('util');

var Block = function () {
    this.inUse = false;
    this.originals = [];
    this.replacements = [];
    this.keepUnassigned = false;
    this.indent = '';
    this.template = null;
};

Block.prototype.compile = function () {
    this.inUse = false;

    if (!this.replacements.length) {
        return this.keepUnassigned ? this.originals : [];
    }

    return this.replacements.map(function (replacement) {
        if (this.template) {
            return this.indent + util.format(this.template, replacement);
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

Block.prototype.reset = function(){
    this.originals = [];
    this.replacements = [];
    this.template = null;
};

Block.prototype.setTask = function(task) {
    this.reset();
    this.inUse = true;

    if(task) {
        this.replacements = task.src;
        this.template = task.tpl;
    }
};

module.exports = Block;
