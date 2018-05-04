//==================================================================================================
// Enums
//==================================================================================================

const Arch = {
	Client: 'Client',
	Server: 'Server'
};

const Target = {
	Any: 'Any',
	Client: 'Client',
	Server: 'Server'
};

const CodeState = {
	SingleLineComment: 'LineComment',
	MultiLineComment: 'MultiLineComment',
	Code: 'Code'
};

const SourceProcessorWords = {
	MeteorIsClientBegin: 'if (Meteor.isClient) {',
	MeteorIsServerBegin: 'if (Meteor.isServer) {',
	OpenBracket: '{',
	CloseBracket: '}',
	OpenSinleLineComment: '//',
	CloseSingleLineComment: ['\r', '\n'],
	OpenMultiLineComment: '/*',
	CloseMultiLineComment: '*/'
};

//==================================================================================================
// Private util functions
//==================================================================================================

function _pushStringToCharArray(charArr, str) {
	for (let i = 0; i < str.length; i++) {
		charArr.push(str.charAt(i));
	}
}

//==================================================================================================
// Source plume class
//==================================================================================================

class SourcePlume {
	constructor() {
		this._chars = [];
	}

	pushString(str) {
		_pushStringToCharArray(this._chars, str);
	}

	endsWith(strOrArr) {
		if (typeof strOrArr === 'string') {
			return this.endsWithString(strOrArr);
		} else {
			for (let str of strOrArr) {
				if (this.endsWithString(str)) {
					return true;
				}
			}
			return false;
		}
	}

	endsWithString(str) {
		if (this._chars.length < str.length) {
			return false;
		}

		for (let strIndex = str.length, charsIndex = this._chars.length; --strIndex >= 0 && --charsIndex >= 0;) {
			if (str.charAt(strIndex) !== this._chars[charsIndex]) {
				return false;
			}
		}

		return true;
	}
}

//==================================================================================================
// Source buffer class
//==================================================================================================

class SourceBuffer {
	constructor() {
		this._chars = [];
	}

	pushString(str) {
		_pushStringToCharArray(this._chars, str);
	}

	changeSizeWithDelta(delta) {
		this._chars.length += delta;
	}

	buildString() {
		return this._chars.join('');
	}
}

//==================================================================================================
// Source processor class
//==================================================================================================

class SourceProcessor {
	constructor() {
	}

	processSource(source, arch) {
		let desiredTarget;
		if (arch === Arch.Client) {
			desiredTarget = Target.Client;
		} else if (arch === Arch.Server) {
			desiredTarget = Target.Server;
		}

		const sourcePlume = new SourcePlume();
		const sourceBuffer = new SourceBuffer();
		let target = Target.Any;
		let codeState = CodeState.Code;
		let brackets;

		for (let i = 0; i < source.length; i++) {
			sourcePlume.pushString(source.charAt(i));
			sourceBuffer.pushString(source.charAt(i));

			switch (target) {
				case Target.Any: {
					if (sourcePlume.endsWith(SourceProcessorWords.MeteorIsClientBegin)) {
						target = Target.Client;
						codeState = CodeState.Code;
						brackets = 1;
						sourceBuffer.changeSizeWithDelta(-SourceProcessorWords.MeteorIsClientBegin.length);
					}
					else if (sourcePlume.endsWith(SourceProcessorWords.MeteorIsServerBegin)) {
						target = Target.Server;
						codeState = CodeState.Code;
						brackets = 1;
						sourceBuffer.changeSizeWithDelta(-SourceProcessorWords.MeteorIsServerBegin.length);
					}
					break;
				} // case
				case Target.Client:
				case Target.Server: {
					if (codeState === CodeState.SingleLineComment) {
						if (sourcePlume.endsWith(SourceProcessorWords.CloseSingleLineComment)) {
							codeState = CodeState.Code;
						}
					}
					else if (codeState === CodeState.MultiLineComment) {
						if (sourcePlume.endsWith(SourceProcessorWords.CloseMultiLineComment)) {
							codeState = CodeState.Code;
						}
					}
					else if (codeState === CodeState.Code) {
						if (sourcePlume.endsWith(SourceProcessorWords.OpenSinleLineComment)) {
							codeState = CodeState.SingleLineComment;
						}
						else if (sourcePlume.endsWith(SourceProcessorWords.OpenMultiLineComment)) {
							codeState = CodeState.MultiLineComment;
						}
						else if (sourcePlume.endsWith(SourceProcessorWords.OpenBracket)) {
							brackets++;
						}
						else if (sourcePlume.endsWith(SourceProcessorWords.CloseBracket)) {
							brackets--;
							if (brackets <= 0) {
								sourceBuffer.changeSizeWithDelta(-SourceProcessorWords.CloseBracket.length);
								target = Target.Any;
								codeState = CodeState.Code;
								break;
							}
						}
					}
					if (target !== desiredTarget) {
						sourceBuffer.changeSizeWithDelta(-1);
					}
					break;
				} // case
			} // switch
		} // for

		return sourceBuffer.buildString();
	} // method
} // class

//==================================================================================================
// Exports
//==================================================================================================

module.exports = {
	Arch: Arch,
	transform: (source, arch) => {
		const sourceProcessor = new SourceProcessor();
		return sourceProcessor.processSource(source, arch);
	}
};

// EOF