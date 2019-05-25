const machine = {
	initial: "init",
	states: {
		init: {
			INIT_HOST: 'online_or_local',
			INIT_PEER: 'wait_for_connection'
		},
		online_or_local: {
			ONLINE: 'show_url',
			LOCAL: 'game'
		},
		// Online stuff
		show_url: {
			CONNECTED: 'game'
		},
		wait_for_connection: {
			CONNECTED: 'game'
		},
		disconnected: {},
		game: {
			DISCONNECTED: 'disconnected'
		}
	}
};

let state = machine.initial;

export default function fsm(event) {
	let transition = machine.states[state][event];
	if (typeof transition === 'function') {
		state = transition();
	} else if (typeof transition === 'string') {
		state = transition;
	}
	const body = document.getElementsByTagName("BODY")[0];
	body.className = state;
}