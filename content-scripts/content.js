chrome.runtime.onMessage.addListener((_message, _sender, response) => {
	const vocabData = getVocabData();
	if (!vocabData) {
		const kanjiData = getKanjiData();
		if (!kanjiData) {
			response(null);
		} else {
			response(kanjiData);
		}
	} else {
		response(vocabData);
	}
	return true;
});

function getVocabData() {
	const spellingNode = getSpellingNode();
	const pitchNode = getPitchAccentNode();
	const meaningNode = getMeaningNode();
	if (!spellingNode || !pitchNode || !meaningNode) {
		return null;
	}
	return {
		type: 'vocab',
		target: spellingNode.innerText,
		pitch: pitchNode.innerHTML,
		meaning: meaningNode.innerHTML
	};
}

function getSpellingNode() {
	let spellingNode = document.querySelector('.spelling .v')
	if (!spellingNode) {
		return null;
	}
	spellingNode = spellingNode.cloneNode(true);
	for (let furigana of spellingNode.querySelectorAll('rt')) {
		spellingNode.removeChild(furigana);
	}
	return spellingNode;
}

function getPitchAccentNode() {
	let pitchNode = document
		.querySelector('.subsection-pitch-accent div div');
	if (!pitchNode) {
		return null;
	}
	pitchNode = pitchNode.cloneNode(true)
    for (let reading of pitchNode.querySelectorAll(':scope > div')) {
    	reading.removeChild(reading.querySelector('a'));
    }
	return pitchNode;
}

function getMeaningNode() {
	let meaningNode = document.querySelector('.subsection-meanings');
	if (!meaningNode) {
		return null;
	}
	meaningNode = meaningNode.cloneNode(true);
	meaningNode.removeChild(meaningNode.querySelector('h6'));
	return meaningNode;
}

function getKanjiData() {
	const kanjiNode = getKanjiNode();
	const keywordNode = getKeywordNode();
	const mnemonicNode = getMnemonicNode();
	if (!kanjiNode || !keywordNode) {
		return null;
	}

	let mnemonic = "";
	if (mnemonicNode) {
		mnemonic = mnemonicNode.innerHTML
	}

	return {
		type: 'kanji',
		strokes: kanjiNode.innerHTML,
		keyword: keywordNode.innerText,
		mnemonic: mnemonic
	}
}

function getKanjiNode() {
	return document.querySelector('.kanji.plain');
}

function getKeywordNode() {
	return document.querySelector('.result.kanji div .vbox.gap div div');
}

function getMnemonicNode() {
	return document.querySelector('.mnemonic');
}
