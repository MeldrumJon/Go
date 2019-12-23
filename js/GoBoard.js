const NO_BG = 'none';
const WHITE_STONE_BG = 'url("res/white.svg")';
const BLACK_STONE_BG = 'url("res/black.svg")';
const WHITE_SELECTED_BG = 'url("res/white_selected.svg")';
const BLACK_SELECTED_BG = 'url("res/black_selected.svg")';

export default class GoBoard extends EventTarget {
    _draw(last_move) {
        let array = Weiqi.toArray(this.game);
        for (let j = 0; j < this.gridSize; ++j) {
            for (let i = 0; i < this.gridSize; ++i) {
                let bgImg = NO_BG;
                let selImg = NO_BG;
                if (array[i][j] === 'x') {
                    bgImg = BLACK_STONE_BG;
                    selImg = BLACK_SELECTED_BG;
                } else if (array[i][j] === 'o') {
                    bgImg = WHITE_STONE_BG;
                    selImg = WHITE_SELECTED_BG;
                }
                this.points[j][i].style.opacity = 1;
                if (last_move && j === last_move.y && i === last_move.x) {
                    this.points[j][i].style.backgroundImage = selImg;
                }
                else {
                    this.points[j][i].style.backgroundImage = bgImg;
                }
            }
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
        this.element = element;

        this.movesList = [];
        this.gamesPast = [];

        // Clear GUI
        this.element.innerHTML = '';

        // Grid
        let rowCells = this.gridSize-1;
        let numCells = rowCells*rowCells;
        this.table = document.createElement('table');
        this.table.style.position = 'absolute';
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
        let pointMouseEnter = function(evt) {
            let point = evt.target;
            let x = point.GoX;
            let y = point.GoY;
            try {
                Weiqi.play(this.game, this.player, [x, y]);
            } catch {
                return; // Don't display possible move if move is illegal.
            }

            point.style.opacity = '0.5';
            let bg = (this.player === 'black') ? BLACK_STONE_BG : WHITE_STONE_BG;
            point.style.backgroundImage = bg;
            point.GoHovering = true;
        }.bind(this);
        let pointMouseLeave = function(evt) {
            let point = evt.target;
            if (point.GoHovering) {
                point.style.backgroundImage = NO_BG;
                point.style.opacity = '1';
                point.GoHovering = false;
            }
        }.bind(this);
        let pointClick = function(evt) {
            let point = evt.target;
            pointMouseLeave(evt);
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
                point.addEventListener('mouseenter', pointMouseEnter);
                point.addEventListener('mouseleave', pointMouseLeave);
                this.points[j][i] = point;
                elPoints.append(point);
            }
        }
        this.element.append(elPoints);

        /*this.moveIndicator = document.createElement('span');
        this.moveIndicator.style.position = 'absolute';
        this.moveIndicator.style.background = 'transparent center/100% no-repeat';
        this.element.append(this.moveIndicator);*/

        this.resize();
    }

    resize() {
        let width = this.element.clientWidth;
        let rowCells = this.gridSize-1;
        let spacing = ~~(width/(rowCells+1));
        let cellWidth = spacing-1; // account for border

        // Table
        for (let i = 0, len = this.cells.length; i < len; ++i) {
            let cell = this.cells[i];
            cell.style.width = cellWidth + 'px';
            cell.style.height = cellWidth + 'px';
        }
        let offset = ~~((width - this.table.clientWidth)/2); 
        this.table.style.top = offset + 'px';
        this.table.style.left = offset + 'px';

        // Dots
        let dotSize = ~~(cellWidth*0.30);
        dotSize = (dotSize & 0x1) ? dotSize : dotSize + 1; // force odd
        for (let i = 0; i < 5; ++i) {
            let dot = this.dots[i];
            dot.style.width = dotSize + 'px';
            dot.style.height = dotSize + 'px';
            let x = dot.GoX;
            let y = dot.GoY;
            dot.style.left = ~~(offset + spacing*x - dotSize/2 + 1) + 'px';
            dot.style.top = ~~(offset + spacing*y - dotSize/2 + 1) + 'px';
        }

        // Points
        offset = offset - spacing/2;
        for (let j = 0; j < this.gridSize; ++j) {
            for (let i = 0; i < this.gridSize; ++i) {
                let point = this.points[j][i];
                point.style.width = spacing + 'px';
                point.style.height = spacing + 'px';
                point.style.left = (offset + spacing*i) + 'px';
                point.style.top = (offset + spacing*j) + 'px';
            }
        }

        // Last move
        /*this.moveIndicator.style.width = spacing + 'px';
        this.moveIndicator.style.height = spacing + 'px';
        if (this.lastMove && !this.lastMove.pass) {
            this.moveIndicator.style.left = (offset+spacing*this.lastMove.x) + 'px';
            this.moveIndicator.style.top = (offset+spacing*this.lastMove.y) + 'px';
        }
        else {
            this.moveIndicator.style.left = '0';
            this.moveIndicator.style.top = '0';
        }*/
    }

    play(color, x, y) {
        let g;
        try {
            g = Weiqi.play(this.game, color, [x, y]);
        } catch (err) {
            console.log(err);
            return;
        }

        this.gamesPast.push(this.game);
        this.game = g;

        let move = {
            color: color,
            pass: false,
            x: x,
            y: y,
        };
        this.movesList.push(move);
    
        this.dispatchEvent(new CustomEvent('move', { detail: move }));
        this._draw(move);

        if (Weiqi.isOver(this.game)) {
            this.dispatchEvent(new Event('gameover'));
        }
        
        if (!this.online) { // alternate players
            this.player = (this.player === 'black') ? 'white' : 'black';
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

        this.gamesPast.push(this.game);
        this.game = g;

        let move = {
            color: color,
            pass: true
        };
        this.movesList.push(move);

        this.dispatchEvent(new CustomEvent('move', { detail: move }));
        this._draw(move);

        if (Weiqi.isOver(this.game)) {
            this.dispatchEvent(new Event('gameover'));
        }

        if (!this.online) {
            this.player = (this.player === 'black') ? 'white' : 'black';
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

