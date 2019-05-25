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


function main() {
	const container = document.getElementById('board');
	let board = new Board(container, 19, false, 'black');
}
main();