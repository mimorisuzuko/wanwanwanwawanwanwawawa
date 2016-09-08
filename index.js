/// <reference path="typings/index.d.ts" />

const electron = require('electron');
const {BrowserWindow, app, ipcMain} = electron;

let mainWindow = null;
let controllerWindow = null;

const createMain = () => {
	const {width, height} = electron.screen.getPrimaryDisplay().workAreaSize;
	mainWindow = new BrowserWindow({
		width,
		height,
		transparent: true,
		alwaysOnTop: true,
		frame: false
	});
	mainWindow.setIgnoreMouseEvents(true);
	mainWindow.loadURL(`file://${__dirname}/dst/index.html`);
	mainWindow.on('closed', () => mainWindow = null);
};

const createController = () => {
	const controllerHeight = 90 + 22;
	controllerWindow = new BrowserWindow({
		width: 800,
		maxHeight: controllerHeight,
		minHeight: controllerHeight,
		height: controllerHeight
	});
	controllerWindow.loadURL(`file://${__dirname}/dst/controller.html`);
	controllerWindow.on('closed', () => controllerWindow = null);
};

app.on('ready', () => {
	createController();
	createMain();
});

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') { app.quit(); }
});

app.on('activate', () => {
	if (!mainWindow) { createWindow(); }
	if (!controllerWindow) { createController(); }
});

ipcMain.on('canvas-value', (event, mes) => {
	if (!mainWindow) { return; }
	mainWindow.webContents.send('canvas-value', mes);
});

ipcMain.on('toggle-play', (event, mes) => {
	if (!mainWindow) { return; }
	mainWindow.webContents.send('toggle-play', mes);
});

ipcMain.on('path', (event, mes) => {
	if (!mainWindow) { return; }
	mainWindow.webContents.send('path', mes);
});

ipcMain.on('player-value', (event, mes) => {
	if (!controllerWindow) { return; }
	controllerWindow.webContents.send('player-value', mes);
});

