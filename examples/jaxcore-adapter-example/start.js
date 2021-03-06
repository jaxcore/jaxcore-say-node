const Jaxcore = require('jaxcore');
const jaxcore = new Jaxcore();

// add jaxcore-say-node plugin
jaxcore.addPlugin(require('../../'));

class SayAdapter extends Jaxcore.Adapter {
	constructor(store, config, theme, devices, services) {
		super(store, config, theme, devices, services);
		
		const {sayNode} = services;
		
		sayNode.setProfile('Cylon');
		
		sayNode.say('hello').then(() => {
			
			sayNode.setProfile('Xenu');
			
			sayNode.say('world');
			
			// the nodejs script will exit here because there's no other javascript tasks running
		})
	}
}

jaxcore.defineService('Say', 'sayNode', {
	workerPaths: {
		sam: __dirname + '/workerthreads/sam-workerthread.js',
		espeak: __dirname + '/workerthreads/espeak-all-workerthread.js'
	}
});

jaxcore.addAdapter('say-adapter', SayAdapter);

jaxcore.defineAdapter('Say Example', {
	adapterType: 'say-adapter',
	serviceProfiles: [
		'Say'
	]
});

jaxcore.connectAdapter(null, 'Say Example');
