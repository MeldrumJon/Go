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

function getSelectedBoardSize() {
	return parseInt(
		document.querySelector('input[name="board_size"]:checked').value
	);
}

function setup(size, online = 'false', player = 'black') {
	console.log(size);

	const container = document.getElementById('board');
	const turnArea = document.getElementById('turn');
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
			turnArea.innerHTML = 'Black to move (white passed).';
		},
		onBlackPass: () => {
			turnArea.innerHTML = 'White to move (black passed).';
		},
		onGameOver: () => {
			let score = board.score();
			turnArea.innerHTML = 'Black: ' + score.black + '. White: ' + score.white + '.';
			alert(
				'Black: ' + score.black + '\n' 
				+ 'White: ' + score.white
			);
		}
	}
	board = new Board(container, size, callbacks, online, player);

	passBtn.onclick = function () {
		board.pass(board.player);
	}

	comm.addReceiveHandler('Play', (data) => {
		board.play(data.color, data.x, data.y);
	});
	comm.addReceiveHandler('Pass', (data) => {
		board.pass(data.color);
	});

	// Alert if user might disconnect from game.
	if (online) {
		window.addEventListener("beforeunload", function (e) {
		  if (board.isGameOver() || !comm.isConnected) {
			  return undefined;
		  }
		  var confirmationMessage = 'If you leave the page, you will be disconnected.';
		  (e || window.event).returnValue = confirmationMessage; //Gecko + IE
		  return confirmationMessage; //Gecko + Webkit, Safari, Chrome etc.
		});
	  }
}

function main() {

	let callbacks = {
		'wait': (id) => {
			const shareURLEl = document.getElementById('share_url');
			shareURLEl.innerHTML = PeerID2URL(id).href;
			console.log('Have peer connect to: ' + PeerID2URL(id));
		},
		'mst_connected': () => {
			let size = getSelectedBoardSize();
			comm.send('Start', size)
			console.log('Peer connected');
			fsm('CONNECTED');
			setup(size, true, 'black');
		},
		'slv_connected': (metadata) => {
			console.log('Peer connected', metadata);
			// Wait for start signal
		},
		'disconnected': () => {
			console.log('Peer disconnected')
			fsm('DISCONNECTED');
		}
	};
	var peerID = URL2PeerID();

	if (peerID !== null) {
		comm.init(callbacks, peerID);
		fsm('INIT_PEER');

		comm.addReceiveHandler('Start', (data) => {
			fsm('CONNECTED');
			setup(data, true, 'white');
		});
	} else {
		comm.init(callbacks);
		fsm('INIT_HOST');
	}

	const playOnlineEl = document.getElementById('play_online');
	const playLocalEl = document.getElementById('play_local');
	playOnlineEl.onclick = function () {
		fsm('ONLINE');
	}
	playLocalEl.onclick = function () {
		setup(getSelectedBoardSize(), false, 'black');
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