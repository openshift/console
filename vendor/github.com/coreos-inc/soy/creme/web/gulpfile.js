var gulp = require('gulp'),
    del = require('del'),
    clean = require('gulp-clean'),
    sass = require('gulp-sass'),
    eslint = require('gulp-eslint'),
    karma = require('karma').server,
    ngHtml2js = require('gulp-ng-html2js'),
    bowerFiles = require('main-bower-files'),
    preen = require('preen'),
    inject = require('gulp-inject'),
    concat = require('gulp-concat'),
    angularFilesort = require('gulp-angular-filesort'),
    uglify = require('gulp-uglify'),
    rename = require('gulp-rename'),
    ngAnnotate = require('gulp-ng-annotate'),
    hash = require('gulp-hash-filename'),
    replace = require('gulp-replace'),
    htmlReplace = require('gulp-html-replace'),

    runSequence = require('run-sequence'),
    fs = require('fs'),
    exec = require('child_process').exec,
    merge = require('merge-stream');

var CDN_URL = 'https://cdn.tectonic.com/account.tectonic.com/';
var MOCHI_CDN_URL = 'https://cdn.tectonic.com/account.tectonic.com/lib/mochi/';
var jsSrc = [
      'public/*.js',
      'public/{module,page}/**/*.js',
    ],
    templateSrc = [
      'public/page/**/*.html',
      'public/module/ui/**/*.html',
    ],
    scssSrc = [
      'public/*.scss',
      'public/{page,style}/**/*.scss',
      'public/module/ui/**/*.scss',
    ];

function depsSrc() {
  var src = bowerFiles();
  src.push('public/lib/mochi/mochi.tpl.js');
  src.push('public/lib/mochi/mochi.js');
  return src;
}

gulp.task('sass', function() {
  return gulp.src([
      'public/style.scss'
    ])
    .pipe(sass({
      includePaths: ['public/style'],
      outputStyle: 'expanded'
    }))
    .pipe(gulp.dest('public/dist'));
});

gulp.task('templates', function() {
  return gulp.src(templateSrc, { base: 'public' })
    .pipe(ngHtml2js({
      moduleName: 'creme.ui.templates',
      declareModule: false,
      prefix: '/static/',
    }))
    .pipe(concat('templates.js'))
    .pipe(gulp.dest('public/dist/'));
});

gulp.task('test', ['test-conf'], function(cb) {
  return karma.start({
    configFile: __dirname + '/karma.conf.js',
    singleRun: true
  }, cb);
});

gulp.task('test-conf', function() {
  return gulp.src('karma.conf.js')
    .pipe(inject(gulp.src(bowerFiles({includeDev: true}), {read: false}), {
      relative: true,
      starttag: 'var deps = [',
      endtag: '];',
      transform: function(filepath, file, i, length) {
        return '\'' + filepath + '\',';
      }
    }))
    .pipe(gulp.dest('./'));
});

gulp.task('prune-deps', function(cb) {
  preen.preen({}, cb);
});

gulp.task('lint', function() {
  return gulp.src(jsSrc)
    .pipe(eslint({ useEslintrc: true }))
    .pipe(eslint.format())
    .pipe(eslint.failAfterError());
});

gulp.task('index', function() {
  return gulp.src('public/index.html')
    .pipe(inject(
        gulp.src(depsSrc(), { read: false }),
        { name: 'deps', relative: true, addPrefix: '/static' }))
    .pipe(inject(
        gulp.src([
        'public/lib/mochi/mochi.css',
        'public/dist/*.css',
        ], { read: false }),
        { name: 'style', relative: true, addPrefix: '/static' }))
    .pipe(inject(
      gulp.src(jsSrc.concat([
          '!public/**/*_test.js',
        ]), { read: true })
        .pipe(angularFilesort()),
        { name: 'app', relative: true, addPrefix: '/static' }))
    .pipe(gulp.dest('public/'));
});

gulp.task('dist:compile', function() {
  return gulp.src(jsSrc.concat([
      'public/dist/*.js',
      '!public/**/*_test.js',
    ]), { read: true })
    .pipe(angularFilesort())
    .pipe(concat('app.js'))
    .pipe(replace('/static/lib/mochi/', MOCHI_CDN_URL))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(hash())
    .pipe(gulp.dest('public/dist/'));
});

gulp.task('dist:deps', function() {
  return gulp.src(depsSrc())
    .pipe(concat('deps.js'))
    .pipe(uglify())
    .pipe(hash())
    .pipe(gulp.dest('public/dist/'));
});

gulp.task('dist:index', function() {
  return gulp.src('public/index.html')
    .pipe(inject(
        gulp.src('public/dist/deps-*.js', { read: false }),
        { name: 'deps', ignorePath: 'public/dist', addPrefix: '/static' }))
    .pipe(inject(
        gulp.src('public/dist/app-*.js', { read: false }),
        { name: 'app', ignorePath: 'public/dist', addPrefix: '/static' }))
    .pipe(inject(
        gulp.src('public/dist/style-*.css', { read: false }),
        { name: 'style', ignorePath: 'public/dist', addPrefix: '/static' }))
    .pipe(replace('/static/lib/mochi/', MOCHI_CDN_URL))
    .pipe(replace('/static/', CDN_URL))
    .pipe(gulp.dest('public/dist/'));
});

gulp.task('dist:clean', function() {
  return gulp.src([
      'public/dist/templates.js',
      'public/dist/style.css',
    ], { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('clean', function() {
  return gulp.src('public/dist', { read: false })
    .pipe(clean({ force: true }));
});

gulp.task('dist:copy', function() {
  return gulp.src([
      'public/lib/**/*',
    ], { base: 'public' })
    .pipe(gulp.dest('public/dist/'));
});

gulp.task('dist:sass', ['sass'], function() {
  return gulp.src([
      'public/lib/mochi/mochi.css',
      'public/dist/style.css',
    ])
    .pipe(concat('style.css'))
    .pipe(replace('/static/lib/mochi/', MOCHI_CDN_URL))
    .pipe(replace('url(\'fonts/', 'url(\'' + MOCHI_CDN_URL + 'fonts/'))
    .pipe(hash())
    .pipe(gulp.dest('public/dist'));
});

gulp.task('dist', function(cb) {
  runSequence(
    ['clean'],
    ['dist:copy'],
    ['dist:sass', 'lint', 'templates'],
    ['dist:compile', 'dist:deps'],
    ['dist:index'],
    ['dist:clean'],
    cb);
});

gulp.task('dev', ['clean'], function() {
  runSequence(
    ['templates', 'sass', 'lint'],
    ['index']);
  gulp.watch(templateSrc, ['templates']);
  gulp.watch(scssSrc, ['sass']);
  gulp.watch(jsSrc, ['lint']);
});

gulp.task('default', ['dist']);
