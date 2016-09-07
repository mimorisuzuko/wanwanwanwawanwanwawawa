/// <reference path="typings/index.d.ts" />

const electron = require('electron');
const {BrowserWindow, app, ipcMain} = electron;

const controllerHeight = 60 + 22;
let mainWindow = null;
let controllerWindow = null;

const createWindow = () => {
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
	//mainWindow.webContents.openDevTools();
	mainWindow.on('closed', () => mainWindow = null);

	controllerWindow = new BrowserWindow({
		width,
		maxHeight: controllerHeight,
		minHeight: controllerHeight,
		height: controllerHeight
	});
	controllerWindow.loadURL(`file://${__dirname}/dst/controller.html`);
	//controllerWindow.webContents.openDevTools();
	controllerWindow.on('closed', () => controllerWindow = null);
};

app.on('ready', createWindow);

app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') { app.quit(); }
});

app.on('activate', () => {
	if (mainWindow === null) { createWindow(); }
});

ipcMain.on('canvas-value', (event, mes) => {
	mainWindow.webContents.send('canvas-value', mes);
});

ipcMain.on('toggle-play', (event, mes) => {
	mainWindow.webContents.send('toggle-play', mes);
});

ipcMain.on('path', (event, mes) => {
	mainWindow.webContents.send('path', mes);
});

ipcMain.on('player-value', (event, mes) => {
	controllerWindow.webContents.send('player-value', mes);
});

