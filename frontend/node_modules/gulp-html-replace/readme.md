# gulp-html-replace [![NPM version][npm-image]][npm-url] [![Build status][travis-image]][travis-url]

> Replace build blocks in HTML. Like useref but done right.

## Upgrading from 0.x to 1.x
Version 1.0 introduces streaming support, less confusing API, new option *keepUnused* and full code overhaul.
It also introduces some breaking changes but don't worry, you won't be needed to change your code, it's just a bit different syntax.
* If you used single task like this: `htmlreplace('js', 'script.js')` just change it to `htmlreplace({js: 'script.js'})`
* If you used single task with template: `htmlreplace('js', 'script.js', '<script="%s">')` change it to `htmlreplace({js: {src: 'script.js', tpl: '<script="%s">'})`
* `files` renamed to `src`, see previous example. Rename if needed.

That should be enough for you code to continue to work with the new version.

## Usage
Install:
```shell
npm install --save-dev gulp-html-replace
```

Put some blocks in your HTML file:
```html
<!-- build:<name> -->
Everything here will be replaced
<!-- endbuild -->
```
`name` is the name of the block. Could consist of letters, digits, underscore ( **_** ) and hyphen ( **-** ) symbols.

## API
### htmlreplace(tasks, keepUnused = false)

#### tasks
Type: `Object`

`{task-name: options}`

* **task-name** - The name of the block in your HTML.
* **options** - `String|Array|Object` The replacement. See examples below.

###### Simple example:
```javascript
// Options is a single string
htmlreplace({js: 'js/main.js'})

// Options is an array of strings
htmlreplace({js: ['js/monster.js', 'js/hero.js']})
```
>If your options strings ends with `.js` or `.css` they will be replaced by correct script/style tags, so you don't need to specify a template like in the example below.

###### Advanced example:
```javascript
// Options is an object
htmlreplace({
  js: {
    src: 'img/avatar.png',
    tpl: '<img src="%s" align="left">'
  }
})
```
* **src** - `String|Array` Same thing as in simple example.
* **tpl** - `String` Template string. Uses [util.format()](http://nodejs.org/api/util.html#util_util_format_format) internally.

> So, in the above example `%s` will be replaced with `img/avatar.png` producing `<img src="img/avatar.png" align="left">` as a result.

#### keepUnused
* Type: `Boolean`
* Default: `false`

Whether to keep blocks with unused names or remove them.

## Example
index.html:

```html
<!DOCTYPE html>
<html>
    <head>

    <!-- build:css -->
    <link rel="stylesheet" href="css/normalize.css">
    <link rel="stylesheet" href="css/main.css">
    <!-- endbuild -->

    </head>
    <body>

    <!-- build:js -->
    <script src="js/player.js"></script>
    <script src="js/monster.js"></script>
    <script src="js/world.js"></script>
    <!-- endbuild -->
```

gulpfile.js:

```javascript
var gulp = require('gulp');
var htmlreplace = require('gulp-html-replace');

gulp.task('default', function() {
  gulp.src('index.html')
    .pipe(htmlreplace({
        'css': 'styles.min.css',
        'js': 'js/bundle.min.js'
    }))
    .pipe(gulp.dest('build/'));
});
```

Result:

```html
<!DOCTYPE html>
<html>
    <head>

    <link rel="stylesheet" href="styles.min.css">

    </head>
    <body>

    <script src="js/bundle.min.js"></script>
```

[npm-url]: https://npmjs.org/package/gulp-html-replace
[npm-image]: https://badge.fury.io/js/gulp-html-replace.png
[travis-url]: https://travis-ci.org/VFK/gulp-html-replace
[travis-image]: https://travis-ci.org/VFK/gulp-html-replace.png?branch=master
