import { nanoid } from 'nanoid/non-secure';

var nameToClassTab = {};

function registerClass(name, clas) {
	nameToClassTab[name] = clas;
}

class DRObject {
	constructor(o) {
		if(o) {
			Object.assign(this, o);
		}
		this.uniqueId = nanoid();
	}
	
	xmlName() {
		return 'DRObject';
	}
};

class Osc1 extends DRObject {
	xmlName() {
		return 'osc1';
	}
};

class Osc2 extends DRObject {
	xmlName() {
		return 'osc2';
	}
};


class Sound extends DRObject {
	xmlName() {
		return 'sound';
	}
};

class Kit extends DRObject {
	xmlName() {
		return 'kit';
	}
};

class CVChannel extends DRObject {
	xmlName() {
		return 'cvChannel';
	}
};

class MidiChannel extends DRObject {
	xmlName() {
		return 'midiChannel';
	}
};


class Song extends DRObject {
	xmlName() {
		return 'song';
	}
};

class MidiOutput extends DRObject {
	xmlName() {
		return 'midiOutput';
	}
};

class AudioTrack extends DRObject {
	xmlName() {
		return 'audioTrack';
	}
};

class AudioClip extends DRObject {
	xmlName() {
		return 'audioClip';
	}
};

class InstrumentClip extends DRObject {
	xmlName() {
		return 'instrumentClip';
	}
};


registerClass('kit', Kit);
registerClass('sound', Sound);
registerClass('osc1', Osc1);
registerClass('osc2', Osc2);
registerClass('midiOutput', MidiOutput);
registerClass('cvChannel', CVChannel);
registerClass('midiChannel', MidiChannel);


registerClass('audioTrack', AudioTrack);
registerClass('audioClip', AudioClip);
registerClass('instrumentClip', InstrumentClip);


function become(was, classToBe) {
	let me = new classToBe();
	let newMe = Object.assign(me, was);
	return newMe;
}

export {DRObject, nameToClassTab, Kit, Sound, Song, MidiChannel, CVChannel, AudioTrack, AudioClip, InstrumentClip, become};