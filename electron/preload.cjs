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

  // Compact Mode
  setCompactMode: () => ipcRenderer.send("set-compact-mode"),
  setNormalMode: () => ipcRenderer.send("set-normal-mode"),
  resizeCompactWindow: (height) => ipcRenderer.send("resize-compact-window", height),
  onCompactModeExited: (callback) => {
    ipcRenderer.on('compact-mode-exited', callback);
  },
  removeCompactModeListener: () => {
    ipcRenderer.removeAllListeners('compact-mode-exited');
  },

  // Listen for ESC key press from main process
  onExitSuperFocusRequested: (callback) => {
    ipcRenderer.on('exit-super-focus-requested', callback);
  },
  removeExitSuperFocusListener: () => {
    ipcRenderer.removeAllListeners('exit-super-focus-requested');
  },

  // Open URL in external browser
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // OAuth Callback Server
  startOAuthServer: () => ipcRenderer.invoke('start-oauth-server'),
  onSpotifyCallback: (callback) => {
    ipcRenderer.on('spotify-oauth-callback', (event, data) => callback(data));
  },
  removeSpotifyCallbackListener: () => {
    ipcRenderer.removeAllListeners('spotify-oauth-callback');
  },

  // Deep Link Handler (for custom protocol)
  onSpotifyDeepLink: (callback) => {
    ipcRenderer.on('spotify-deep-link', (event, data) => callback(data));
  },
  removeSpotifyDeepLinkListener: () => {
    ipcRenderer.removeAllListeners('spotify-deep-link');
  },

  // Secure Spotify
  spotify: {
    encryptToken: (token) => ipcRenderer.invoke('spotify-encrypt-token', token),
    refreshToken: (encryptedToken) => ipcRenderer.invoke('spotify-refresh-token', encryptedToken),
  },

  // Discord Rich Presence
  updateDiscordPresence: (data) => ipcRenderer.send('update-discord-presence', data),
});
