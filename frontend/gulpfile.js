'use strict';

const exec = require('child_process').exec;
const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');
const templateCache = require('gulp-angular-templatecache');
const runSequence = require('run-sequence');
const eslint = require('gulp-eslint');
const uglify = require('gulp-uglify');
const ngAnnotate = require('gulp-ng-annotate');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const htmlReplace = require('gulp-html-replace');
const bowerFiles = require('main-bower-files');
const karma = require('karma').server;
const browserify = require('browserify');
const babelify = require('babelify');
const source = require('vinyl-source-stream');
const streamify = require('gulp-streamify');
const PrettyError = require('pretty-error');

const distDir = './public/dist';
const templateSrc = [
  './public/{module,page}/**/*.html',
  './public/lib/mochi/img/tectonic-logo.svg',
];

const lintableSrc = [
  './public/*.js',
  './public/{module,page}/**/*.js',
  '!./public/dist/*.js',
];

const jsSrc = [
  './public/*.js',
  './public/{module,page}/**/*.js',
  '!./public/{module,page}/**/*_test.js',
  '!./public/dist/*.js',
];

let CURRENT_SHA;

function jsBuild (debug) {
  return browserify(['./public/_app.js'], {debug, transform: [babelify]})
    .bundle()
    .on('error', function(err) {
      // eslint-disable-next-line no-console
      console.log(new PrettyError().render(err));

      if (!debug) {
        process.exit(1);
        return;
      }

      this.emit('end');
    })
    // .pipe(rename({ suffix: '.min' }))
    .pipe(source('app-bundle.js'))
    .pipe(ngAnnotate())
}

// Compile all the js source code.
gulp.task('js-build', function() {
  return jsBuild(false)
    .pipe(streamify(uglify()))
    .pipe(gulp.dest(distDir))
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(distDir));
});


gulp.task('browserify', () => {
  return jsBuild(true)
  .pipe(gulp.dest(distDir));
});

gulp.task('sha', function(cb) {
  exec('git rev-parse HEAD', function(err, stdout) {
    if (err) {
      // eslint-disable-next-line no-console
      console.log('Error retrieving git SHA.');
      cb(false);
      return;
    }
    CURRENT_SHA = stdout.trim();
    // eslint-disable-next-line no-console
    console.log('sha: ', CURRENT_SHA);
    cb();
  });
});

// Delete ALL generated files.
gulp.task('clean', function() {
  return del(distDir);
});

gulp.task('clean-package', function() {
  return del([
    distDir + '/style.css',
    distDir + '/app.min.js',
    distDir + '/app.js',
    distDir + '/templates.js'
  ]);
});

gulp.task('sass', function () {
  return gulp.src('./public/style.scss')
    .pipe(sass({
      includePaths: ['./public/lib/coreos-web/sass']
    }))
    .pipe(gulp.dest('./public/dist'));
});

gulp.task('lint', function() {
  return gulp.src(lintableSrc)
    .pipe(eslint({ useEslintrc: true }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

// Extract & compile dependency code.
gulp.task('deps', function() {
  return gulp.src(bowerFiles({filter: /.*\.js/}))
    .pipe(concat('deps.js'))
    .pipe(gulp.dest('./public/lib/'))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest('./public/lib/'))
    .pipe(gulp.dest('./public/dist/'))
});

// Precompile html templates.
gulp.task('templates', function() {
  return gulp.src(templateSrc)
    .pipe(templateCache({ standalone: true, root: '/static/' }))
    .pipe(gulp.dest(distDir));
});

// Copy any static assets.
gulp.task('assets', function() {
  // images
  gulp.src([ 'public/img/**/*' ])
    .pipe(gulp.dest('public/dist/img'));
});

// Copy all deps to dist folder for packaging.
gulp.task('copy-deps', function() {
  return gulp.src('./public/lib/**/*')
    .pipe(gulp.dest(distDir + '/lib'));
});

// Combine all the js into the final build file.
gulp.task('js-package', ['js-build', 'assets', 'templates', 'copy-deps', 'sha'], function () {
  // NOTE: File Order Matters.
  return gulp.src([
    distDir + '/templates.js',
    distDir + '/app-bundle.min.js'
  ])
  .pipe(concat('build.' + CURRENT_SHA + '.min.js'))
  .pipe(gulp.dest(distDir));
});

// Minify app css.
gulp.task('css-build', ['sass'], function () {
  const src = bowerFiles({filter: /.*\.css/});
  src.push('public/dist/style.css');
  return gulp.src(src)
    .pipe(concat('public/dist/deps.css'))
    .pipe(rename('app-bundle.css'))
    .pipe(gulp.dest(distDir));
});

gulp.task('css-sha', ['css-build', 'sha'], function () {
  return gulp.src(distDir + '/app-bundle.css')
    .pipe(rename('build.' + CURRENT_SHA + '.css'))
    .pipe(gulp.dest(distDir));
});

// Replace code blocks in html with build versions.
gulp.task('html', ['sha'], function() {
  return gulp.src('./public/index.html')
    .pipe(htmlReplace({
      'js':  '/static/build.' + CURRENT_SHA + '.min.js',
      'css': '/static/build.' + CURRENT_SHA +'.css',
      // TODO: use file hash
      'js-deps':  '/static/lib/deps.min.js',
      // TODO: use versions in filenames
      'css-coreos-web':  '/static/lib/coreos-web/coreos.css'
    }))
    .pipe(gulp.dest(distDir));
});

// Live-watch development mode.
// Auto-compiles: sass & templates.
// Auto-runs: eslint & unit tests.
gulp.task('dev', ['css-build', 'templates', 'browserify'], function() {
  gulp.watch(templateSrc, ['templates']);
  gulp.watch(jsSrc, ['browserify']);
  gulp.watch('./public/{.,page,style,module}/**/*.scss', ['sass']);
});

/**
 * Karma test
 */
gulp.task('test', ['lint', 'templates', 'browserify'], function (cb) {
  karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, cb);
});

gulp.task('default', function(cb) {
  // Run in order.
  runSequence(
    ['clean', 'lint'],
    ['js-package', 'css-sha', 'html'],
    'clean-package',
    cb);
});
