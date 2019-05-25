import * as comm from './comm.js'

const VACANT_POINT_IMG = 'res/invis.png';
const WHITE_STONE_IMG = 'res/white.svg';
const BLACK_STONE_IMG = 'res/black.svg'

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
	spacing: 55,
	start_x: 23,
	start_y: 23
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
		console.log(this.online);
		console.log(this.player);

		let gui = (size === 9) ? GUI_BOARD9 : (size === 13) ? GUI_BOARD13 : GUI_BOARD19;

		container.style.backgroundImage = 'url(' + gui.image + ')'

		this.imgs = new Array(size);
		for (let i = 0; i < this.imgs.length; ++i) {
			this.imgs[i] = new Array(size);
		}

		let y = gui.start_y - gui.spacing / 2;
		for (let j = 0; j < size; ++j) {
			let x = gui.start_x - gui.spacing / 2;
			for (let i = 0; i < size; ++i) {
				let img = new Image(gui.spacing, gui.spacing);
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

				x += gui.spacing;
			}
			y += gui.spacing;
		}
	}

	play(color, x, y) {
		try {
			this.game = Weiqi.play(this.game, color, [x, y]);
		} catch (e) {
			console.log(e);
			return;
		}
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
	}

	pass(color) {
		try {
			this.game = Weiqi.pass(this.game, color);
		} catch (e) {
			console.log(e);
			return;
		}

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
	}

	score() {
		let s = Weiqi.areaScore(this.game);
		return s;
	}
}