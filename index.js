const SayNode = require('./lib/say-node');

module.exports = SayNode;

module.exports.services = {
	sayNode: {
		service: SayNode,
		storeType: 'service'
	}
};
