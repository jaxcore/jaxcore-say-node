const {Service, createServiceStore, createLogger} = require('jaxcore');
const profiles = require( './profiles');
const pcmConvert = require('pcm-convert');
const Speaker = require('speaker');
const Duplex = require('stream').Duplex;
const { Worker } = require('worker_threads');
const Volume = require("pcm-volume");
const fs = require("fs");

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

function playAudio(data, options, volume, callback) {
	const speaker = new Speaker(options);
	
	let stream = new Duplex();
	stream.push(data);
	stream.push(null);
	speaker.on('close', function () {
		callback();
	});
	
	if (volume < 1) {
		const volumeStream = new Volume();
		volumeStream.setVolume(volume);
		volumeStream.pipe(speaker);
		stream.pipe(volumeStream);
	}
	else {
		stream.pipe(speaker);
	}
	
	stream.destroy();
}

function makeReplacements(text, corrections) {
	if (typeof corrections === 'object') {
		for (let key in corrections) {
			let r = '(?<=\\s|^)(' + corrections[key] + ')(?=\\s|$)';
			let regex = new RegExp(r, 'i');
			let match = regex.test(text);
			if (match) {
				text = text.replace(new RegExp(r, 'gi'), function (m, a) {
					return key;
				});
			}
		}
		return text;
	}
}

const schema = {
	id: {
		type: 'string',
		defaultValue: 'speech'
	},
	connected: {
		type: 'boolean',
		defaultValue: false
	},
	volume: {
		type: 'number',
		defaultValue: 1
	},
	workerPaths: {
		type: 'object',
		defaultValue: {
			sam: __dirname + '/sam-workerthread.js',
			espeak: __dirname + '/espeak-all-workerthread.js'
		}
	}
};

let sayInstance;

class SayNode extends Service {
	constructor(defaults, store) {
		if (!store) store = createServiceStore('SayNode');
		super(schema, store, defaults);
		
		this.log = createLogger('SayNode');
		this.log('workerPaths:', this.state.workerPaths);
		
		this.lang = null;
		this.profiles = {};
		this.defaultProfile = null;
		
		for (let name in profiles) {
			this.addProfile(profiles[name]);
		}
		
		if (defaults && defaults.profile) {
			this.setProfile(defaults.profile);
		}
		else {
			this.setProfile('Jack');
		}
		
		if (defaults && defaults.language) {
			this.setLanguage(defaults.language);
		}
		else {
			this.setLanguage('en_us');
		}
	}
	
	setLanguage(lang) {
		this.lang = SayNode.getLanguageId(lang);
	}
	
	processOptions(text, options) {
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
		
		if (options.replacements) {
			v.replacementText = makeReplacements(text, options.replacements);
		}
		
		return v;
	}
	
	async getAudioData(text, options) {
		return this.say(text, options, true);
	}
	
	setWorkerContent(workerContent) {
		this.workerContent = workerContent;
	}
	
	say(text, options, returnData) {
		this.log('say', text, options, returnData);
		
		text = text.toLowerCase();
		if (!options) options = {};
		let profileName = options.profile || this.defaultProfile;
		if (!options.profile) options.profile = profileName;
		let profile = this.profiles[profileName];
		let engine = profile.engine;
		
		options = this.processOptions(text, options);
		
		if (!/ /.test(text)) text = '[] [] '+text;
		
		let workerPath, audioOptions;
		if (engine === 'sam') {
			workerPath = this.state.workerPaths['sam'];
			audioOptions = {
				channels: 1,
				bitDepth: 8,
				sampleRate: 22050
			}
		}
		else if (engine === 'espeak') {
			workerPath = this.state.workerPaths['espeak'];
			audioOptions = {
				channels: 1,
				bitDepth: 16,
				sampleRate: 22050
			}
		}
		
		return new Promise((resolve) => {
			this.log('new Worker', workerPath);
			
			let worker;
			if (this.workerContent) {
				worker = new Worker(this.workerContent[engine], { eval: true });
			}
			else {
				worker = new Worker(workerPath);
			}
			
			worker.on('message', (message) => {
				let buffer;
				if (engine === 'sam') {
					buffer = Buffer.from(pcmConvert(message.rawdata, 'float32 mono', 'int8 mono'));
				}
				else {
					buffer = Buffer.from(message.rawdata)
				}
				
				if (returnData) {
					resolve(message.rawdata);
				}
				else {
					playAudio(buffer, audioOptions, this.state.volume, resolve);
				}
				
				worker.removeAllListeners();
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
	}
	
	setVolume(volume) {
		this.setState({volume});
	}
	
	connect() {
		if (!this.state.connected) {
			this.setState({connected: true});
			this.emit('connect');
		}
	}
	
	static getLanguageId (lang) {
		if (lang.indexOf('_') > -1) lang = lang.replace('_', '-');
		if (lang.startsWith('en') && lang.indexOf('/') === -1) lang = 'en/' + lang;
		return lang;
	};
	
	static id() {
		return 'sayNode';
	}
	
	static getOrCreateInstance(serviceStore, serviceId, serviceConfig, callback) {
		if (sayInstance) {
			callback(null, sayInstance, false);
		}
		else {
			const sayDefaults = {
				id: serviceId,
			};
			if (serviceConfig.workerPaths) {
				sayDefaults.workerPaths = serviceConfig.workerPaths;
			}
			sayInstance = new SayNode(sayDefaults, serviceStore);
			callback(null, sayInstance, true);
		}
	}
}

SayNode.profiles = profiles;
SayNode.languageIds = languageIds;

module.exports = SayNode;
