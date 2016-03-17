'use strict';

var through = require('through2'),
    _       = require('lodash'),
    ftcache = require('file-transform-cache'),
    File    = require('vinyl'),
    gutil   = require('gulp-util');

var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-file-transform-cache';

// files passing through gulp look like vinyl, but don't pass the .isVinyl
// (at least in the version of gulp i was testing with) test which is a
// requirement of file-tranforme-cache. so just normalize...
function normalizeVinyl(file) {
    if ( !File.isVinyl(file) ) {
        return new File({path: file.path, base: file.base, contents: file.contents});
    }
    return file;
}

/**
 *  Given a stream, return a function that implements the contract for a file-transform-cache
 *  transform.
 *
 **/
function makeTransformAdapter(streams) {

    if ( !_.isArray(streams) && typeof streams === 'object') {
        streams = [streams];
    }

    // setup the stream pipeline, but keep a reference to the first stream
    // so we can write to the first stream.
    var head = streams[0];
    var str  = head;
    for ( var i = 1 ; i < streams.length ; i++ ) {
        str = str.pipe(streams[i])
    }

    /**
     *  Assumes the input stream will either successfully make a transformation and
     *  emit a file, or have a problem and emit an error.
     *
     **/
    return (file, next) => {

        // since any given path through the stream will either emit 1 data or 1 error,
        // remove the listeners from the prior run, as 1 will still be around
        // generally 'error' listeners would grow unbounded until an error was generated.
        str.removeAllListeners('error');
        str.removeAllListeners('data');

        str.once('error', function(error) {
            next(error, null);
        });
        str.once('data', function(result) {
            if ( !result || !result.contents ) {
                return next( new Error('an unknown error happened during transformation'), result);
            }
            next(null, result);
        });
        head.write(file);
    };
}

function gulpFileTransformCache(options) {

    var ftcOptions = _.assign( {}, options, {transforms: [ makeTransformAdapter(options.transformStreams) ]});
    delete ftcOptions.transformStreams;

    var ftc = ftcache(ftcOptions);

    var stream = through.obj( (file, enc, next) => {
        file = normalizeVinyl(file);
        if ( file.isNull() ) {
            return next(null, file);
        }
        if ( file.isStream() ) {
            throw new PluginError(PLUGIN_NAME, 'Does not support streams')
        }

        ftc.transform(file, (err, resultFile) => {
            if ( err ) {
                return next(err, null);
            }
            next(null, resultFile);
        });
    });

    // save the cache once the stream has been closed.
    stream.on('end', function() { ftc.save(); });

    return stream;
}

module.exports = gulpFileTransformCache;
