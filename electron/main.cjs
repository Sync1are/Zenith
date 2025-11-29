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

  // Set Content Security Policy (CSP)
  win.webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const responseHeaders = { ...details.responseHeaders };

    // Remove existing CSP headers to avoid conflicts (browser takes most restrictive intersection)
    Object.keys(responseHeaders).forEach(key => {
      if (key.toLowerCase() === 'content-security-policy') {
        delete responseHeaders[key];
      }
    });

    responseHeaders['Content-Security-Policy'] = [
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://cdn.tailwindcss.com https://unpkg.com https://aistudiocdn.com https://*.spotify.com https://accounts.spotify.com https://*.youtube.com https://youtube.com https://www.youtube.com https://img.youtube.com https://*.googleapis.com https://*.firebaseio.com https://*.firebase.com https://www.googletagmanager.com https://api.dicebear.com https://cdn.pixabay.com https://openrouter.ai;",
      "connect-src 'self' https://*.googleapis.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://*.firebaseio.com https://*.firebase.com wss://*.firebaseio.com https://www.googletagmanager.com https://api.dicebear.com https://cdn.pixabay.com https://openrouter.ai;",
      "media-src 'self' data: blob: https: https://cdn.pixabay.com;"
    ];

    callback({ responseHeaders });
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

// Secure Spotify Token Handlers
const { safeStorage, net } = require("electron");

ipcMain.handle('spotify-encrypt-token', async (event, token) => {
  if (safeStorage.isEncryptionAvailable()) {
    return safeStorage.encryptString(token).toString('base64');
  }
  console.warn("safeStorage not available, storing plain token");
  return token;
});

ipcMain.handle('spotify-refresh-token', async (event, encryptedToken) => {
  try {
    let refreshToken = encryptedToken;
    if (safeStorage.isEncryptionAvailable()) {
      try {
        refreshToken = safeStorage.decryptString(Buffer.from(encryptedToken, 'base64'));
      } catch (e) {
        console.error("Failed to decrypt token:", e);
        throw new Error("Decryption failed");
      }
    }

    const SPOTIFY_CLIENT_ID = "c78fa3fb2fc34a76ae9f6771a403589f";

    const body = new URLSearchParams({
      client_id: SPOTIFY_CLIENT_ID,
      grant_type: "refresh_token",
      refresh_token: refreshToken,
    }).toString();

    const request = net.request({
      method: 'POST',
      url: 'https://accounts.spotify.com/api/token',
    });

    request.setHeader('Content-Type', 'application/x-www-form-urlencoded');

    return new Promise((resolve, reject) => {
      request.on('response', (response) => {
        let data = '';
        response.on('data', (chunk) => {
          data += chunk;
        });
        response.on('end', () => {
          if (response.statusCode === 200) {
            resolve(JSON.parse(data));
          } else {
            reject(new Error(`Spotify refresh failed: ${response.statusCode} ${data}`));
          }
        });
      });
      request.on('error', (error) => {
        reject(error);
      });
      request.write(body);
      request.end();
    });

  } catch (error) {
    console.error("Spotify refresh error:", error);
    throw error;
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  // Unregister all shortcuts before app quits
  globalShortcut.unregisterAll();
});
