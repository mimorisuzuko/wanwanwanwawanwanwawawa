/// <reference path="../typings/index.d.ts" />

const {ipcRenderer} = require('electron');
const _ = require('lodash');

class Controller {
	/**
	 * @param {Element} element
	 */
	constructor(element) {
		const playField = document.createElement('div');
		playField.classList.add('play-field');

		const playFieldLeft = document.createElement('div');
		playFieldLeft.classList.add('play-field-left');
		const input = document.createElement('input');
		input.type = 'file';
		input.addEventListener('change', this.sendPath.bind(this));
		const button = document.createElement('button');
		button.innerText = 'PLAY/PAUSE';
		button.addEventListener('click', this.togglePlay.bind(this));
		_.forEach([input, button], (a) => playFieldLeft.appendChild(a));

		const playFieldRight = document.createElement('div');
		playFieldRight.classList.add('play-field-right');
		playFieldRight.addEventListener('click', this.sendCanvasValue.bind(this));

		const colors = ['rgb(239, 83, 80)', 'rgb(102, 187, 106)', 'rgb(66, 165, 245)'];
		const children = _.map(['currentTime', 'opacity', 'volume'], (name, i) => {
			const canvas = document.createElement('canvas');
			canvas.dataset.name = name;
			canvas.dataset.value = 0;
			canvas.height = Controller.BAR.HEIGHT;
			playFieldRight.appendChild(canvas);
			return {
				canvas,
				context: canvas.getContext('2d'),
				color: colors[i]
			};
		});

		_.forEach([playFieldLeft, playFieldRight], (a) => playField.appendChild(a));
		_.forEach([playField], (a) => element.appendChild(a));

		this.children = children;
		this.playFieldRight = playFieldRight;

		ipcRenderer.on('player-value', this.recievePlayerValue.bind(this));
		window.addEventListener('resize', this.fit.bind(this));
		this.fit();
		this.draw();
	}

	fit() {
		const parent = this.children[0].canvas.parentElement;
		const {width} = parent.getBoundingClientRect();
		const {paddingLeft, paddingRight} = window.getComputedStyle(parent);

		_.forEach(this.children, (a) => a.canvas.width = width - parseFloat(paddingLeft) - parseFloat(paddingRight));
	}

	draw() {
		_.forEach(this.children, (child) => {
			const {canvas, context, color} = child;
			const {width, height, dataset} = canvas;
			const {name, value} = dataset;
			context.clearRect(0, 0, width, height);
			context.fillStyle = color;
			context.fillRect(0, 0, width * value, height);
			context.fillStyle = 'rgb(0, 0, 0)';
			context.textBaseline = 'middle';
			context.fillText(`${name}: ${parseFloat(value).toFixed(2)}`, 0, height / 2);
		});

		requestAnimationFrame(this.draw.bind(this));
	}

	sendCanvasValue() {
		const rect = this.playFieldRight.getBoundingClientRect();
		const x = event.clientX - rect.left;
		const y = event.clientY - rect.top;
		const pad = parseFloat(window.getComputedStyle(this.playFieldRight).paddingLeft);
		const value = (x - pad) / (rect.width - pad);
		const index = Math.floor(y / Controller.BAR.HEIGHT);
		const {canvas} = this.children[index];
		canvas.dataset.value = value;
		ipcRenderer.send('canvas-value', {
			name: canvas.dataset.name,
			value,
		});
	}

	sendPath() {
		const path = event.target.files[0].path;
		ipcRenderer.send('path', { path });
	}

	togglePlay() {
		ipcRenderer.send('toggle-play', {});
	}

	recievePlayerValue(event, mes) {
		_.forEach(_.toPairs(mes), ([k, v]) => {
			const child = _.find(this.children, (a) => a.canvas.dataset.name === k);
			child.canvas.dataset.value = v;
		});
	}

	static get BAR() {
		return {
			HEIGHT: 20
		};
	}
}

new Controller(document.querySelector('main'));