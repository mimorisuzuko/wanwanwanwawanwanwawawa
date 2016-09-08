/// <reference path="../typings/index.d.ts" />

const _ = require('lodash');
const SVG = require('svgjs');
const {ipcRenderer} = require('electron');

class Controller {
	/**
	 * @param {Element} element
	 */
	constructor(element) {
		const playField = document.createElement('div');
		playField.classList.add('play-field');

		const playFieldLeft = document.createElement('div');
		playFieldLeft.classList.add('play-field-left');
		const fileField = document.createElement('div');
		const input = document.createElement('input');
		input.type = 'file';
		fileField.appendChild(input);
		input.addEventListener('change', this.sendPath.bind(this));
		const loopField = document.createElement('div');
		const loopLabel = document.createElement('label');
		loopLabel.innerText = 'Loop: ';
		const loopCheck = document.createElement('input');
		loopCheck.type = 'checkbox';
		loopCheck.addEventListener('change', this.sendLoop.bind(this));
		_.forEach([loopLabel, loopCheck], (a) => loopField.appendChild(a));
		const buttonField = document.createElement('div');
		const button = document.createElement('button');
		button.innerText = 'PLAY/PAUSE';
		button.addEventListener('click', this.togglePlay.bind(this));
		buttonField.appendChild(button);
		_.forEach([fileField, loopField, buttonField], (a) => playFieldLeft.appendChild(a));

		const playFieldRight = document.createElement('div');
		playFieldRight.classList.add('play-field-right');
		playFieldRight.id = `pfr${_.now()}`;
		_.forEach([playFieldLeft, playFieldRight], (a) => playField.appendChild(a));
		_.forEach([playField], (a) => element.appendChild(a));

		const names = ['time', 'opacity', 'volume'];
		const svg = SVG(playFieldRight.id).height(Controller.BAR.HEIGHT * names.length);
		document.body.addEventListener('mousedown', this.mousedown.bind(this));
		document.body.addEventListener('mousemove', this.mousemove.bind(this));
		document.body.addEventListener('mouseup', this.mouseup.bind(this));
		const bars = svg.group();
		_.forEach([Controller.COLOR.RED, Controller.COLOR.GREEN, Controller.COLOR.BLUE], (color, i) => {
			const name = names[i];
			const wrap = svg.group().data({
				name,
				value: 0,
				viewname: _.upperFirst(name)
			});
			const y = Controller.BAR.HEIGHT * i;
			const back = svg.rect('100%', Controller.BAR.HEIGHT).fill(Controller.COLOR.GRAY).y(y);
			const front = svg.rect(0, Controller.BAR.HEIGHT).fill(color).y(y);
			const text = svg.plain().x(5).cy(y + Controller.BAR.HEIGHT / 2).font({ family: 'inherit', size: '12px' });
			_.forEach([back, front, text], (a) => wrap.add(a));
			bars.add(wrap);
		});

		this.svg = svg;
		this.loopCheck = loopCheck;
		this.bars = bars;
		this.target = null;
		this.status = Controller.STATUS.DEFAULT;

		ipcRenderer.on('player-value', this.recievePlayerValue.bind(this));
	}

	sendLoop() {
		this.sendValue('loop', this.loopCheck.checked);
	}

	sendValue(name, value) {
		ipcRenderer.send('canvas-value', {
			name,
			value
		});
	}

	mousedown() {
		const target = _.find(this.bars.children(), (a) => _.some(a.children(), (b) => b.node.contains(event.target)));
		if (target) {
			this.target = target;
			this.status = Controller.STATUS.DOWN_BAR;

			const {left, width} = this.target.node.getBoundingClientRect();
			const x = event.clientX - left;
			const value = Math.min(1, Math.max(0, x / width));
			this.sendValue(this.target.data('name'), value);
		} else {
			// TODO
		}
	}

	mousemove() {
		if (this.status === Controller.STATUS.DOWN_BAR) {
			const {left, width} = this.target.node.getBoundingClientRect();
			const x = event.clientX - left;
			const value = Math.min(1, Math.max(0, x / width));
			this.sendValue(this.target.data('name'), value);
		} else {
			// TODO
		}
	}

	mouseup() {
		this.status = Controller.STATUS.DEFAULT;
		this.target = null;
	}

	sendPath() {
		const path = event.target.files[0].path;
		ipcRenderer.send('path', { path });
	}

	togglePlay() {
		ipcRenderer.send('toggle-play', {});
	}

	recievePlayerValue(event, mes) {
		const {width} = this.svg.node.getBoundingClientRect();
		_.forEach(this.bars.children(), (child) => {
			const name = child.data('name');
			const v = mes[name];
			child.data('value', v);
			child.get(1).width(v * width);
			child.get(2).plain(`${child.data('viewname')}: ${v.toFixed(2)}`);
		});
		this.loopCheck.checked = mes.loop;
	}

	static get STATUS() {
		return {
			DEFAULT: 0,
			DOWN_BAR: 1
		};
	}

	static get COLOR() {
		return {
			GRAY: 'rgb(240, 240, 240)',
			RED: 'rgb(239, 83, 80)',
			GREEN: 'rgb(102, 187, 106)',
			BLUE: 'rgb(66, 165, 245)'
		};
	}

	static get BAR() {
		return {
			HEIGHT: 30
		};
	}
}

new Controller(document.querySelector('main'));