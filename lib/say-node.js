const EventEmitter = require('events');
const profiles = require( './profiles');
const pcmConvert = require('pcm-convert');
// var Speaker = require('speaker');
const Duplex = require('stream').Duplex;
const { Worker } = require('worker_threads');

const variants = [
	'f1',
	'f2',
	'f3',
	'f4',
	'f5',
	
	'm1',
	'm2',
	'm3',
	'm4',
	'm5',
	'm6',
	'm7',
	
	'croak',
	'klatt',
	'klatt2',
	'klatt3',
	'whisper',
	'whisperf'
];

const languageIds = {
	'ca': 'Catalan',
	'cs': 'Czech',
	'de': 'German',
	'el': 'Greek',
	'en/en': 'English',
	'en/en-n': 'English (N)',
	'en/en-rp': 'English (RP)',
	'en/en-sc': 'English (Scottish)',
	'en/en-us': 'English (US)',
	'en/en-wm': 'English (WM)',
	'eo': 'Esperanto',
	'es': 'Spanish',
	'es-la': 'Spanish (Latin America)',
	'fi': 'Finnish',
	'fr': 'French',
	'hu': 'Hungarian',
	'it': 'Italian',
	'kn': 'Kannada',
	'la': 'Latin',
	'lv': 'Latvian',
	'nl': 'Dutch',
	'pl': 'Polish',
	'pt': 'Portuguese (Brazil)',
	'pt-pt': 'Portuguese, European',
	'ro': 'Romanian',
	'sk': 'Slovak',
	'sv': 'Swedish',
	'tr': 'Turkish',
	'zh': 'Chinese (Mandarin)',
	'zh-yue': 'Chinese (Cantonese)'
};

function playAudio(data, options, callback) {
	if (!SayNode.speaker) {
		SayNode.speaker = require('speaker');
	}
	const speaker = new SayNode.speaker(options);
	let stream = new Duplex();
	stream.push(data);
	stream.push(null);
	speaker.on('close', callback);
	stream.pipe(speaker);
	stream.destroy();
}

class SayNode extends EventEmitter {
	
	constructor(options) {
		super();
		if (!options) options = {};
		
		this.lang = null;
		this.profiles = {};
		this.defaultProfile = null;
		
		for (let name in profiles) {
			this.addProfile(profiles[name]);
		}
		
		if (options.profile) {
			this.setProfile(options.profile);
		}
		else {
			this.setProfile('Jack');
		}
		
		if (this.profile.engine === 'espeak') {
			if (options.language) {
				this.setLanguage(options.language);
			}
		}
		if (!this.lang) {
			this.setLanguage('en_us');
		}
		
		if (options.visualizer) {
			this.setVisualizer(options.visualizer);
		}
	}
	
	setVisualizer(vis) {
		this.visualizer = vis;
	}
	
	setLanguage(lang) {
		this.lang = SayNode.getLanguageId(lang);
	}
	
	processOptions(options) {
		if (!options) {
			options = {};
		}
		
		let profileName = (options.profile) ? options.profile : this.defaultProfile;
		
		const profile = this.profiles[profileName]['default'];
		
		var v = Object.assign({}, profile);
		
		if (options.slow) v.speed = this.profiles[profileName]['slow'].speed;
		if (options.fast) v.speed = this.profiles[profileName]['fast'].speed;
		if (options.low) v.pitch = this.profiles[profileName]['low'].pitch;
		if (options.high) v.pitch = this.profiles[profileName]['high'].pitch;
		
		if ('pitch' in options) v.pitch = options.pitch;
		if ('speed' in options) v.speed = options.speed;
		if ('wordgap' in options) v.wordgap = options.wordgap;
		if ('amplitude' in options) v.amplitude = options.amplitude;
		
		if (options.language) {
			v.voice = SayNode.getLanguageId(options.language);
		}
		else {
			v.voice = this.lang;
		}
		
		if (options.delay) {
			v.delay = options.delay;
		}
		
		return v;
	}
	
	say(text, options) {
		if (!options) options = {};
		let profileName = options.profile || this.defaultProfile;
		if (!options.profile) options.profile = profileName;
		let profile = this.profiles[profileName];
		let engine = profile.engine;
		
		options = this.processOptions(options);
		
		if (!/ /.test(text)) text = '[] [] '+text;
		
		let workerPath, audioOptions;
		if (engine === 'sam') {
			workerPath = __dirname + '/sam-workerthread.js';
			audioOptions = {
				channels: 1,
				bitDepth: 8,
				sampleRate: 22050
			}
		}
		else {
			workerPath = __dirname + '/espeak-all-workerthread.js';
			audioOptions = {
				channels: 1,
				bitDepth: 16,
				sampleRate: 22050
			}
		}
		
		return new Promise((resolve) => {
			const worker = new Worker(workerPath);
			worker.on('message', (message) => {
				let buffer;
				if (engine === 'sam') {
					buffer = Buffer.from(pcmConvert(message.rawdata, 'float32 mono', 'int8 mono'));
				}
				else {
					buffer = Buffer.from(message.rawdata)
				}
				playAudio(buffer,audioOptions, resolve);
			});
			worker.postMessage({
				cmd: 'speak',
				text,
				options
			});
		});
	}
	
	replacementsFor(text, replacements) {
		replacements.forEach(function (replacement) {
			let from = replacement[0];
			let to = replacement[1];
			text = text.replace(new RegExp(from, 'gi'), to);
		});
		return text;
	}
	
	addProfile(profile) {
		let profileTypes = ['high', 'low', 'fast', 'slow'];
		profileTypes.forEach(type => {
			if (type !== 'default' && type !== 'name') {
				var p = Object.assign({}, profile['default']);
				for (let i in profile[type]) {
					p[i] = profile[type][i];
				}
				profile[type] = p;
			}
		});
		this.profiles[profile.name] = profile;
	}
	
	setProfile(name) {
		this.defaultProfile = name;
		this.profile = profiles[name];
		return this;
	}
}

SayNode.variants = variants;
SayNode.profiles = profiles;
SayNode.languageIds = languageIds;

SayNode.getLanguageId = function (lang) {
	if (lang.indexOf('_') > -1) lang = lang.replace('_', '-');
	if (lang.startsWith('en') && lang.indexOf('/') === -1) lang = 'en/' + lang;
	return lang;
};

SayNode.addProfile = function (profile) {
	for (let name in profile) {
		SayNode.profiles[name] = profile[name];
	}
};

module.exports = SayNode;
