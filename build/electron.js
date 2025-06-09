
const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  // Criar a janela principal
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
    },
    icon: path.join(__dirname, 'assets/icon.png'), // Opcional: ícone da aplicação
    show: false, // Não mostrar até estar pronto
  });

  // Carregar a aplicação
  const startUrl = isDev 
    ? 'http://localhost:5173' 
    : `file://${path.join(__dirname, '../build/index.html')}`;
  
  mainWindow.loadURL(startUrl);

  // Mostrar quando estiver pronto
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Abrir DevTools em desenvolvimento
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  // Emitido quando a janela é fechada
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Este método será chamado quando Electron terminar de inicializar
app.whenReady().then(createWindow);

// Sair quando todas as janelas forem fechadas
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Criar menu personalizado
const template = [
  {
    label: 'Arquivo',
    submenu: [
      {
        label: 'Novo Projeto',
        accelerator: 'CmdOrCtrl+N',
        click: () => {
          // Enviar evento para a aplicação React
          mainWindow.webContents.send('menu-new-project');
        }
      },
      { type: 'separator' },
      {
        label: 'Sair',
        accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
        click: () => {
          app.quit();
        }
      }
    ]
  },
  {
    label: 'Visualizar',
    submenu: [
      { role: 'reload' },
      { role: 'forceReload' },
      { role: 'toggleDevTools' },
      { type: 'separator' },
      { role: 'resetZoom' },
      { role: 'zoomIn' },
      { role: 'zoomOut' },
      { type: 'separator' },
      { role: 'togglefullscreen' }
    ]
  },
  {
    label: 'Ajuda',
    submenu: [
      {
        label: 'Sobre',
        click: () => {
          // Mostrar dialog sobre
        }
      }
    ]
  }
];

const menu = Menu.buildFromTemplate(template);
Menu.setApplicationMenu(menu);
