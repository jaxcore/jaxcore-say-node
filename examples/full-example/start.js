const Say = require('../../');
Say.speaker = require('speaker');

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
		
		// Change how the voices sound by setting the options:
		let options = {
			// fast: true,
			// slow: true,
			// high: true,
			// low: true,
			// amplitude: 100,
			// wordgap: 10
		};
		
		let text = "hello, I am "+name;
		console.log(text);
		
		voices[name].setVolume(0.5);
		
		voices[name].say(text, options).then(function() {
			playNext(list);
		});
	}
}

playNext(Object.keys(voices));
