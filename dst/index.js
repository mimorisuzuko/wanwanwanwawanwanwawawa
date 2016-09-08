/// <reference path="../typings/index.d.ts" />

const {ipcRenderer} = require('electron');
const _ = require('lodash');

class Player {
	/**
	 * @param {Element} element
	 */
	constructor(element) {
		const video = document.createElement('video');
		video.style.opacity = 0.5;
		element.appendChild(video);

		ipcRenderer.on('canvas-value', this.recieveCanvasValue.bind(this));
		ipcRenderer.on('toggle-play', this.togglePlay.bind(this));
		ipcRenderer.on('path', this.recievePath.bind(this));

		this.video = video;

		this.draw();
	}

	draw() {
		ipcRenderer.send('player-value', {
			time: this.video.currentTime / this.video.duration,
			volume: this.video.volume,
			opacity: parseFloat(window.getComputedStyle(this.video).opacity),
			loop: this.video.loop
		});
		requestAnimationFrame(this.draw.bind(this));
	}

	recieveCanvasValue(event, mes) {
		const {name, value} = mes;
		if (name === 'time') {
			this.video.currentTime = this.video.duration * value;
		} else if (name === 'volume') {
			this.video.volume = value;
		} else if (name === 'opacity') {
			this.video.style.opacity = value;
		} else if (name === 'loop') {
			this.video.loop = value;
		}
	}

	togglePlay() {
		this.video[this.video.paused ? 'play' : 'pause']();
	}

	recievePath(event, mes) {
		this.video.src = mes.path;
	}
}


new Player(document.querySelector('main'));