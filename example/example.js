'use strict';

var gulp         = require('gulp'),
    gulpPrefixer = require('./gulpPrefixer'),
    through      = require('through2'),
    gulpTfc      = require('../lib');

gulp.src(['data/*.txt'])
    .pipe(gulpTfc({ path: '.exampleCache',
       transformStreams: [ gulpPrefixer('** Fred\n'),
                           gulpPrefixer('** Joe\n')   ]

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
