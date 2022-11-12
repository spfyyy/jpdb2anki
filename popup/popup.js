const popup = document.querySelector('#popup');

function requestAnki(action, version, params = {}) {
	return new Promise((resolve, reject) => {
		const xhr = new XMLHttpRequest();
		xhr.addEventListener('error', () => reject('failed to issue request'));
		xhr.addEventListener('load', () => {
			try {
				const response = JSON.parse(xhr.responseText);
				if (Object.getOwnPropertyNames(response).length != 2) {
					throw 'response has an unexpected number of fields';
				}
				if (!response.hasOwnProperty('error')) {
					throw 'response is missing required error field';
				}
				if (!response.hasOwnProperty('result')) {
					throw 'response is missing required result field';
				}
				if (response.error) {
					throw response.error;
				}
				resolve(response.result);
			} catch (e) {
				reject(e);
			}
		});

		xhr.open('POST', 'http://localhost:8765');
		xhr.send(JSON.stringify({ action, version, params }));
	});
}

function updatePopupToWaitingForDataState() {
	if (!popup) {
		return;
	}
	popup.innerHTML = 'trying to parse JPDB page...';
}

function updatePopupToUnableToExtractDataState() {
	if (!popup) {
		return;
	}
	popup.innerHTML = 'unable to extract card information from this page';
}

function updatePopupToCardPresentationState(cardData) {
	if (!popup) {
		return;
	}

	if (cardData.type === 'vocab') {
		updatePopupToVocabCardPresentationState(cardData);
	} else if (cardData.type == 'kanji') {
		updatePopupToKanjiCardPresentationState(cardData);
	} else {
		updatePopupToUnableToExtractDataState();
	}
}

function updatePopupToVocabCardPresentationState(cardData) {
	const targetNode = document.createElement('h1');
	targetNode.appendChild(document.createTextNode(cardData.target));

	const pitchNode = document.createElement('div');
	pitchNode.innerHTML = cardData.pitch;

	const meaningNode = document.createElement('div');
	meaningNode.innerHTML = cardData.meaning;

	const buttonNode = document.createElement('button');
	buttonNode.innerText = 'Create Vocab Card';
	buttonNode.onclick = () => addVocabToAnki(cardData);

	popup.innerHTML = '';
	popup.appendChild(targetNode);
	popup.appendChild(pitchNode);
	popup.appendChild(meaningNode);
	popup.appendChild(buttonNode);
}

function updatePopupToKanjiCardPresentationState(cardData) {
	const keywordNode = document.createElement('h1');
	keywordNode.innerText = cardData.keyword;

	const kanjiNode = document.createElement('div');
	kanjiNode.innerHTML = cardData.strokes;

	const menmonicNode = document.createElement('div');
	menmonicNode.innerHTML = cardData.mnemonic;

	const buttonNode = document.createElement('button');
	buttonNode.innerText = 'Create Kanji Card';
	buttonNode.onclick = () => addKanjiToAnki(cardData);

	popup.innerHTML = '';
	popup.appendChild(keywordNode);
	popup.appendChild(kanjiNode);
	popup.appendChild(menmonicNode);
	popup.appendChild(buttonNode);
}

function extractCardDataFromPage() {
	return new Promise((resolve, reject) => {
		const activeTabDescription = {
			active: true,
			currentWindow: true
		};
		chrome.tabs.query(activeTabDescription, tabs => {
			chrome.tabs.sendMessage(tabs[0].id, {}).then(result => {
				if (result) {
					resolve(result);
				} else {
					reject(null);
				}
			});
		});
	});
}

async function addVocabToAnki(cardData) {
	try {
		await requestAnki('guiAddCards', 6, {
			note: {
				deckName: 'Hanahira',
				modelName: 'Japanese Vocab',
				fields: {
					Target: cardData.target,
					Reading: cardData.pitch,
					Definition: cardData.meaning
				}
			}
		});
	} catch (e) {
		window.alert(e);
	}
}

async function addKanjiToAnki(cardData) {
	try {
		await requestAnki('guiAddCards', 6, {
			note: {
				deckName: 'Kanji',
				modelName: 'Japanese Kanji',
				fields: {
					Keyword: cardData.keyword,
					'Stroke Order': cardData.strokes,
					Mnemonic: cardData.mnemonic
				}
			}
		});
	} catch (e) {
		window.alert(e);
	}
}

async function run() {
	updatePopupToWaitingForDataState();

	let cardData;
	try {
		cardData = await extractCardDataFromPage();
	} catch (exception) {
		cardData = null;
	}

	if (!cardData) {
		updatePopupToUnableToExtractDataState();
	} else {
		updatePopupToCardPresentationState(cardData);
	}
}

run();
