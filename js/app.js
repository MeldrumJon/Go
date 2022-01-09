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
const elChkBoardSize = document.getElementById('chkBoardSize');
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
    let peerId = new URLSearchParams(window.location.search).get('peerId');
    let peerCom = new PeerCom();

    if (peerId !== null) {
        console.log('I am slave');
        peerCom.begin(peerId);
        showModal('mod_waiting');
    } else {
        console.log('I am master');
        peerCom.begin();
        showModal('mod_gameselect');
    }

    let board = null;

    let start = function () {
        console.log(board.gridSize + 'x' + board.gridSize);
    
        let onmove = function (evt, skipSend=false) {
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
            if (board.online) {
                if (move.color === board.player) {
                    if (!skipSend) { peerCom.send('Move', move); }
                }
                else {
                    notify.flashTitle('Your move!');
                }
                if (board.playerTurn() !== board.player) {
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
            notify.setTitle('Go • ' + msg);
            msg += '<br/>(Black: ' + score.black + '. White: ' + score.white + '.)';
            
            if (board.online) {
                notify.flashTitle('Gameover!');
            }
            elBtnPass.disabled = true;        
    
            elMsgResult.innerHTML = msg;
            showModal('mod_gameover');
        }
    
        board.addEventListener('move', onmove);
        board.addEventListener('gameover', ongameover);
    
        // Update Modals/Titles if this game is continued after a refresh
        let last_move = board.movesList[board.movesList.length-1];
        if (board.isGameOver()) {
            ongameover();
        }
        else if (last_move) {
            onmove({detail: last_move}, true);
        }
        else if (board.playerTurn() === 'black') {
            notify.setTitle('Go • ' + 'Black to move.');
        }
        else {
            notify.setTitle('Go • ' + 'White to move.');
        }
    
        if (board.playerTurn() !== board.player || board.isGameOver()) {
            elBtnPass.disabled = true;        
        }
    
        elBody.classList.add(board.online ? 'play_online' : 'play_local');
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
    //resize(); // Not necessary because of setBoardSize() below

    let uiGridSize = 19;
    let sizeChange = function (evt) {
        uiGridSize = parseInt(evt.target.value, 10);
    };
    elRad9.addEventListener('change', sizeChange);
    elRad13.addEventListener('change', sizeChange);
    elRad19.addEventListener('change', sizeChange);

    elBtnOnline.addEventListener('click', function () {
        showModal('mod_shareurl');
    });

    elBtnLocal.addEventListener('click', function () {
        board = new GoBoard(elBoard, uiGridSize, false, 'black');
        start();
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

    let setBoardSize = function () {
        if (storage.getItem('boardSize') === 'disabled') {
            elBoard.style.maxWidth = '';
            elBoard.style.maxHeight = '';
        }
        else {
            elBoard.style.maxWidth = '640px';
            elBoard.style.maxHeight = '640px';
        }
        resize();
    };
    elChkBoardSize.addEventListener('change', function(evt) {
        let status = elChkBoardSize.checked ? 'enabled' : 'disabled';
        storage.setItem('boardSize', status);
        setBoardSize();
    });
    elChkBoardSize.checked = !(storage.getItem('boardSize') === 'disabled');
    setBoardSize();

    elChkNotiSound.addEventListener('change', function(evt) {
        let status = elChkNotiSound.checked ? 'enabled' : 'disabled';
        storage.setItem('notiSound', status);
    });
    elChkNotiSound.checked = (storage.getItem('notiSound') === 'enabled');

    elChkNotiPush.addEventListener('change', function(evt) {
        if (notify.pushStatus() !== 'granted' && elChkNotiPush.checked) {
            notify.pushAsk(function (permission) {
                if (permission === 'granted') {
                    storage.setItem('notiPush', 'enabled');
                }
                else if (permission === 'denied') {
                    elChkNotiPush.checked = false;
                    elChkNotiPush.disabled = true;
                }
            });
        }
        else {
            let status = elChkNotiPush.checked ? 'enabled' : 'disabled';
            storage.setItem('notiPush', status);
        }
    });
    if (notify.pushStatus() === 'denied') { // disable
        elChkNotiPush.checked = false;
        elChkNotiPush.disabled = true;
    }
    else {
        elChkNotiPush.checked = (storage.getItem('notiPush') === 'enabled');
    }

    // Peer2Peer
    peerCom.addEventListener('wait', function (evt) {
        let peerUrl = new URL(window.location.href);
        peerUrl.searchParams.set('peerId', evt.detail);

        console.log('Have peer connect to: ' + peerUrl);
        elMsgUrl.innerHTML = peerUrl.href;

        peerWait.classList.toggle('hide');
        peerShow.classList.toggle('hide');
    });

    peerCom.addEventListener('connectedpeer', function (evt) {
        console.log('A peer connected');

        if (!peerId) { // New game
            board = new GoBoard(elBoard, uiGridSize, true, 'black');
            start();
        }
        peerId = evt.detail;

        if (board) { // Send start signal to peer
            peerCom.send('Start', {
                gridSize: board.gridSize,
                player: (board.player === 'black') ? 'white' : 'black',
                pastMoves: board.movesList
            });
        }
        hideModals();

        // Append URL with peerId
        let peerUrl = new URL(window.location.href);
        peerUrl.searchParams.set('peerId', peerId);
        window.history.pushState({ path: peerUrl.href }, '', peerUrl.href);
    });

    peerCom.addEventListener('disconnected', function () {
        console.log('Peer disconnected')
        showModal('mod_disconnected');
    });

    // Peer2Peer Data
    // Games Start / Reconnect
    peerCom.addReceiveHandler('Start', function (obj) {
        board = new GoBoard(elBoard, obj.gridSize, true, obj.player);
        for (let i = 0, len = obj.pastMoves.length; i < len; ++i) {
            let move = obj.pastMoves[i];
            if (move.pass) {
                board.pass(move.color);
            }
            else {
                board.play(move.color, move.x, move.y);
            }
        }
        hideModals();
        start();
    });

    // Move
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
                // TODO: check game over?
                notiMove = notify.pushNotify('Your Move');
            }
        }
    });
    window.addEventListener('focus', function(evt) {
        if (notiMove) { notiMove.close(); }
    });

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
}

main();

