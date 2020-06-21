Jaxcore Say (NodeJS)
=======

A JavaScript speech synthesis (text-to-speech) for NodeJS.  This library generates speech sounds using only JavaScript, and outputs the generated PCM audio data directly to the speakers.  No native libraries are required therefore this library should provide for nearly ubiquitous and future-proof OS support (at least in theory).

For a version of Say which runs in web browsers and with more options and additional information, please refer to:

- [https://github.com/jaxcore/jaxcore-say](https://github.com/jaxcore/jaxcore-say)

### Examples

- [Basic example](https://jaxcore.github.io/jaxcore-say-node/basic-example) - simple example with one voice
- [Full example](https://jaxcore.github.io/jaxcore-say/full-example) - advanced example with multiple voices

### Installation (NPM module)

```
npm install jaxcore-say-node --mpg123-backend=openal
```

In any NodeJS project that depends on this module, you will need to use the ` --mpg123-backend=openal` option for MacOSX support.

```
npm install --mpg123-backend=openal
```

### Usage

```
const Say = require('jaxcore-say-node');
Say.speaker = require('speaker');

var voice = new Say({
	language: 'en',
	profile: 'Jack'
});

// say "hello world" through the speakers
voice.say("hello world").then(function() {
   // done
});
```

### Voice Profiles

Jaxcore Say (NodeJS) includes the following predefined ESpeak-based voices:

* Jack
* Pris
* Roy
* Scotty
* Xenu
* Cylon
* Leon
* Rachel
* Zhora

And the following SAM-based voices:

* Sam
* Elf
* Robo
* Granny

Provide the "profile" during instatiation:

```
var voice = new Say({
	language: 'en',
	profile: 'Cylon'
});
```

Or change the profile at any time:

```
voice.setProfile('Rachel');

```

### Intonation

The voice profiles include an easy way to modify the speed (faster/slower) and pitch (deeper/higher):

```
voice.say('hello world', {
  fast: true
});
```

```
voice.say('hello world', {
  slow: true
});
```

```
voice.say('hello world', {
  high: true
});
```

```
voice.say('hello world', {
  low: true
});
```

#### ESpeak Languages

The language should be defined while instantiating `new Say()`, the possible languages are:

* ca = Catalan
* cs = Czech
* de = German
* el = Greek
* en = English
* en-n = English (N)
* en-rp = English (RP)
* en-sc = English (Scottish)
* en-us = English (US)
* en-wm = English (WM)
* eo = Esperanto
* es = Spanish
* es-la = Spanish (Latin America)
* fi = Finnish
* fr = French
* hu = Hungarian
* it = Italian
* kn = Kannada
* la = Latin
* lv = Latvian
* nl = Dutch
* pl = Polish
* pt = Portuguese (Brazil)
* pt-pt = Portuguese, European
* ro = Romanian
* sk = Slovak
* sv = Swedish
* tr = Turkish
* zh = Chinese (Mandarin)
* zh-yue = Chinese (Cantonese)

Set the desired language while instantiating the Say object:

```
let voice = new Say({
	profile: "Cylon",
	language: "es"
});
voice.say("hola mi nombre es Cylon");
```

Or switch languages at any time:

```
voice.setLanguage("es");
```

Or set the language as a `say()` option:

```
voice.say("bonjour je m'appelle Cylon", {
  language: "fr"
});
```
### Run examples locally:

Clone this repo, then:

```
cd examples/basic-example
node start.js
```

And for multiple voices:

```
cd examples/basic-example
node start.js
```

## License

Jaxcore Say (NodeJS) is free software released under the GPL License.

However, IANAL (I am not a lawyer) and due to the bizarre combination of dependencies the license restrictions are ambiguous.

### Original Works

meSpeak (NPM module by Mikola Lysenko):
[https://github.com/mikolalysenko/mespeak](https://github.com/mikolalysenko/mespeak)

meSpeak (emscripten port by Norbert Landsteiner):
[https://www.masswerk.at/mespeak/](https://www.masswerk.at/mespeak/)

eSpeak [http://espeak.sourceforge.net/](http://espeak.sourceforge.net/)

SAM (reverse-engineered version of SAM by Sebastian Macke)
[https://github.com/s-macke/SAM](https://github.com/s-macke/SAM)

SAM fork by Vidar Hokstad
[https://github.com/vidarh/SAM](https://github.com/vidarh/SAM)

SAM-js port by Christian Schiffler
[https://github.com/discordier/sam](https://github.com/discordier/sam)

##### meSpeak License

Jaxcore Say includes modified source code from meSpeak which is GPL and also includes emscripten-compiled eSpeak code which is also GPL.  Therefore this derivative work is available under the GPL.

##### sam-js License

sam-js is used as an external dependency (via NPM) for the SAM based voice profiles.  sam-js was reverse engineered and could be classified as abadonware (quoted from [https://github.com/s-macke/SAM](https://github.com/s-macke/SAM)) :

```
The software is a reverse-engineered version of a software published more than 34 years ago by "Don't ask Software".

The company no longer exists. Any attempt to contact the original authors failed. Hence S.A.M. can be best described as Abandonware (http://en.wikipedia.org/wiki/Abandonware)

As long this is the case I cannot put my code under any specific open source software license. However the software might be used under the "Fair Use" act (https://en.wikipedia.org/wiki/FAIR_USE_Act) in the USA.
```

Jaxcore Say will be updated according to any new information that comes to light and it is recommended that any further derivative works/improvement also be independently released under the GPL.