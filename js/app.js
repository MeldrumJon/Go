import * as notify from './notify.js';
import * as storage from './storage.js';
import PeerCom from './PeerCom.js';
import GoBoard from './GoBoard.js';

const elBody = document.getElementById('go_board_game');

// Board
const elGame = document.getElementById('game');
const elBoard = document.getElementById('board');
const elBtnPass = document.getElementById('btnPass');

const elBtnChat = document.getElementById('btnChat');
const elBtnSettings = document.getElementById('btnSettings');

const elSndPass = document.getElementById('sndPass');
const elSndMove = document.getElementById('sndMove');

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

// Chat
const elMessages = document.getElementById('bubbles');
const elTxtMsg = document.getElementById('txtMsg');
const elBtnSendMsg = document.getElementById('btnSendMsg');

// Controls
const elBtnUndo = document.getElementById('btnUndo');
const elChkNotiSound = document.getElementById('chkNotiSound');
const elChkNotiPush = document.getElementById('chkNotiPush');

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

    let moveNoti = null;
    let msgNoti = null;

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
                if (board.playerTurn() !== player || board.isGameOver()) {
                    elBtnPass.disabled = true;        
                }
                else {
                    elBtnPass.disabled = false;
                }
            }
            if (storage.getItem('notiSound') === 'enabled') {
                if (move.pass) { notify.playSound(elSndPass); }
                else { notify.playSound(elSndMove); }
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

        if (online && board.playerTurn() !== player) {
            elBtnPass.disabled = true;        
        }

        elBody.classList.add(online ? 'play_online' : 'play_local');
    }

    // DOM
    let resize = function () {
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
        elMessages.scrollTop = elMessages.scrollHeight;

        if (board) { board.resize(); }
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
        if (board) { board.pass(board.player); }
    });
    elBtnChat.addEventListener('click', function () {
        elBody.classList.toggle('chat');
        if (elBody.classList.contains('chat')) {
            elBody.classList.remove('unread');
        }
        resize();
    });
    elBtnSettings.addEventListener('click', function () {
        elBody.classList.toggle('settings');
        resize();
    });
    elBtnCloseGameover.addEventListener('click', function () {
        hideModals();
    });
    elBtnSendMsg.addEventListener('click', function() {
        let msg = elTxtMsg.value;
        console.log(msg);
        elTxtMsg.value = '';
        if (msg.replace(/\s/g, '').length) {
            peerCom.send('Message', msg);
            let html = '';
            html += '<div class="sent">';
            html += '<span class="person">You</span>';
            html += '<span class="content"><span>' + msg + '</span></span>';
            html += '</div>';
            elMessages.innerHTML += html;
        }
        elMessages.scrollTop = elMessages.scrollHeight;
    });
    elTxtMsg.addEventListener('keypress', function (evt) {
        if (evt.keyCode === 13 && !evt.shiftKey) {
            evt.preventDefault();
            elBtnSendMsg.click();
        }
    });
    elBtnUndo.addEventListener('click', function (evt) {
        if (board) { board.undo(); }
    });
    elChkNotiSound.addEventListener('change', function(evt) {
        if (elChkNotiSound.checked) {
            storage.setItem('notiSound', 'enabled');
        }
        else {
            storage.setItem('notiSound', 'disabled');
        }
    });
    if (storage.getItem('notiSound') === 'enabled') {
        elChkNotiSound.checked = true;
    }
    else {
        elChkNotiSound.checked = false;
    }
    elChkNotiPush.addEventListener('change', function(evt) {
        if (elChkNotiPush.checked && notify.pushStatus() !== 'granted') {
            let callback = function (permission) {
                if (permission === 'granted') {
                    storage.setItem('notiPush', 'enabled');
                }
                else if (permission === 'denied') {
                    elChkNotiPush.checked = false;
                    elChkNotiPush.disabled = true;
                }
            };
            notify.pushAsk(callback);
        }
        else {
            if (elChkNotiPush.checked) {
                storage.setItem('notiPush', 'enabled');

            }
            else {
                storage.setItem('notiPush', 'disabled');
            }
        }
    });
    if (notify.pushStatus() === 'denied') { // disable
        elChkNotiPush.checked = false;
        elChkNotiPush.disabled = true;
    }
    else {
        if (storage.getItem('notiPush') === 'enabled') {
            elChkNotiPush.checked = true;
        }
        else {
            elChkNotiPush.checked = false;
        }
    }
    window.addEventListener('beforeunload', function (evt) {
        if (!board || !board.online || board.isGameOver() || !peerCom.isConnected) {
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

        peerWait.classList.toggle('hide');
        peerShow.classList.toggle('hide');
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

    // Chat
    peerCom.addReceiveHandler('Message', function(msg) {
        let html = '';
        html += '<div class="received">';
        html += '<span class="person">Opponent</span>';
        html += '<span class="content"><span>' + msg + '</span></span>';
        html += '</div>';
        elMessages.innerHTML += html;
        elMessages.scrollTop = elMessages.scrollHeight;
        if (!document.hasFocus()) {
            if (storage.getItem('notiPush') === 'enabled') {
                let noti = notify.pushNotify('New Message', 'Opponent: ' + msg);
                window.setTimeout(noti.close.bind(noti), 5000);
            }
        }
        if (!elBody.classList.contains('chat')) {
            elBody.classList.add('unread');
        }
    });

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
    let notiMove = null;
    peerCom.addReceiveHandler('Move', function (move) {
        if (move.pass) {
            if (board) { board.pass(move.color); }
        }
        else {
            if (board) { board.play(move.color, move.x, move.y); }
        }
        if (!document.hasFocus()) {
            if (storage.getItem('notiPush') === 'enabled') {
                notiMove = notify.pushNotify('Your Move');
            }
        }
    });
    window.addEventListener('focus', function(evt) {
        if (notiMove) { notiMove.close(); }
    });

}
main();
