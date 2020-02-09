const Say = require('../../');
Say.speaker = require('speaker');

var voice = new Say({
	language: 'en-us',
	profile: 'Jack'
});

console.log('Saying "hello world" ...');
voice.say("hello world").then(() => {
	console.log('done');
});