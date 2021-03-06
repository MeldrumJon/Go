const NO_BG = 'none';
const WHITE_STONE_BG = 'url("res/white.svg")';
const BLACK_STONE_BG = 'url("res/black.svg")';
const WHITE_SELECTED_BG = 'url("res/white_selected.svg")';
const BLACK_SELECTED_BG = 'url("res/black_selected.svg")';

export default class GoBoard extends EventTarget {
    _draw(last_move) {
        let array = Weiqi.toArray(this.game);
        if (last_move) { // first for perceived performance
            let selImg = NO_BG;
            if (array[last_move.x][last_move.y] === 'x') {
                selImg = BLACK_SELECTED_BG;
            } else if (array[last_move.x][last_move.y] === 'o') {
                selImg = WHITE_SELECTED_BG;
            }
            this.points[last_move.y][last_move.x].style.opacity = 1;
            this.points[last_move.y][last_move.x].style.backgroundImage = selImg;
        }
        for (let j = 0; j < this.gridSize; ++j) {
            for (let i = 0; i < this.gridSize; ++i) {
                if (last_move && last_move.x === i && last_move.y === j) {
                    continue;
                }
                let bgImg = NO_BG;
                if (array[i][j] === 'x') {
                    bgImg = BLACK_STONE_BG;
                } else if (array[i][j] === 'o') {
                    bgImg = WHITE_STONE_BG;
                }
                this.points[j][i].style.opacity = 1;
                this.points[j][i].style.backgroundImage = bgImg;
            }
        }
        // Still show indicator if mouse is hovering over playable point
        if (this.hoveringPoint) {
            this._hover(this.hoveringPoint);
        }
    }

    _unhover(point) {
        if (point.GoHoverIndicator) {
            point.style.backgroundImage = NO_BG;
            point.style.opacity = '1';
            point.GoHoverIndicator = false;
        }
    }

    _hover(point) {
        this.hoveringPoint = point;
        let x = point.GoX;
        let y = point.GoY;
        try {
            Weiqi.play(this.game, this.player, [x, y]);
        } catch {
            this._unhover(point);
            return; // Don't display possible move if move is illegal.
        }
        let bg = (this.player === 'black') ? BLACK_STONE_BG : WHITE_STONE_BG;
        point.style.opacity = '0.5';
        point.style.backgroundImage = bg;
        point.GoHoverIndicator = true;
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
        this.element = element;

        this.movesList = [];
        this.gamesPast = [];

        this.hoveringPoint = null;

        // Clear GUI
        this.element.innerHTML = '';

        // Grid
        let rowCells = this.gridSize-1;
        let numCells = rowCells*rowCells;
        this.table = document.createElement('table');
        this.table.style.position = 'absolute';
        this.table.style.tableLayout = 'fixed';
        this.table.style.borderCollapse = 'collapse';
        this.table.style.borderSpacing = '0';
        this.cells = [];
        for (let j = 0; j < rowCells; ++j) {
            let row = document.createElement('tr');
            for (let i = 0; i < rowCells; ++i) {
                let cell = document.createElement('td');
                cell.style.border = '1px solid #000';
                row.append(cell);
                this.cells.push(cell);
            }
            this.table.append(row);
        }
        this.element.append(this.table);

        // Grid Markers
        let center = ~~((gridSize-1)/2);
        let dotoff = (this.gridSize === 9) ? 2 : 3;

        let elDots = document.createElement('div');
        this.dots = new Array(5);
        for (let i = 0; i < 5; ++i) {
            let dot = document.createElement('span');
            dot.style.position = 'absolute';
            dot.style.background = 'url("res/dot.svg") transparent center/100% no-repeat';
            switch (i) {
                case 0:
                    dot.GoX = dotoff;
                    dot.GoY = dotoff;
                    break;
                case 1:
                    dot.GoX = this.gridSize-1 - dotoff;
                    dot.GoY = dotoff;
                    break;
                case 2:
                    dot.GoX = dotoff;
                    dot.GoY = this.gridSize-1 - dotoff;
                    break;
                case 3:
                    dot.GoX = this.gridSize-1 - dotoff;
                    dot.GoY = this.gridSize-1 - dotoff;
                    break;
                case 4: // center
                    dot.GoX = center;
                    dot.GoY = center;
                    break;
            }
            this.dots[i] = dot;
            elDots.append(dot);
        }
        this.element.append(elDots);

        // Pieces
        let pointMouseMove = function(evt) {
            let point = evt.target;
            if (point === this.hoveringPoint) { return; } // already done
            this._hover(point);
        }.bind(this);
        let pointMouseLeave = function(evt) {
            this._unhover(this.hoveringPoint);
            this.hoveringPoint = null;
        }.bind(this);
        let pointClick = function(evt) {
            let point = evt.target;
            point.GoHoverIndicator = false;
            let x = point.GoX;
            let y = point.GoY;
            this.play(this.player, x, y);
        }.bind(this);

        let elPoints = document.createElement('div');
        this.points = new Array(this.gridSize);
        for (let j = 0; j < this.gridSize; ++j) {
            this.points[j] = new Array(this.gridSize);
            for (let i = 0; i < this.gridSize; ++i) {
                let point = document.createElement('span');
                point.style.position = 'absolute';
                point.style.background = 'transparent center/100% no-repeat';
                point.GoX = i;
                point.GoY = j;
                point.addEventListener('click', pointClick);
                point.addEventListener('mousemove', pointMouseMove);
                point.addEventListener('mouseleave', pointMouseLeave);
                this.points[j][i] = point;
                elPoints.append(point);
            }
        }
        this.element.append(elPoints);

        this.resize();
    }

    resize() {
        let width = this.element.clientWidth;
        let height = this.element.clientHeight;

        let cSize = ~~(width/(this.gridSize) - 1); // -1 account for border
        let cSizeStr = cSize + 'px';
        for (let i = 0, len = this.cells.length; i < len; ++i) {
            let cell = this.cells[i];
            cell.style.width = cSizeStr;
            cell.style.height = cSizeStr;
        }
        let tOffTop = ~~((height - this.table.clientHeight)/2); 
        let tOffLeft = ~~((width - this.table.clientWidth)/2); 
        this.table.style.top = tOffTop + 'px';
        this.table.style.left = tOffLeft + 'px';

        let cWidth = (this.table.clientWidth-1)/(this.gridSize-1); // Use actual table cell width/height
        let cHeight = (this.table.clientHeight-1)/(this.gridSize-1);

        // Dots
        let dSize = ~~(cWidth*0.30);
        dSize = (dSize & 0x1) ? dSize : dSize + 1; // force odd
        let dSizeStr = dSize + 'px';
        let dOffTop = tOffTop - ~~(dSize/2);
        let dOffLeft = tOffLeft - ~~(dSize/2);
        for (let i = 0; i < 5; ++i) {
            let dot = this.dots[i];
            dot.style.width = dSizeStr;
            dot.style.height = dSizeStr;
            let x = dot.GoX;
            let y = dot.GoY;
            dot.style.top = (dOffTop + cHeight*y) + 'px';
            dot.style.left = (dOffLeft + cWidth*x) + 'px';
        }

        // Points
        let pSize = ~~(cHeight);
        pSize = (pSize & 1) ? pSize : pSize - 1; // force odd
        let pSizeStr = pSize + 'px';
        let pOffTop = tOffTop - ~~(pSize/2);
        let pOffLeft = tOffLeft - ~~(pSize/2);
        for (let j = 0; j < this.gridSize; ++j) {
            for (let i = 0; i < this.gridSize; ++i) {
                let point = this.points[j][i];
                point.style.width = pSizeStr;
                point.style.height = pSizeStr;
                point.style.top = (pOffTop + cHeight*j) + 'px';
                point.style.left = (pOffLeft + cWidth*i) + 'px';
            }
        }
    }

    play(color, x, y) {
        let g;
        try {
            g = Weiqi.play(this.game, color, [x, y]);
        } catch (err) {
            console.log(err.message);
            return;
        }

        if (!this.online) { // Local game, change players
            this.player = (this.player === 'black') ? 'white' : 'black';
            this.gamesPast.push(this.game); // for undo
        }
        this.game = g;

        let move = {
            color: color,
            pass: false,
            x: x,
            y: y,
        };
        this.movesList.push(move);
        this._draw(move);
    
        this.dispatchEvent(new CustomEvent('move', { detail: move }));
        if (Weiqi.isOver(this.game)) {
            this.dispatchEvent(new Event('gameover'));
        }
    }

    pass(color) {
        let g;
        try {
            g = Weiqi.pass(this.game, color);
        } catch (err) {
            console.log(err);
            return;
        }

        if (!this.online) { // Local game, change players
            this.player = (this.player === 'black') ? 'white' : 'black';
            this.gamesPast.push(this.game); // for undo
        }
        this.game = g;

        let move = {
            color: color,
            pass: true
        };
        this.movesList.push(move);
        this._draw();

        this.dispatchEvent(new CustomEvent('move', { detail: move }));
        if (Weiqi.isOver(this.game)) {
            this.dispatchEvent(new Event('gameover'));
        }
    }

    isGameOver() { return Weiqi.isOver(this.game); }

    score() { return Weiqi.areaScore(this.game); }

    undo() {
        if (!this.online && this.gamesPast.length) {
            this.game = this.gamesPast.pop();
            this.player = (this.player === 'black') ? 'white' : 'black';
            this._draw();
        }
    }

    playerTurn() {
        return this.game.get('currentPlayer');
    }

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

