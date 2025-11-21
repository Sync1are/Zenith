// electron/main.cjs
const { app, BrowserWindow } = require("electron");
const path = require("path");

const isDev = !app.isPackaged;

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
    },
  });

  if (isDev) {
    // Load Vite dev server
    win.loadURL("http://localhost:5173");
  } else {
    // Load built production files
    win.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(createWindow);

const { ipcMain } = require("electron");

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


app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

