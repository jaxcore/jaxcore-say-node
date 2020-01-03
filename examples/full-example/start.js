const Say = require('../../');

const voices = {};

voices.jack = new Say({
	language: 'en',
	profile: 'Jack'
});
voices.pris = new Say({
	language: 'en',
	profile: 'Pris'
});
voices.roy = new Say({
	language: 'en',
	profile: 'Roy'
});
voices.scotty = new Say({
	language: 'en',
	profile: 'Scotty'
});
voices.xenu = new Say({
	language: 'en',
	profile: 'Xenu'
});
voices.cylon = new Say({
	language: 'en',
	profile: 'Cylon'
});
voices.leon = new Say({
	language: 'en',
	profile: 'Leon'
});
voices.rachel = new Say({
	language: 'en',
	profile: 'Rachel'
});
voices.zhora = new Say({
	language: 'en',
	profile: 'Zhora'
});
voices.sam = new Say({
	profile: 'Sam'
});

function playNext(list) {
	if (list.length) {
		let name = list.shift();
		voices[name].say("Hello World");
		setTimeout(function() {
			playNext(list);
		},1000);
	}
}

let v = Object.keys(voices);
playNext(v);
