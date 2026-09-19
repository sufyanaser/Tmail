import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { app, BrowserWindow, Menu, session, shell, Tray, type Rectangle, type Session } from 'electron';
import { isSafeExternalUrl, isTrustedLarkUrl } from './security.js';

const APP_ID = 'org.tanasuq.tmail';
const SESSION_PARTITION = 'persist:tmail';
const MAIL_URL = 'https://cjp7nj6oqqn2.jp.larksuite.com/mail';
const SUPPORTED_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/153.0.0.0 Safari/537.36';
const __dirname = path.dirname(fileURLToPath(import.meta.url));

interface WindowState {
  bounds?: Rectangle;
  maximized?: boolean;
}

let mainWindow: BrowserWindow | null = null;
let tray: Tray | null = null;
let quitting = false;

function statePath(): string {
  return path.join(app.getPath('userData'), 'window-state.json');
}

function readWindowState(): WindowState {
  try {
    const file = statePath();
    if (!existsSync(file)) return {};
    return JSON.parse(readFileSync(file, 'utf8')) as WindowState;
  } catch {
    return {};
  }
}

function saveWindowState(window: BrowserWindow): void {
  if (window.isDestroyed()) return;
  const state: WindowState = {
    bounds: window.isMaximized() ? window.getNormalBounds() : window.getBounds(),
    maximized: window.isMaximized(),
  };
  try {
    writeFileSync(statePath(), JSON.stringify(state), { encoding: 'utf8', mode: 0o600 });
  } catch (error) {
    console.error('Unable to persist window state.', error);
  }
}

function configureSession(mailSession: Session): void {
  mailSession.setUserAgent(SUPPORTED_USER_AGENT);
  mailSession.setPermissionCheckHandler((_webContents, permission, requestingOrigin) =>
    permission === 'notifications' && isTrustedLarkUrl(requestingOrigin),
  );
  mailSession.setPermissionRequestHandler((webContents, permission, callback, details) => {
    const requestingUrl = details.requestingUrl || webContents.getURL();
    callback(permission === 'notifications' && isTrustedLarkUrl(requestingUrl));
  });
}

function secureWebContents(window: BrowserWindow): void {
  window.webContents.on('will-navigate', (event, url) => {
    if (isTrustedLarkUrl(url)) return;
    event.preventDefault();
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
  });
  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isTrustedLarkUrl(url)) {
      return {
        action: 'allow',
        overrideBrowserWindowOptions: {
          autoHideMenuBar: true,
          webPreferences: {
            partition: SESSION_PARTITION,
            nodeIntegration: false,
            contextIsolation: true,
            sandbox: true,
            webSecurity: true,
            allowRunningInsecureContent: false,
          },
        },
      };
    }
    if (isSafeExternalUrl(url)) void shell.openExternal(url);
    return { action: 'deny' };
  });
}

async function loadMail(window: BrowserWindow): Promise<void> {
  try {
    await window.loadURL(MAIL_URL);
  } catch (error) {
    console.error('Unable to load Lark Mail.', error);
    if (!window.isDestroyed()) await window.loadFile(path.join(__dirname, 'error.html'));
  }
}

function createMainWindow(): BrowserWindow {
  const saved = readWindowState();
  const window = new BrowserWindow({
    title: 'Tmail',
    width: saved.bounds?.width ?? 1280,
    height: saved.bounds?.height ?? 820,
    ...(saved.bounds ? { x: saved.bounds.x, y: saved.bounds.y } : {}),
    minWidth: 920,
    minHeight: 640,
    show: false,
    autoHideMenuBar: true,
    backgroundColor: '#ffffff',
    webPreferences: {
      partition: SESSION_PARTITION,
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
      webSecurity: true,
      allowRunningInsecureContent: false,
      spellcheck: true,
      safeDialogs: true,
    },
  });
  window.setMenu(null);
  window.webContents.setUserAgent(SUPPORTED_USER_AGENT);
  secureWebContents(window);
  window.on('page-title-updated', (event) => {
    event.preventDefault();
    window.setTitle('Tmail');
  });
  window.once('ready-to-show', () => {
    if (saved.maximized) window.maximize();
    window.show();
  });
  window.on('close', (event) => {
    saveWindowState(window);
    if (!quitting) {
      event.preventDefault();
      window.hide();
    }
  });
  window.on('closed', () => {
    mainWindow = null;
  });
  void loadMail(window);
  return window;
}

function showMainWindow(): void {
  if (!mainWindow || mainWindow.isDestroyed()) mainWindow = createMainWindow();
  if (mainWindow.isMinimized()) mainWindow.restore();
  mainWindow.show();
  mainWindow.focus();
}

async function createTray(): Promise<void> {
  const icon = await app.getFileIcon(process.execPath, { size: 'small' });
  tray = new Tray(icon);
  tray.setToolTip('Tmail');
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Open Tmail', click: showMainWindow },
    { type: 'separator' },
    { label: 'Quit', click: () => { quitting = true; app.quit(); } },
  ]));
  tray.on('double-click', showMainWindow);
}

const singleInstanceLock = app.requestSingleInstanceLock();
if (!singleInstanceLock) app.quit();
else app.on('second-instance', showMainWindow);

app.setAppUserModelId(APP_ID);
app.userAgentFallback = SUPPORTED_USER_AGENT;
app.commandLine.appendSwitch('disable-features', 'UserAgentClientHint');

app.whenReady().then(async () => {
  Menu.setApplicationMenu(null);
  configureSession(session.fromPartition(SESSION_PARTITION));
  if (!process.argv.includes('--disable-auto-start')) {
    app.setLoginItemSettings({ openAtLogin: true, path: process.execPath });
  }
  mainWindow = createMainWindow();
  await createTray();
  app.on('activate', showMainWindow);
}).catch((error: unknown) => {
  console.error('Tmail failed to initialize.', error);
  app.exit(1);
});

app.on('before-quit', () => { quitting = true; });
app.on('window-all-closed', () => { /* Keep the tray process alive for notifications. */ });
