'use strict';
/* global process:false, __dirname:false */
/* eslint-disable no-console */
/* eslint prefer-template:0 */

const exec = require('child_process').exec;

const del = require('del');
const gulp = require('gulp');
const sass = require('gulp-sass');
const runSequence = require('run-sequence');
const uglify = require('gulp-uglify');
const rename = require('gulp-rename');
const concat = require('gulp-concat');
const htmlReplace = require('gulp-html-replace');
const jest = require('jest-cli');
const browserify = require('browserify');
const watchify = require('watchify');
const source = require('vinyl-source-stream');
const streamify = require('gulp-streamify');
const PrettyError = require('pretty-error');

const entry = './public/components/app.jsx';
const distDir = './public/dist';
const indexSrc = './public/index.html';
const tokenSrc = './public/tokener.html';

let CURRENT_SHA;

if (!process.env.NODE_ENV) {
  // Default to production builds if not specified.
  process.env.NODE_ENV = 'production';
}

// Development tasks such as `gulp dev`
// should always run in the development environment
gulp.task('set-development', () => {
  process.env.NODE_ENV = 'development';
});

// Test tasks such as `yarn test`
// should always run in the test environment
gulp.task('set-test', () => {
  process.env.NODE_ENV = 'test';
});

/**
 * Build JavaScript
 */

function isExternalModule (file) {
  // lifted from browserify!!!
  const regexp = process.platform === 'win32' ?
    /^(\.|\w:)/ :
    /^[/.]/;
  return !regexp.test(file);
}

const externals = [];
function jsBuild () {
  const debug = process.env.NODE_ENV === 'development';
  const opts = {
    debug,
    cache: {},
    packageCache: {},
    exclude: [
      './public/dist/*.js',
    ],
    entries: [entry],
    filter: (file) => {
      const isExternal = isExternalModule(file);
      isExternal && externals.push(file);
      return !isExternal;
    },
    extensions: ['.js', '.jsx'],
  };
  if (debug) {
    opts.plugin = [watchify];
    opts.delay = 200;
  }
  return browserify(opts).transform('babelify', {presets: ['es2015', 'react']});
}

// Compile all the js source code.
gulp.task('js-bundle', () => {
  let firstBuild = true;
  const build = jsBuild();

  const bundler = () => {
    return build.bundle()
      .on('error', (err) => {
        if (firstBuild) {
          throw err;
        }
        console.log(new PrettyError().render(err));
        build.emit('end');
      })
      .pipe(source('app-bundle.js'));
  };

  if (process.env.NODE_ENV === 'production') {
    return bundler()
      .pipe(streamify(uglify()))
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest(distDir));
  }

  const devBundler = () => {
    return bundler()
      .pipe(gulp.dest(distDir));
  };

  build.on('update', () => {
    firstBuild = false;
    console.log('Updating app-bundle.js...');
    return devBundler().on('end', () => console.log('Updated app-bundle.js'));
  });

  return devBundler();
});

gulp.task('js-deps', ['js-bundle'], () => {
  // HACK: we rely on the externals being created by js-build (jsBuild)
  const build = () => browserify()
    .require(externals)
    .bundle()
    .pipe(source('deps.js'));

  if (process.env.NODE_ENV === 'production') {
    return build()
      .pipe(streamify(uglify()))
      .pipe(rename({ suffix: '.min' }))
      .pipe(gulp.dest(distDir));
  }

  return build().pipe(gulp.dest(distDir));
});

gulp.task('js-build', ['js-bundle', 'js-deps']);

/**
 * Build CSS
 */

// Build app css
gulp.task('sass', () => {
  return gulp.src('./public/style.scss')
    .pipe(process.env.NODE_ENV === 'production' ? sass({outputStyle: 'compressed'}) : sass().on('error', sass.logError))
    .pipe(gulp.dest('./public/dist'));
});

// Rename style.css to app-bundle.css
gulp.task('css-build', ['sass'], () => {
  return gulp.src(['public/dist/style.css'])
    .pipe(rename('app-bundle.css'))
    .pipe(gulp.dest(distDir));
});

gulp.task('lint', cb => {
  exec('yarn run lint', (err, stdout) => {
    err && console.log(new PrettyError().render(err));
    console.log(stdout);
    cb(err, stdout);
  });
});


gulp.task('fonts', () => {
  return gulp.src([
    'node_modules/font-awesome/fonts/*',
    'public/fonts/*'
  ]).pipe(gulp.dest(distDir + '/fonts'));
});

// Copy any static assets.
gulp.task('assets', ['fonts'], () => {
  return gulp.src('public/imgs/*')
    .pipe(gulp.dest(distDir + '/imgs'));
});

// Copy all deps to dist folder
gulp.task('copy-deps', () => {
  return gulp.src('./public/lib/**/*')
    .pipe(gulp.dest(distDir + '/lib'));
});

// Replace code blocks in html with build versions.
gulp.task('html', ['sha'], () => {
  return gulp.src([indexSrc, tokenSrc])
    .pipe(htmlReplace((function() {
      const h = {};
      if (process.env.NODE_ENV === 'production') {
        h.js = `static/build.${CURRENT_SHA}.min.js`;
        h.css = `static/build.${CURRENT_SHA}.css`;
      } else {
        h.analytics = '';
      }
      return h;
    })(), {
      keepUnassigned: true
    }))
    .pipe(gulp.dest(distDir));
});

/**
 * Prepare build for production
 */

// Save current git SHA
gulp.task('sha', (cb) => {
  exec('git rev-parse HEAD', (err, stdout) => {
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

// Combine all the js into the final build file.
gulp.task('js-package', ['js-build', 'sha'], () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  // NOTE: File Order Matters.
  return gulp.src([
    distDir + '/deps.min.js',
    distDir + '/app-bundle.min.js'
  ]).pipe(concat(`build.${CURRENT_SHA}.min.js`))
    .pipe(gulp.dest(distDir));
});

// Combine all the css into the final build file.
gulp.task('css-package', ['css-build', 'sha'], () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  return gulp.src(distDir + '/app-bundle.css')
    .pipe(rename(`build.${CURRENT_SHA}.css`))
    .pipe(gulp.dest(distDir));
});

// Delete ALL generated files.
gulp.task('clean', () => {
  return del(distDir);
});

// Delete build artifacts not served to the browser
gulp.task('clean-package', () => {
  if (process.env.NODE_ENV !== 'production') {
    return;
  }

  const files = ['style.css', 'app-bundle.*', 'deps.*'];
  return del(files.map(file => `${distDir}/${file}`));
});

// Live-watch development mode.
// Auto-compiles: js, sass, index.html.
gulp.task('dev', ['set-development', 'default'], () => {
  gulp.watch(indexSrc, ['html']);
  gulp.watch('./public/**/*.scss', ['css-build']);
});

const handleJest = (results, cb) => {
  if (results.success) {
    return cb(null, results);
  }
  process.nextTick(() => process.exit(1));
  return cb(results);
};

/**
 * Tests
 */
gulp.task('test', ['lint', 'set-test', 'js-build'], cb => jest.runCLI(
  {cache: true},
  __dirname,
  results => handleJest(results, cb)
));

gulp.task('coverage', ['lint', 'set-test', 'js-build'], cb => {
  const config = {
    cache: true,
    coverage: true,
    coverageDirectory: '__coverage__',
    coverageReporters: ['json', 'lcov', 'text', 'text-summary'],
    collectCoverageFrom: ['public/*.{js,jsx}', 'public/{components,module,ui}/**/*.{js,jsx}'],
  };
  jest.runCLI(config, __dirname, results => handleJest(results, cb));
});

gulp.task('default', cb => {
  // Run in order.
  runSequence(
    ['clean', 'lint'],
    ['js-package', 'css-package', 'html', 'assets', 'copy-deps'],
    'clean-package',
    cb);
});
