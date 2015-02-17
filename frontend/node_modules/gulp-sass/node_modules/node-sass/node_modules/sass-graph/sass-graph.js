'use strict';

var fs = require('fs');
var path = require('path');
var _ = require('lodash');
var glob = require('glob');
var parseImports = require('./parse-imports');

// resolve a sass module to a path
function resolveSassPath(sassPath, loadPaths) {
  // trim any file extensions
  var sassPathName = sassPath.replace(/\.\w+$/, '');
  // check all load paths
  var i, length = loadPaths.length;
  for(i = 0; i < length; i++) {
    var scssPath = path.normalize(loadPaths[i] + "/" + sassPathName + ".scss");
    if (fs.existsSync(scssPath)) {
      return scssPath;
    }
    // special case for _partials
    var partialPath = path.join(path.dirname(scssPath), "_" + path.basename(scssPath));
    if (fs.existsSync(partialPath)) {
      return partialPath
    }
  }
  var errMsg = "File to import not found or unreadable: " + sassPath;
  throw errMsg;
}

function Graph(loadPaths, dir) {
  this.dir = dir;
  this.loadPaths = loadPaths;
  this.index = {};

  if(dir) {
    var graph = this;
    _(glob.sync(dir+"/**/*.scss", {})).forEach(function(file) {
      graph.addFile(path.resolve(file));
    });
  }
}

// add a sass file to the graph
Graph.prototype.addFile = function(filepath, parent) {
  var entry = this.index[filepath] = this.index[filepath] || {
    imports: [],
    importedBy: [],
    modified: fs.statSync(filepath).mtime
  };

  var resolvedParent;
  var imports = parseImports(fs.readFileSync(filepath, 'utf-8'));
  var cwd = path.dirname(filepath);

  var i, length = imports.length;
  for (i = 0; i < length; i++) {
    [this.dir, cwd].forEach(function (path) {
      if (path && this.loadPaths.indexOf(path) === -1) {
        this.loadPaths.push(path);
      }
    }.bind(this));
    var resolved = resolveSassPath(imports[i], _.uniq(this.loadPaths));
    if (!resolved) return false;

    // recurse into dependencies if not already enumerated
    if(!_.contains(entry.imports, resolved)) {
      entry.imports.push(resolved);
      this.addFile(fs.realpathSync(resolved), filepath);
    }
  }

  // add link back to parent
  if(parent) {
    resolvedParent = _.find(this.loadPaths, function(path) {
      return parent.indexOf(path) !== -1;
    });

    if (resolvedParent) {
      resolvedParent = parent.substr(parent.indexOf(resolvedParent));//.replace(/^\/*/, '');
    } else {
      resolvedParent = parent;
    }

    entry.importedBy.push(resolvedParent);
  }
};

// visits all files that are ancestors of the provided file
Graph.prototype.visitAncestors = function(filepath, callback) {
  this.visit(filepath, callback, function(err, node) {
    if (err || !node) return [];
    return node.importedBy;
  });
};

// visits all files that are descendents of the provided file
Graph.prototype.visitDescendents = function(filepath, callback) {
  this.visit(filepath, callback, function(err, node) {
    if (err || !node) return [];
    return node.imports;
  });
};

// a generic visitor that uses an edgeCallback to find the edges to traverse for a node
Graph.prototype.visit = function(filepath, callback, edgeCallback, visited) {
  filepath = fs.realpathSync(filepath);
  var visited = visited || [];
  if(!this.index.hasOwnProperty(filepath)) {
    edgeCallback("Graph doesn't contain " + filepath, null);
  }
  var edges = edgeCallback(null, this.index[filepath]);

  var i, length = edges.length;
  for (i = 0; i < length; i++) {
    if(!_.contains(visited, edges[i])) {
      visited.push(edges[i]);
      callback(edges[i], this.index[edges[i]]);
      this.visit(edges[i], callback, edgeCallback, visited);
    }
  }
};

function processOptions(options) {
  options = options || {};
  if(!options.hasOwnProperty('loadPaths')) options['loadPaths'] = [];
  return options;
}

module.exports.parseFile = function(filepath, options) {
  var filepath = path.resolve(filepath);
  var options = processOptions(options);
  var graph = new Graph(options.loadPaths);
  graph.addFile(filepath);
  return graph;
};

module.exports.parseDir = function(dirpath, options) {
  var dirpath = path.resolve(dirpath);
  var options = processOptions(options);
  var graph = new Graph(options.loadPaths, dirpath);
  return graph;
};
