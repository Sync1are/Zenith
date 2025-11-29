console.log("Electron preload loaded");
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // Window controls
  minimize: () => ipcRenderer.send("minimize-window"),
  maximize: () => ipcRenderer.send("maximize-window"),
  close: () => ipcRenderer.send("close-window"),

  // SUPER Focus Mode
  enterSuperFocus: () => ipcRenderer.send("enter-super-focus"),
  exitSuperFocus: () => ipcRenderer.send("exit-super-focus"),

  // Listen for ESC key press from main process
  onExitSuperFocusRequested: (callback) => {
    ipcRenderer.on('exit-super-focus-requested', callback);
  },
  removeExitSuperFocusListener: () => {
    ipcRenderer.removeAllListeners('exit-super-focus-requested');
  },

  // Secure Spotify
  spotify: {
    encryptToken: (token) => ipcRenderer.invoke('spotify-encrypt-token', token),
    refreshToken: (encryptedToken) => ipcRenderer.invoke('spotify-refresh-token', encryptedToken),
  }
});
