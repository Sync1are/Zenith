// electron/main.cjs
const { app, BrowserWindow, globalShortcut, ipcMain } = require("electron");
const path = require("path");
const http = require("http");

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

  // Enable kiosk mode for true fullscreen lockdown on Windows
  mainWindow.setKiosk(true);
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.setVisibleOnAllWorkspaces(true);
  mainWindow.focus();

  // Only block window close shortcuts - allow everything else
  globalShortcut.register('Alt+F4', () => { });
  globalShortcut.register('CommandOrControl+W', () => { });

  // ESC key to exit
  globalShortcut.register('Escape', () => {
    if (mainWindow) {
      mainWindow.webContents.send('exit-super-focus-requested');
    }
  });
});

ipcMain.on("exit-super-focus", () => {
  if (!mainWindow) return;

  isSuperFocusMode = false;

  // Disable kiosk mode
  mainWindow.setKiosk(false);
  mainWindow.setAlwaysOnTop(false);
  mainWindow.setVisibleOnAllWorkspaces(false);

  globalShortcut.unregisterAll();
});

// Open URL in external browser
const { shell } = require("electron");
ipcMain.handle('open-external', async (event, url) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error('Failed to open external URL:', error);
    return { success: false, error: error.message };
  }
});

// OAuth Callback Server for Spotify
let oauthServer = null;

ipcMain.handle('start-oauth-server', async () => {
  return new Promise((resolve, reject) => {
    // Close existing server if any
    if (oauthServer) {
      oauthServer.close();
      oauthServer = null;
    }

    oauthServer = http.createServer((req, res) => {
      const url = new URL(req.url, `http://localhost:8888`);

      if (url.pathname === '/callback') {
        const code = url.searchParams.get('code');
        const state = url.searchParams.get('state');
        const error = url.searchParams.get('error');

        // Send success response to browser
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
          <html>
            <body style="background: #1a1a2e; color: #fff; font-family: sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0;">
              <div style="text-align: center;">
                <h1>✓ Authorization Complete</h1>
                <p>You can close this window and return to Zenith.</p>
              </div>
            </body>
          </html>
        `);

        // Send the auth data to renderer
        if (mainWindow) {
          mainWindow.webContents.send('spotify-oauth-callback', { code, state, error });
        }

        // Close server after handling callback
        setTimeout(() => {
          if (oauthServer) {
            oauthServer.close();
            oauthServer = null;
          }
        }, 1000);
      } else {
        res.writeHead(404);
        res.end('Not found');
      }
    });

    oauthServer.listen(8888, 'localhost', () => {
      console.log('OAuth callback server listening on http://localhost:8888');
      resolve({ success: true, port: 8888 });
    });

    oauthServer.on('error', (error) => {
      console.error('OAuth server error:', error);
      reject(error);
    });
  });
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

// Compact Mode handlers
let normalBounds = null;

ipcMain.on('set-compact-mode', () => {
  if (!mainWindow) return;

  normalBounds = mainWindow.getBounds();
  mainWindow.setSize(300, 130);
  mainWindow.setAlwaysOnTop(true, 'floating');
  mainWindow.setResizable(false);
  mainWindow.setBackgroundColor('#00000000');

  const { screen } = require('electron');
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.workAreaSize;
  mainWindow.setPosition(width - 320, height - 150);
});

ipcMain.on('resize-compact-window', (event, newHeight) => {
  if (!mainWindow) return;
  const targetHeight = Math.min(Math.max(newHeight, 130), 400);
  const currentBounds = mainWindow.getBounds();
  mainWindow.setSize(300, targetHeight);
});

ipcMain.on('set-normal-mode', () => {
  if (!mainWindow) return;

  mainWindow.setAlwaysOnTop(false);
  mainWindow.setResizable(true);
  mainWindow.setBackgroundColor('#111217');

  if (normalBounds) {
    mainWindow.setBounds(normalBounds);
  } else {
    mainWindow.maximize();
  }

  mainWindow.webContents.send('compact-mode-exited');
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("will-quit", () => {
  globalShortcut.unregisterAll();
});
