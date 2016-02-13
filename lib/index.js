'use strict';

var through = require('through2'),
    _       = require('lodash'),
    ftcache = require('../../file-transform-cache/lib'),
    File    = require('vinyl'),
    gutil   = require('gulp-util');

var PluginError = gutil.PluginError;

const PLUGIN_NAME = 'gulp-file-transform-cache';

// files passing through gulp look like vinyl, but don't pass the .isVinyl
// (at least in the version of gulp i was testing with) test which is a
// requirement of file-tranforme-cache. so just normalize...
function normalizeVinyl(file) {
    if ( !File.isVinyl(file) ) {
        return new File({path: file.path, contents: file.contents});
    }
    return file;
}

function makeTransformAdapter(transformPlugins) {

    if ( typeof transformPlugins === 'function' ) {
        transformPlugins = [transformPlugins];
    }
    if ( !_.isArray(transformPlugins) || transformPlugins.length === 0 ) {
        throw new PluginError(PLUGIN_NAME, 'transormPlugins must be a gulp plugin, or array of gulp plugins');
    }
    var len = transformPlugins.length;

    return (file, next) => {

        // create a stream to emit the incoming file...
        // todo: is there a better way to do this?
        var fileStream = file.pipe( through.obj( (arg1, arg2, cb) => { cb(null, file); }));
        fileStream = _.reduce( transformPlugins, (stream, plugin) => {
            stream = stream.pipe(plugin());
        }, fileStream );

        // force the stream to be consumed. i have no idea how we're
        // supposed to deal with errors in the transform here....
        // listen for error events on th stream and call next with the error?
        fileStream.on('data', function(result) {
            if ( !result || !result.contents ) {
                return next( new Error('an unknown error happened during transformation'), result);
            }
            next(null, result);
        });
    };
}

function gulpFileTransformCache(options) {

    var ftcOptions = _.assign( {}, options, {transforms: [ makeTransformAdapter(options.transformPlugins||[]) ]});
    delete ftcOptions.transformPlugin;

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
