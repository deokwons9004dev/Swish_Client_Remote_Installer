/**
 * Swish Remote Client Installer
 * v1.0.0: Initial build.
 * v1.0.1: Added cleanup utility for systems that didnt have nodejs.
 * v1.0.2: Added more aggresive cleanup utility.
 */
var log = console.log.bind(this);

var path = require("path");
var cp   = require("child_process");
var os   = require("os");
var fs   = require("fs");

var ghdown = require("download-git-repo");
var async  = require("async");
var ndir   = require("node-dir");
var fse    = require("fs-extra");
var colors = require("colors");

var download_path = path.join(os.homedir(), '/SwishRC');
var npmg_path     = path.join(os.homedir(), '/.swish_npm_global'); 
var bin_path      = path.join(os.homedir(), '/n/bin/');
var npmbin_path   = path.join(npmg_path, '/bin/');

var cond_hasNodeJS   = false; // User has access to NodeJS binary.
var cond_hasNPM      = false; // User has access to NPM binary.
var cond_cleanNodeJS = false; // When using n to install Node, remove n after install.

var env_path = null;
var os_type;
var os_arch;
var install_type;

var success = function () {
	process.stdout.write(colors.green('[SUCCESS] '));
	console.log.apply(this, arguments);
}
var info = function () {
	process.stdout.write(colors.cyan('[INFO] '));
	console.log.apply(this, arguments);
}
var error = function () {
	process.stdout.write(colors.red('[ERROR] '));
	console.log.apply(this, arguments);
}
var warn = function () {
	process.stdout.write(colors.yellow('[WARNING] '));
	console.log.apply(this, arguments);
}


os_type = os.platform();
os_arch = os.arch();

if (os_type == 'darwin') {
	if      (os_arch == 'x32') install_type = 'macos-x86';
	else if (os_arch == 'x64') install_type = 'macos-x64';
	else {
		error('Unsupported MacOS Architecture: ', os_arch);
		process.exit(-1);
	}
}
else if (os_type == 'linux') {
	if      (os_arch == 'x32') install_type = 'linux-x86';
	else if (os_arch == 'x64') install_type = 'linux-x64';
	else {
		error('Unsupported Linux Architecture: ', os_arch);
		process.exit(-1);
	}
}
else {
	error('Only supports MacOS and Linux.');
	process.exit(-1);
}




log('-----------------------------------------------');
log('| Swish Remote Client Installer for %s |', install_type);
log('| LonelyDuck Software                         |');
log('-----------------------------------------------');

log('v1.0.2');

async.waterfall([
	function (callback) {
		info('Checking NodeJS and NPM...');
		
		var execopt = {
			shell: '/bin/bash'
		}
		cp.exec('echo $PATH', execopt, function (e, stdout, stderr) {
			if (e) {
				error(e.toString());
				process.exit(-1);
			}
						
			var paths_str = stdout.toString();
			var paths     = paths_str.split(':');
			env_path      = paths_str;
									
			for (var i = 0; i < paths.length; i++) {
				if (!fs.existsSync(paths[i].toString())) continue;
				
				var bins = fs.readdirSync(paths[i].toString());
				if (!bins) continue;
				
				for (var j = 0; j < bins.length; j++) {
					if (path.basename(bins[j]) == 'node') cond_hasNodeJS = true;
					if (path.basename(bins[j]) == 'npm')  cond_hasNPM    = true;
				}
			}
			
			log('NodeJS: ' + cond_hasNodeJS);
			log('NPM   : ' + cond_hasNPM);
			
			return callback(null);
		});
	},

	function (callback) {
		if (cond_hasNodeJS && cond_hasNPM) return callback(null);
		
		info('Setting up NodeJS and NPM for Swish installation...');
		
		var execopt = {
			shell: '/bin/bash'
		}
		cp.exec('curl -sL https://git.io/n-install | bash -s -- -y', execopt, function (e, stdout, stderr) {
			if (e) {
				error(e.toString());
				process.exit(-1);
			}
//			log(stdout.toString());
			return callback(null);
		});
	},

	function (callback) {
		info('Setting up NPM global installation environment...');
		
		var npmg_exists = fs.existsSync(npmg_path);	
		
		if (npmg_exists) {
			warn('NPM already seems to be configured correctly. Skipping...');
			return callback(null);
		}
		else {
			fs.mkdir(npmg_path, function (e) {
				if (e) {
					error(e.toString());
					process.exit(-1);
				}
				return callback(null);
			});
		}
	},

	function (callback) {
		info('Downloading latest Swish Remote Client...');
		
		ghdown('github:deokwons9004dev/Swish_Client_Remote', download_path, null, function (e) {
			if (e) {
				error(e.toString());
				process.exit(-1);
			}
			else {
				return callback(null);
			}
		});
	},
	
	function (callback) {
		info('Installing module requirements...');
		
		var install;
		var spitOutput  = true;
		var savedOutput = "";
		
		var shortWait = setTimeout(function () {
			log('Dont worry its not frozen.');
		}, 1000 * 30);
		var midWait = setTimeout(function () {
			log('Yeah I know this usually takes a while...');
		}, 1000 * 60);
		var longWait = setTimeout(function () {
			log('Maybe you should go make a sandwich and come back.');
		}, 1000 * 90);
		var megaWait = setTimeout(function () {
			log('Damn your computer is slow. Are you mining bitcoin or something?');
		}, 1000 * 120);
		var finalWait = setTimeout(function () {
			log('Im gonna have to download more CPU power to compensate for your potato hardware.');
		}, 1000 * 150);
		
		var execopt = {
			shell: '/bin/bash',
			cwd  : download_path,
			env  : { 'NPM_CONFIG_PREFIX': npmg_path, 'PATH': env_path + ':' + bin_path + ':' + npmbin_path }
		}
		install = cp.spawn('npm', ['install'], execopt);
		
		install.stdout.on('data', function (data) {
			log(data.toString());
		});
		
		install.stderr.on('data', function (data) {
			warn(data.toString());
		});
		
		install.on('exit', function (code, signal) {
			info('NPM installation finished with code %d, signal %s', code, signal);
			
			clearTimeout(shortWait);
			clearTimeout(midWait);
			clearTimeout(longWait);
			clearTimeout(megaWait);
			clearTimeout(finalWait);
			
			if (code != 0 || signal != null) {
				error('NPM failed to install modules for Swish.');
				process.exit(-1);
			}
			
			return callback(null);
		});
	},
	
	function (callback) {
		info('Installing building tools...');
		
		var execopt = {
			shell: '/bin/bash',
			env: { 'NPM_CONFIG_PREFIX': npmg_path, 'PATH': env_path + ':' + bin_path + ':' + npmbin_path }
		}
		cp.exec('npm install -g pkg', execopt, function (e, stdout, stderr) {
			if (e) {
				error(e.toString());
				process.exit(-1);
			}
//			log(stdout.toString());
			return callback(null);
		});
	},
	
	function (callback) {
		info('Installing patching tools (needed for successful build)...');
		
		var execopt = {
			shell: '/bin/bash',
			env: { 'NPM_CONFIG_PREFIX': npmg_path, 'PATH': env_path + ':' + bin_path + ':' + npmbin_path }
		}
		cp.exec('npm install -g node-gyp', execopt, function (e, stdout, stderr) {
			if (e) {
				error(e.toString());
				process.exit(-1);
			}
//			log(stdout.toString());
			return callback(null);
		});
	},
	
	function (callback) {
		info('Applying module patches...');
		
		var execopt = {
			shell: '/bin/bash',
			cwd: path.join(download_path, './node_modules/deasync'),
			env: { 'NPM_CONFIG_PREFIX': npmg_path, 'PATH': env_path + ':' + bin_path + ':' + npmbin_path }
		}
		cp.exec('node-gyp rebuild', execopt, function (e, stdout, stderr) {
			if (e) {
				error(e.toString());
				process.exit(-1);
			}
//			log(stdout.toString());
			return callback(null);
		});
	},
	
	function (callback) {
		info('Building Swish Remote Client...');
		
		var opath = path.join(download_path, '/swishrc');
		var execopt = {
			cwd: download_path,
			env: { 'NPM_CONFIG_PREFIX': npmg_path, 'PATH': env_path + ':' + bin_path + ':' + npmbin_path }
		}
		cp.exec('pkg -t ' + install_type + ' -o ' + opath + ' ./main.js', execopt, function (e, stdout, stderr) {
			if (e) {
				error(e.toString());
				process.exit(-1);
			}
//			log(stdout.toString());
			return callback(null);
		});
	},
	
	function (callback) {
		info('Cleaning up files...');
				
		var files = fs.readdirSync(download_path);
		for (var i = 0; i < files.length; i++) {
			if (files[i] != 'node_modules' && files[i] != 'swishrc') {
				fse.removeSync(path.join(download_path, files[i]));
			}
		}
		
		fse.removeSync(npmg_path); // ~/.swish_npm_global
		fse.removeSync(path.join(os.homedir(), '/.node-gyp'));
		
		if (!cond_hasNodeJS) fse.removeSync(path.join(os.homedir(), '/n/'));
		if (!cond_hasNPM)    fse.removeSync(path.join(os.homedir(), '/.npm/'));
		
		return callback(null);
	}
], function (e) {
	if (e) {
		error(e);
		process.exit(-1);
	}
	else {
		success('Swish Remote Client installed at :', path.join(download_path, '/swishrc'));
		warn('Do not remove the node_modules folder!!');
		process.exit(0);
	}
});
