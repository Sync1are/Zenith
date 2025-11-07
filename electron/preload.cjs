console.log("Electron preload loaded");
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  minimize: () => ipcRenderer.send("minimize-window"),
  maximize: () => ipcRenderer.send("maximize-window"),
  close: () => ipcRenderer.send("close-window")
});
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
