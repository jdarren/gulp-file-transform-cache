'use strict';

var gulp         = require('gulp'),
    gulpPrefixer = require('./gulpPrefixer'),
    through      = require('through2'),
    gulpTfc      = require('./lib');

gulp.src(['data/*.txt'])
    .pipe(gulpTfc({path: '.sampleCache',
              transformPlugins: [
                  gulpPrefixer.bind(null,'** Fred\n'),
                  gulpPrefixer.bind(null,'** Joe\n')
              ]
          }))
    .pipe((() => {
        return through.obj( (file,enc, next) => {
            console.log(file.path);
            console.log('=======================');
            console.log(file.contents.toString());
            next(null,file);
        });
    })())
    .pipe( gulp.dest('dest') );
