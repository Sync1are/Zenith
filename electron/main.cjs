// electron/main.cjs
const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;
let mainWindow = null;
let isSuperFocusMode = false;

function createWindow() {
  const win = new BrowserWindow({
    backgroundColor: "#111217",
    autoHideMenuBar: true,
    frame: false,
    titleBarStyle: "hidden",

    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      webviewTag: true, // Enable <webview> tag for mini-apps
    },
  });

  mainWindow = win;

  if (isDev) {
    // Load Vite dev server
    win.loadURL("http://localhost:5173");
  } else {
    // Load built production files
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

ipcMain.on("minimize-window", () => {
  BrowserWindow.getFocusedWindow()?.minimize();
});

ipcMain.on("maximize-window", () => {
  const win = BrowserWindow.getFocusedWindow();
  if (!win) return;
  win.isMaximized() ? win.unmaximize() : win.maximize();
});

ipcMain.on("close-window", () => {
  BrowserWindow.getFocusedWindow()?.close();
});

// SUPER Focus Mode handlers
ipcMain.on("enter-super-focus", () => {
  if (!mainWindow) return;

  isSuperFocusMode = true;
  mainWindow.setFullScreen(true);

  // Block task switching
  globalShortcut.register('Alt+Tab', () => { });
  globalShortcut.register('Alt+Shift+Tab', () => { });

  // Block window close shortcuts
  globalShortcut.register('Alt+F4', () => { });
  globalShortcut.register('CommandOrControl+W', () => { });
  globalShortcut.register('CommandOrControl+Q', () => { });

  // Block all F-keys
  for (let i = 1; i <= 12; i++) {
    globalShortcut.register(`F${i}`, () => { });
  }

  // Block system shortcuts
  globalShortcut.register('CommandOrControl+Shift+Esc', () => { }); // Task Manager
  globalShortcut.register('CommandOrControl+L', () => { }); // Lock screen
  globalShortcut.register('Alt+Space', () => { }); // Window menu

  // ESC key - ONLY allowed key to exit
  globalShortcut.register('Escape', () => {
    if (mainWindow) {
      mainWindow.webContents.send('exit-super-focus-requested');
    }
  });
});

ipcMain.on("exit-super-focus", () => {
  if (!mainWindow) return;

  isSuperFocusMode = false;
  mainWindow.setFullScreen(false);

  // Unregister all shortcuts
  globalShortcut.unregisterAll();
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Unregister all shortcuts before app quits
  globalShortcut.unregisterAll();
});
