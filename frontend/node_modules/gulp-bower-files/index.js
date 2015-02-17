var fs                 = require("fs");
var path               = require("path");
var gulp               = require("gulp");
var gutil              = require("gulp-util");
var PluginError        = gutil.PluginError
var PackageCollection  = require("./lib/package_collection");
var logger             = require("./lib/logger");

const PLUGIN_NAME = "gulp-bower-files";

module.exports = function(opts){
    logger('[gulp-bower-files]', 'DEPRECATED', '', 'Please use main-bower-files (http://npmjs.org/package/main-bower-files)');

    opts = opts || {};

    var defaults = {
        paths: {
            bowerJson     : "./bower.json",
            bowerrc       : "./.bowerrc",
            bowerDirectory: "./bower_components"
        }
    }

    if(!opts.paths)
        opts.paths = {}

    if(typeof opts.paths === 'string'){
        opts.paths.bowerJson        = path.join(opts.paths, defaults.paths.bowerJson)
        opts.paths.bowerrc          = path.join(opts.paths, defaults.paths.bowerrc)
        opts.paths.bowerDirectory   = path.join(opts.paths, defaults.paths.bowerDirectory)
    }

    opts.paths.bowerJson        = opts.paths.bowerJson      || defaults.paths.bowerJson;
    opts.paths.bowerrc          = opts.paths.bowerrc        || defaults.paths.bowerrc;
    opts.paths.bowerDirectory   = opts.paths.bowerDirectory || defaults.paths.bowerDirectory;

    if(fs.existsSync(opts.paths.bowerrc)){
        opts.paths.bowerDirectory = path.dirname(opts.paths.bowerrc);
        opts.paths.bowerDirectory = path.join(opts.paths.bowerDirectory, "/", (JSON.parse(fs.readFileSync(opts.paths.bowerrc))).directory);
    }

    if(!opts.paths.bowerJson || !fs.existsSync(opts.paths.bowerJson)){
        throw new PluginError(PLUGIN_NAME, "bower.json file does not exist at " + opts.paths.bowerJson);
    }

    if(!opts.paths.bowerDirectory || !fs.existsSync(opts.paths.bowerDirectory)){
        throw new PluginError(PLUGIN_NAME, "Bower components directory does not exist at " + opts.paths.bowerDirectory);
    }

    if(!opts.base)
        opts.base = opts.paths.bowerDirectory;

    if(!opts.includeDev)
        opts.includeDev = false;

    try {
        var collection = new PackageCollection(opts);
        collection.collectPackages();
        var files = collection.getFiles();
    } catch(e) {
        throw e;
        throw new PluginError(PLUGIN_NAME, e.message);
    }

    if(!files || !files.length) {
        // @TODO: find a better way to return a stream without files
        logger("[gulp-bower-files]\t", "no files selected");
        return gulp.src(__dirname + '/file_that_does_not_exists');
    }

    return gulp.src(files, opts);
}
