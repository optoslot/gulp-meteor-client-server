//==================================================================================================
// Imports
//==================================================================================================

const gutil = require('gulp-util');
const through = require('through2');

const meteorClientServer = require('./libs/meteorClientServer');

//==================================================================================================
// Module
//==================================================================================================

const thisModule = {};

thisModule.Arch = meteorClientServer.Arch;

thisModule.plugin = (options) => {
	return through.obj(function (file, enc, cb) {
		// Is file not exists
		if (file.isNull()) {
			cb(null, file);
			return;
		}

		// If file presented by stream
		if (file.isStream()) {
			cb(new gutil.PluginError('gulp-meteor-client-server', 'Streaming not supported'));
			return;
		}

		// Plugin logic
		try {
			const srcData = file.contents.toString();
			const dstData = meteorClientServer.transform(srcData, options.arch);
			file.contents = new Buffer(dstData);

			// Push file
			this.push(file);
		} catch (err) {
			this.emit('error', new PluginError('gulp-meteor-client-server', err));
		}

		// Callback
		cb();
	});
};

//==================================================================================================
// Exports
//==================================================================================================

module.exports = thisModule;

// EOF