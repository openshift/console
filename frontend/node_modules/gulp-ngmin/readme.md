# [gulp](http://gulpjs.com)-ngmin [![Build Status](https://travis-ci.org/sindresorhus/gulp-ngmin.svg?branch=master)](https://travis-ci.org/sindresorhus/gulp-ngmin)

> Pre-minify AngularJS apps with [ngmin](https://github.com/btford/ngmin)

*Issues with the output should be reported on the ngmin [issue tracker](https://github.com/btford/ngmin/issues).*


## Install

```bash
$ npm install --save-dev gulp-ngmin
```


## Usage

```js
var gulp = require('gulp');
var ngmin = require('gulp-ngmin');

gulp.task('default', function () {
	return gulp.src('src/app.js')
		.pipe(ngmin({dynamic: true}))
		.pipe(gulp.dest('dist'));
});
```


## API

### ngmin(options)

#### options.dynamic

Type: `boolean`  
Default: `false`

Enables the [dynamic mode](https://github.com/btford/ngmin#dynamic-mode).


## License

[MIT](http://opensource.org/licenses/MIT) © [Sindre Sorhus](http://sindresorhus.com)
