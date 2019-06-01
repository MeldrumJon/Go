import * as comm from './comm.js'

var gameTitle = 'Go';
function blinkTitle(message) {
  var intervalID = null;

  function blink() {
    document.title = document.title == message ? gameTitle : message;
  }
  function clear() {
    if (intervalID !== null) {
      clearInterval(intervalID);
    }
    intervalID = null;
    document.title = gameTitle;
    window.onmousemove = null;
  };

  clear();
  blink();
  intervalID = setInterval(blink, 1000);
  window.onmousemove = function () {
    if (document.hasFocus()) {
      clear();
    }
  }
};

const VACANT_POINT_IMG = 'res/invis.png';
const WHITE_STONE_IMG = 'res/white.svg';
const BLACK_STONE_IMG = 'res/black.svg';
const WHITE_SELECTED_IMG = 'res/white_selected.svg';
const BLACK_SELECTED_IMG = 'res/black_selected.svg';

const GUI_BOARD19 = {
	image: 'res/board19x19.svg',
	spacing: 25,
	start_x: 18,
	start_y: 18
}

const GUI_BOARD13 = {
	image: 'res/board13x13.svg',
	spacing: 37,
	start_x: 21,
	start_y: 21
}

const GUI_BOARD9 = {
	image: 'res/board9x9.svg',
	spacing: 50,
	start_x: 42,
	start_y: 42
}

function img_hoverstart(img, board, x, y) {
	try {
		Weiqi.play(board.game, board.player, [x, y]);
	} catch {
		return;
	} // Don't display possible move if move is illegal.

	img.src = (board.player === 'black') ? BLACK_STONE_IMG : WHITE_STONE_IMG;
	img.style.opacity = 0.5;
	img._isHovering = true;
}

function img_hoverend(img, board, x, y) {
	if (img._isHovering === true) {
		img.src = VACANT_POINT_IMG;
		img.style.opacity = 1;
		img._isHovering = false;
	}
}

function img_click(img, board, x, y) {
	img_hoverend(img, board, x, y);
	board.play(board.player, x, y);
}

export default class Board {
	_redraw() {
		let array = Weiqi.toArray(this.game);
		for (let j = 0; j < this.size; ++j) {
			for (let i = 0; i < this.size; ++i) {
				this.imgs[i][j].style.opacity = 1;
				if (array[i][j] === '.') {
					this.imgs[i][j].src = VACANT_POINT_IMG;
				} else if (array[i][j] === 'x') {
					this.imgs[i][j].src = BLACK_STONE_IMG;
				} else if (array[i][j] === 'o') {
					this.imgs[i][j].src = WHITE_STONE_IMG;
				}
			}
		}

		if (this.last_move) {
			this.lastMove_img.style.top = this.gui.start_y - this.gui.spacing / 2 
					+ this.gui.spacing * this.last_move.y + 'px';
			this.lastMove_img.style.left = this.gui.start_x - this.gui.spacing / 2 + 
					this.gui.spacing * this.last_move.x + 'px';
			this.lastMove_img.src = (this.last_move.color === 'black') ? BLACK_SELECTED_IMG : WHITE_SELECTED_IMG;
			this.lastMove_img.style.display = 'inline-block';
		}
		else {
			this.lastMove_img.style.display = 'none';
		}
	}

	constructor(container, size, callbacks, online = true, player = 'black') {
		if (!(size === 9 || size === 13 || size === 19)) {
			throw 'Unsupported board size!';
		}
		this.size = size;
		this.game = Weiqi.createGame(size);
		this.player = player;
		this.online = online;
		this.callbacks = callbacks;
		this.last_move = null;

		this.gui = (size === 9) ? GUI_BOARD9 : (size === 13) ? GUI_BOARD13 : GUI_BOARD19;

		container.style.backgroundImage = 'url(' + this.gui.image + ')'

		this.imgs = new Array(size);
		for (let i = 0; i < this.imgs.length; ++i) {
			this.imgs[i] = new Array(size);
		}

		let y = this.gui.start_y - this.gui.spacing / 2;
		for (let j = 0; j < size; ++j) {
			let x = this.gui.start_x - this.gui.spacing / 2;
			for (let i = 0; i < size; ++i) {
				let img = new Image(this.gui.spacing, this.gui.spacing);
				img.src = VACANT_POINT_IMG;
				img.style.position = 'absolute';
				img.style.top = y + 'px';
				img.style.left = x + 'px';

				img.onclick = () => {
					img_click(img, this, i, j);
				};
				img.onmouseenter = () => {
					img_hoverstart(img, this, i, j);
				}
				img.onmouseleave = () => {
					img_hoverend(img, this, i, j);
				}

				this.imgs[i][j] = img;
				container.append(img);

				x += this.gui.spacing;
			}
			y += this.gui.spacing;
		}

		this.lastMove_img = new Image(this.gui.spacing, this.gui.spacing);
		this.lastMove_img.src = BLACK_SELECTED_IMG;
		this.lastMove_img.style.position = 'absolute';
		this.lastMove_img.style.display = 'none';
		container.append(this.lastMove_img);
	}

	play(color, x, y) {
		try {
			this.game = Weiqi.play(this.game, color, [x, y]);
		} catch (e) {
			console.log(e);
			return;
		}
	
		this.last_move = {
			color: color,
			x: x,
			y: y
		};
		this._redraw();

		if (!this.online) {
			this.player = (this.player === 'black') ? 'white' : 'black';
		}
		else if (color === this.player) {
			comm.send('Play', {
				color: this.player,
				x: x,
				y: y
			});
		}

		if (color === 'black') {
			if (typeof this.callbacks.onBlackMove === 'function') {
				this.callbacks.onBlackMove();
			}
		} else if (color === 'white') {
			if (typeof this.callbacks.onWhiteMove === 'function') {
				this.callbacks.onWhiteMove();
			}
		}

		if (Weiqi.isOver(this.game)) {
			if (typeof this.callbacks.onGameOver === 'function') {
				this.callbacks.onGameOver();
			}
		}

		if (this.online && color !== this.player) {
			if (Weiqi.isOver(this.game)) {
				blinkTitle('Gameover!');
			}
			else {
				blinkTitle('Your move!');
			}
		}
	}

	pass(color) {
		try {
			this.game = Weiqi.pass(this.game, color);
		} catch (e) {
			console.log(e);
			return;
		}

		this.last_move = null;
		this._redraw();

		if (!this.online) {
			this.player = (this.player === 'black') ? 'white' : 'black';
		}
		else if (color === this.player) {
			comm.send('Pass', {
				color: this.player
			});
		}

		if (color === 'black') {
			if (typeof this.callbacks.onBlackPass === 'function') {
				this.callbacks.onBlackPass();
			}
		} else if (color === 'white') {
			if (typeof this.callbacks.onWhitePass === 'function') {
				this.callbacks.onWhitePass();
			}
		}

		if (Weiqi.isOver(this.game)) {
			if (typeof this.callbacks.onGameOver === 'function') {
				this.callbacks.onGameOver();
			}
		}

		if (this.online && color !== this.player) {
			if (Weiqi.isOver(this.game)) {
				blinkTitle('Gameover!');
			}
			else {
				blinkTitle('Your move!');
			}
		}
	}

	isGameOver() {
		return Weiqi.isOver(this.game);
	}

	score() {
		let s = Weiqi.areaScore(this.game);
		return s;
	}
}