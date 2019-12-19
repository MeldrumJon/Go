import * as notify from './notify.js';
import PeerCom from './PeerCom.js';
import GoBoard from './GoBoard.js';

const elBody = document.getElementById('go_board_game');

// Board
const elGame = document.getElementById('game');
const elBoard = document.getElementById('board');
const elBtnPass = document.getElementById('btnPass');

const elBtnChat = document.getElementById('btnChat');
const elBtnSettings = document.getElementById('btnSettings');

// Forms
const elRad9 = document.getElementById('rad9');
const elRad13 = document.getElementById('rad13');
const elRad19 = document.getElementById('rad19');

const elBtnOnline = document.getElementById('btnOnline');
const elBtnLocal = document.getElementById('btnLocal');
const elBtnCloseGameover = document.getElementById('btnCloseGameover');
const elBtnCopyUrl = document.getElementById('btnCopyUrl');

const elMsgUrl = document.getElementById('msgUrl');
const elMsgResult = document.getElementById('msgResult');

const elPeerShow = document.getElementById('peerShow');
const elPeerWait = document.getElementById('peerWait');

const MODALS = [
    'mod_gameselect',
    'mod_shareurl',
    'mod_waiting',
    'mod_disconnected',
    'mod_gameover',
];

let showModal = function (name) {
    elBody.classList.add('shade');
    for (let i = 0, len = MODALS.length; i < len; ++i) {
        elBody.classList.remove(MODALS[i]);
    }
    elBody.classList.add(name);
}

let hideModals = function () {
    elBody.classList.remove('shade');
    for (let i = 0, len = MODALS.length; i < len; ++i) {
        elBody.classList.remove(MODALS[i]);
    }
}

let main = function () {
    let board;
    let mstGridSize = 19; // default
    let peerCom = new PeerCom();

    let play = function (size, online=false, player='black') {
        let onmove = function (evt) {
            let move = evt.detail;
            let str = '';
            if (move.color === 'white') {
                str += 'Black to move';
                str += (move.pass) ? ' (white passed).' : '.';
            }
            else if (move.color === 'black') {
                str += 'White to move';
                str += (move.pass) ? ' (black passed).' : '.';
            }
            notify.setTitle('Go • ' + str);
            if (online) {
                if (move.color === player) {
                    peerCom.send('Move', move);
                }
                else {
                    let txt = board.isGameOver() ? 'Gameover!' : 'Your move!';
                    notify.flashTitle(txt);
                }
            }
        }
        let ongameover = function (evt) {
            let score = board.score();
            let msg = '';
            if (score.black > score.white) { msg = 'Black wins!'; }
            else if (score.white > score.black) { msg = 'White wins!'; }
            else { msg = 'Draw!'; }
            msg += '<br/>(Black: ' + score.black + '. White: ' + score.white + '.)';
            elMsgResult.innerHTML = msg;
            showModal('mod_gameover');
        }

        if (board) { // Remove event listeners for last board.
            board.removeEventListener('move', onmove);
            board.removeEventListener('gameover', ongameover);
        }

        board = new GoBoard(elBoard, size, online, player);
        console.log(size + 'x' + size);
    
        board.addEventListener('move', onmove);
        board.addEventListener('gameover', ongameover);
    }

    // DOM
    let resize = function () {
        let winWidth = window.innerWidth;
        let winHeight = window.innerHeight;
        let availWidth = elGame.clientWidth;
        let availHeight = elGame.clientHeight;
        let btnWidth = elBtnPass.clientWidth + 2*(2 + 5); // borders + margin + extra
        let btnHeight = elBtnPass.clientHeight + 2*(2 + 5);

        elBoard.style.margin = '0';
        let size;
        if (availHeight > availWidth) { // portrait
            size = availWidth;

            if ((size + 2*btnHeight) < availHeight) {
                elBoard.style.marginBottom = btnHeight + 'px';
            }
            else if ((size + btnHeight) > availHeight) {
                size = availHeight - btnHeight;
                let test = availWidth - btnWidth; // test landscape JIC
                if (test > size) {
                    size = test;
                }
            }
        }
        else { // landscape
            size = availHeight;

            console.log(btnWidth);

            if ((size + 2*btnWidth) < availWidth) {
                elBoard.style.marginLeft = btnWidth + 'px';
            }
            else if ((size + btnWidth) > availWidth) {
                size = availWidth - btnWidth;
                let test = availHeight - btnHeight; // test portrait JIC
                if (test > size) {
                    size = test;
                }
            }
        }

        size -= 2; // borders
        let sizestr = size + 'px';
        elBoard.style.width = sizestr;
        elBoard.style.height = sizestr;

    };
    window.addEventListener('resize', resize);
    resize();

    let sizeChange = function (evt) {
        mstGridSize = parseInt(evt.target.value, 10);
    };
    elRad9.addEventListener('change', sizeChange);
    elRad13.addEventListener('change', sizeChange);
    elRad19.addEventListener('change', sizeChange);
    // DOM
    elBtnOnline.addEventListener('click', function () {
        showModal('mod_shareurl');
    });
    elBtnLocal.addEventListener('click', function () {
        play(mstGridSize, false, 'black');
        hideModals();
    });
    elMsgUrl.addEventListener('click', function () {
        window.getSelection().selectAllChildren(elMsgUrl);
    });
    elBtnCopyUrl.addEventListener('click', function () {
        window.getSelection().selectAllChildren(elMsgUrl);
        document.execCommand('copy');
    });
    elBtnPass.addEventListener('click', function () {
        board.pass(board.player);
    });
    elBtnChat.addEventListener('click', function () {
        elBody.classList.toggle('chat');
        resize();
    });
    elBtnSettings.addEventListener('click', function () {
        elBody.classList.toggle('settings');
        resize();
    });
    elBtnCloseGameover.addEventListener('click', function () {
        hideModals();
    });
    window.addEventListener('beforeunload', function (evt) {
        if (!board.online || board.isGameOver() || !peerCom.isConnected) {
            return undefined; // Game is not active
        }
        evt.preventDefault();
        let msg = 'If you leave the page, you will be disconnected.';
        evt.returnValue  = msg;
        return msg;
    });


    // Peer2Peer
    let onwait = function (evt) {
        let id = evt.detail.id;
        let peerUrl = new URL(window.location.href);
        peerUrl.searchParams.append('peerId', id);

        console.log('Have peer connect to: ' + peerUrl);
        elMsgUrl.innerHTML = peerUrl.href;

        peerWait.style.display = 'none';
        peerShow.style.display = 'flex';
    }

    let onmasterconnected = function () {
        console.log('Peer connected');
        peerCom.send('Start', mstGridSize)
        play(mstGridSize, true, 'black');
        hideModals();
    }

    let onslaveconnected = function () {
        console.log('Peer connected');
    }

    let ondisconnected = function () {
        console.log('Peer disconnected')
        showModal('mod_disconnected');
    }
    peerCom.addEventListener('wait', onwait);
    peerCom.addEventListener('masterconnected', onmasterconnected);
    peerCom.addEventListener('slaveconnected', onslaveconnected);
    peerCom.addEventListener('disconnected', ondisconnected);

    let peerId = new URLSearchParams(window.location.search).get('peerId');;
    if (peerId !== null) {
        peerCom.addReceiveHandler('Start', function (gridSize) {
            play(gridSize, true, 'white');
            hideModals();
        });
        peerCom.begin(peerId);
        showModal('mod_waiting');
    } else {
        peerCom.begin();
        showModal('mod_gameselect');
    }
    peerCom.addReceiveHandler('Move', function (move) {
        if (move.pass) {
            board.pass(move.color);
        }
        else {
            board.play(move.color, move.x, move.y);
        }
    });

}
main();
