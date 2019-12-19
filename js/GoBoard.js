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

export default class GoBoard extends EventTarget {
    _redraw(latest_move) {
        let array = Weiqi.toArray(this.game);
        for (let j = 0; j < this.gridSize; ++j) {
            for (let i = 0; i < this.gridSize; ++i) {
                this.points[i][j].style.opacity = 1;
                if (array[i][j] === '.') {
                    this.points[i][j].src = VACANT_POINT_IMG;
                } else if (array[i][j] === 'x') {
                    this.points[i][j].src = BLACK_STONE_IMG;
                } else if (array[i][j] === 'o') {
                    this.points[i][j].src = WHITE_STONE_IMG;
                }
            }
        }

        if (!latest_move.pass) {
            this.lastMove_img.style.top = this.gui.start_y - this.gui.spacing / 2 
                    + this.gui.spacing * latest_move.y + 'px';
            this.lastMove_img.style.left = this.gui.start_x - this.gui.spacing / 2 + 
                    this.gui.spacing * latest_move.x + 'px';
            this.lastMove_img.src = (latest_move.color === 'black') ? BLACK_SELECTED_IMG : WHITE_SELECTED_IMG;
            this.lastMove_img.style.display = 'inline-block';
        }
        else {
            this.lastMove_img.style.display = 'none';
        }
    }

    constructor(element, gridSize, online=true, player='black') {
        super();
        if (!(gridSize === 9 || gridSize === 13 || gridSize === 19)) {
            throw new Error('Grid size must be 9, 13 or 19');
        }
        this.gridSize = gridSize;
        this.game = Weiqi.createGame(this.gridSize);
        this.player = player;
        this.online = online;

        // GUI
        this.gui = (gridSize === 9) ? GUI_BOARD9 : (gridSize === 13) ? GUI_BOARD13 : GUI_BOARD19;
        element.style.backgroundImage = 'url(' + this.gui.image + ')'

        this.points = new Array(gridSize);
        for (let i = 0, len=this.points.length; i < len; ++i) {
            this.points[i] = new Array(gridSize);
        }

        let y = this.gui.start_y - this.gui.spacing / 2;
        for (let j = 0; j < gridSize; ++j) {
            let x = this.gui.start_x - this.gui.spacing / 2;
            for (let i = 0; i < gridSize; ++i) {
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

                this.points[i][j] = img;
                element.append(img);

                x += this.gui.spacing;
            }
            y += this.gui.spacing;
        }

        this.lastMove_img = new Image(this.gui.spacing, this.gui.spacing);
        this.lastMove_img.src = BLACK_SELECTED_IMG;
        this.lastMove_img.style.position = 'absolute';
        this.lastMove_img.style.display = 'none';
        element.append(this.lastMove_img);
    }

    play(color, x, y) {
        try {
            this.game = Weiqi.play(this.game, color, [x, y]);
        } catch (err) {
            console.log(err);
            return;
        }

        let move = {
            color: color,
            pass: false,
            x: x,
            y: y,
        };
    
        this._redraw(move);

        this.dispatchEvent(new CustomEvent('move', { detail: move }));
        if (Weiqi.isOver(this.game)) {
            this.dispatchEvent(new Event('gameover'));
        }
        
        if (!this.online) { // alternate players
            this.player = (this.player === 'black') ? 'white' : 'black';
        }
    }

    pass(color) {
        try {
            this.game = Weiqi.pass(this.game, color);
        } catch (err) {
            console.log(err);
            return;
        }

        let move = {
            color: color,
            pass: true
        };

        this._redraw(move);

        this.dispatchEvent(new CustomEvent('move', { detail: move }));
        if (Weiqi.isOver(this.game)) {
            this.dispatchEvent(new Event('gameover'));
        }

        if (!this.online) {
            this.player = (this.player === 'black') ? 'white' : 'black';
        }

    }

    isGameOver() { return Weiqi.isOver(this.game); }

    score() { return Weiqi.areaScore(this.game); }

    toString() {
        let arr = Weiqi.toArray(this.game);
        let str = '';
        for (let j = 0; j < this.gridSize; ++j) {
            for (let i = 0; i < this.gridSize; ++i) {
                str = str + arr[i][j];
            }
            str = str + '\n';
        }
        return str;

    }
}

