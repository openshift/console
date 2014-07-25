var exec = require('child_process').exec,
    gulp = require('gulp'),
    clean = require('gulp-clean'),
    sass = require('gulp-sass'),
    templateCache = require('gulp-angular-templatecache'),
    minifycss = require('gulp-minify-css'),
    runSequence = require('run-sequence'),
    eslint = require('gulp-eslint'),
    uglify = require('gulp-uglify'),
    ngmin = require('gulp-ngmin'),
    rename = require('gulp-rename'),
    concat = require('gulp-concat'),
    htmlReplace = require('gulp-html-replace'),
    merge = require('merge-stream');
    bowerFiles = require('main-bower-files');

var distDir = './public/dist',
    CURRENT_SHA,
    templateSrc = [
      './public/{ui,page}/**/*.html'
    ],
    jsSrc = [
      './public/*.js',
      './public/{module,page,ui}/**/*.js',
      '!./public/dist/*.js',
    ];

gulp.task('sha', function(cb) {
  exec('git rev-parse HEAD', function(err, stdout) {
    if (err) {
      console.log('Error retrieving git SHA.');
      cb(false);
      return;
    }
    CURRENT_SHA = stdout.trim();
    console.log('sha: ', CURRENT_SHA);
    cb();
  });
});

// Delete ALL generated files.
gulp.task('clean', function() {
  return gulp.src(distDir, { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('clean-package', function() {
  return gulp.src([
      distDir + '/style.css',
      distDir + '/style.min.css',
      distDir + '/app.min.js',
      distDir + '/app.js',
      distDir + '/deps.js',
      distDir + '/deps.min.js',
      distDir + '/templates.js'
    ], { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('sass', function () {
  return gulp.src('./public/style.scss')
    .pipe(sass())
    .pipe(gulp.dest('./public/dist'));
});

gulp.task('js-quality', function() {
  return gulp.src(jsSrc)
    .pipe(eslint())
    .pipe(eslint.format());
});

// Extract & compile dependency code.
gulp.task('deps', function(cb) {
  return merge(
    // NOTE: order in bower.json matters.
    // jquery must appear before angular.
    gulp.src(bowerFiles())
      .pipe(concat('deps.js'))
      .pipe(gulp.dest('./public/lib/'))
      .pipe(rename({ suffix: '.min' }))
      .pipe(uglify())
      .pipe(gulp.dest('./public/lib/')),

    // copy to dist folder too for packaging.
    gulp.src([
        'public/lib/deps.min.js'
      ])
      .pipe(gulp.dest('public/dist'))
  );
});

// Replace code blocks in html with build versions.
gulp.task('html', ['sha'], function() {
  return gulp.src('./public/index.html')
    .pipe(htmlReplace({
      'js':  '/static/build.' + CURRENT_SHA + '.min.js',
      'css': '/static/build.' + CURRENT_SHA +'.min.css'
    }))
    .pipe(gulp.dest(distDir));
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

// Compile all the js source code.
gulp.task('js-build', ['deps'], function() {
  return gulp.src(jsSrc)
    .pipe(concat('app.js'))
    .pipe(ngmin())
    .pipe(gulp.dest(distDir))
    .pipe(rename({ suffix: '.min' }))
    .pipe(uglify())
    .pipe(gulp.dest(distDir));
});

// Combine all the js into the final build file.
gulp.task('js-package', ['js-build', 'assets', 'templates', 'sha'], function() {
  // NOTE: File Order Matters.
  return gulp.src([
      distDir + '/deps.min.js',
      distDir + '/templates.js',
      distDir + '/app.min.js'
    ])
    .pipe(concat('build.' + CURRENT_SHA + '.min.js'))
    .pipe(gulp.dest(distDir));
});

// Minify app css.
gulp.task('css-build', ['sass'], function() {
  return gulp.src('public/dist/style.css')
    .pipe(minifycss())
    .pipe(rename({ suffix: '.min' }))
    .pipe(gulp.dest(distDir));
});

// Combine all the css into the final build file.
gulp.task('css-package', ['css-build', 'assets', 'sha'], function(cb) {
  return gulp.src([
      distDir + '/style.min.css'
    ])
    .pipe(concat('build.' + CURRENT_SHA + '.min.css'))
    .pipe(gulp.dest(distDir));
});

// Replace code blocks in html with build versions.
gulp.task('html', ['sha'], function() {
  return gulp.src('public/index.html')
    .pipe(htmlReplace({
      'js':  '/static/build.' + CURRENT_SHA + '.min.js',
      'css': '/static/build.' + CURRENT_SHA +'.min.css'
    }))
    .pipe(gulp.dest(distDir));
});

// Live-watch development mode.
// Auto-compiles: sass & templates.
// Auto-runs: eslint & unit tests.
gulp.task('dev', ['js-quality', 'sass', 'templates'], function() {
  gulp.watch(templateSrc, ['templates']);
  gulp.watch('./public/**/*.scss', ['sass']);
  gulp.watch(jsSrc, ['js-quality']);
});

gulp.task('default', function(cb) {
  // Run in order.
  runSequence(
    ['clean', 'js-quality'],
    ['js-package', 'css-package', 'html'],
    'clean-package',
    cb);
});
