# ngmin-dynamic [![Build Status](https://travis-ci.org/btford/ngmin-dynamic.svg?branch=master)](https://travis-ci.org/btford/ngmin-dynamic)

Uses a dynamic analysis technique to provide DI annotations for AngularJS.

**Note:** This is pretty new so it might have some bugs.

See [ngmin](https://github.com/btford/ngmin)

## API

It's just a single function that takes some code as a string and returns the string but annotated.

```javascipt
var ngmin = require('ngmin-dynamic');

var annotated = ngmin('some code as a string');
```

## License
MIT
