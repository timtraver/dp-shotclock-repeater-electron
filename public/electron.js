import path, { dirname } from 'path';
import { fileURLToPath } from 'url';
import { app, BrowserWindow, Menu } from 'electron';
import isDev from 'electron-is-dev';
import os from 'os';
import AdminSocketManager from '../src/admin_socket.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const isMac = process.platform === 'darwin'
let localInterfaces = [];
for (const [key, value] of Object.entries(os.networkInterfaces())) {
  value.forEach(address => {
    if (address.internal == false && address.family != 'IPv6') {
      localInterfaces.push({
        interface: key,
        type: address.family,
        address: address.address
      });
    }
  });
}
console.log(localInterfaces);
let queryString = '?data=' + JSON.stringify(localInterfaces);
console.log(queryString);

// Create new admin object and start it
let admin = new AdminSocketManager('127.0.0.1', '8000');
admin.repeaterIpAddress = localInterfaces[0].address;
admin.repeaterPort = '8080';
admin.startAdminSocket();

function createWindow() {
  // Create the browser window.
  const win = new BrowserWindow({
    title: 'DigitalPool Shot Clock Repeater',
    width: 800,
    height: 620,
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // and load the index.html of the app.
  // win.loadFile('index.html');
  win.loadURL(
    isDev
      ? 'http://localhost:3001' + queryString
      : `file://${path.join(__dirname, '../build/index.html' + queryString)}`
  );

  // Open the DevTools.q
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' });
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(createWindow);

// Implement menu
const menu = [
  ...(isMac
    ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }]
    : []),
  {
    label: 'File',
    submenu: [
      isMac ? { role: 'close' } : { role: 'quit' }
    ]
  },
  {
    label: 'Edit',
    submenu: [
      { role: 'undo' },
      { role: 'redo' },
      { type: 'separator' },
      { role: 'cut' },
      { role: 'copy' },
      { role: 'paste' },
      ...(isMac
        ? [
          { role: 'pasteAndMatchStyle' },
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
          {
            label: 'Speech',
            submenu: [
              { role: 'startSpeaking' },
              { role: 'stopSpeaking' }
            ]
          }
        ]
        : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
    ]
  }
];
const mainMenu = Menu.buildFromTemplate(menu);
Menu.setApplicationMenu(mainMenu);

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On macOS it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});


// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them