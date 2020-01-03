const Say = require('../../');

var voice = new Say({
	language: 'en',
	profile: 'Jack'
});

voice.say("hello world");