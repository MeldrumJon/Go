import fsm from './fsm.js'
import * as comm from './comm.js'
import Board from './board.js'

function logBoard(weiqiArr, size) {
	let str = '';
	for (let j = 0; j < size; ++j) {
		for (let i = 0; i < size; ++i) {
			str = str + weiqiArr[i][j];
		}
		str = str + '\n';
	}
	return str;
}

/**
 * Gets the peer ID we want to connect to from the URL.
 */
function URL2PeerID() {
	let params = new URLSearchParams(window.location.search);
	let peerID = params.get('peerID');
	return peerID;
}

/**
 * Returns a URL containing a peerID parameter.
 * @param {String} id 
 */
function PeerID2URL(id) {
	let url = new URL(window.location.href);
	url.searchParams.append('peerID', id);
	return url;
}

function setup(online = 'false', player = 'black') {
	const container = document.getElementById('board');
	const turnArea = document.getElementById('turn_area');
	const passBtn = document.getElementById('pass_btn');

	let board;
	let callbacks = {
		onWhiteMove: () => {
			turnArea.innerHTML = 'Black to move.';
		},
		onBlackMove: () => {
			turnArea.innerHTML = 'White to move.';
		},
		onWhitePass: () => {
			turnArea.innerHTML = '<b>White passed.</b> Black to move.';
		},
		onBlackPass: () => {
			turnArea.innerHTML = '<b>Black passed.</b> White to move';
		},
		onGameOver: () => {
			let score = board.score();
			turnArea.innerHTML = 'Gameover. Black: ' + score.black + '. White: ' + score.white + '.';
		}
	}
	board = new Board(container, 9, callbacks, online, player);

	passBtn.onclick = function () {
		board.pass(board.player);
	}

	comm.addReceiveHandler('Play', (data) => {
		board.play(data.color, data.x, data.y);
	});
	comm.addReceiveHandler('Pass', (data) => {
		board.pass(data.color);
	});
}

function main() {
	let callbacks = {
		'wait': (id) => {
			const shareURLEl = document.getElementById('share_url');
			shareURLEl.innerHTML = PeerID2URL(id).href;
			console.log('Have peer connect to: ' + PeerID2URL(id));
		},
		'mst_connected': () => {
			console.log('Peer connected');
			setup(true, 'black');
			fsm('CONNECTED');
		},
		'slv_connected': () => {
			console.log('Peer connected');
			setup(true, 'white');
			fsm('CONNECTED');
		},
		'disconnected': () => {
			console.log('Peer disconnected')
			fsm('DISCONNECTED');
		}
	};
	var peerID = URL2PeerID();
	comm.init(callbacks, peerID);

	if (peerID !== null) {
		fsm('INIT_PEER');
	} else {
		fsm('INIT_HOST');
	}

	const playOnlineEl = document.getElementById('play_online');
	const playLocalEl = document.getElementById('play_local');
	playOnlineEl.onclick = function () {
		fsm('ONLINE');
	}
	playLocalEl.onclick = function () {
		setup(false, 'black');
		fsm('LOCAL');
	}

	/*** Select and copy share URL ***/
	const shareURL = document.getElementById('share_url');
	const copyBtn = document.getElementById('copy_btn');
	// Select Share URL
	shareURL.onclick = function () {
		window.getSelection().selectAllChildren(shareURL);
	}
	// Copy Share URL
	copyBtn.onclick = function () {
		window.getSelection().selectAllChildren(shareURL);
		document.execCommand('copy');
	}
}
main();