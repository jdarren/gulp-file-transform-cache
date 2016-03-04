# gulp-file-transform-cache

## Why

Because disk space is cheap. Save the results of expensive file transformation steps in your build pipeline (e.g. babel compilation), so that repeated runs only incur the transformation cost when necessary (e.g. the source file was changed). This module creates an adapter layer wrapping the file-transform-cache module to create
a gulp plugin.

## Getting Started

Install with `npm install gulp-file-transform-cache`

## Example

Consider the following build pipeline

```javascript

var gulp         = require('gulp'),
    babel        = require('gulp-babel');

gulp.src(['js/**/*.jsx'])
    .pipe(babel())
    .pipe( gulp.dest('dest') );

```

Enhance this to create super fast builds that only run the transformation again
if it's stale...

```javascript

var gulp  = require('gulp'),
    babel = require('gulp-babel'),
    gftc  = require('gulp-file-transform-cache');

gulp.src(['js/**/*.jsx'])
    .pipe(gftc({ path: '.babelCache',
                 transformStreams: [ babel() ]
    }))
    .pipe( gulp.dest('dest') );

```

#### Options

##### `path`     
The path to the cache-file which will be read/written to maintain the transform cache

##### `transformStreams`
An array of streams to provide any number of successive transformations. For Example
`[ babel(), minify() ]` would be equivalent to `babel().pipe(minify())`. If only one
transform is needed, the array can be omitted. (e.g. `transformStreams: babel()` )


##### see the example directory for a more detailed example.
