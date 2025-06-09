
# Guia para Criar Executável Windows (.exe) com Electron

Este guia mostra como transformar sua aplicação React em um executável Windows usando Electron.

## 1. Configuração Inicial

### Instalar Dependências do Electron

```bash
npm install --save-dev electron electron-builder
npm install --save-dev concurrently wait-on
```

### Atualizar package.json

O arquivo package.json já está configurado com os scripts necessários:

```json
{
  "main": "build/electron.js",
  "homepage": "./",
  "scripts": {
    "electron": "electron .",
    "electron-dev": "concurrently \"npm start\" \"wait-on http://localhost:5173 && electron .\"",
    "electron-pack": "electron-builder",
    "preelectron-pack": "npm run build",
    "dist": "npm run build && electron-builder --publish=never"
  },
  "build": {
    "appId": "com.prestige.project-manager",
    "productName": "Prestige Project Manager",
    "directories": {
      "output": "dist"
    },
    "files": [
      "build/**/*",
      "node_modules/**/*"
    ],
    "win": {
      "target": "nsis",
      "icon": "assets/icon.ico"
    },
    "nsis": {
      "oneClick": false,
      "allowToChangeInstallationDirectory": true
    }
  }
}
```

## 2. Criar Arquivo Principal do Electron

Crie o arquivo `build/electron.js`:

```javascript
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
```

## 3. Configurar Ícones (Opcional)

Crie uma pasta `assets` na raiz do projeto e adicione:
- `icon.ico` (256x256px) para Windows
- `icon.png` (512x512px) para desenvolvimento

## 4. Scripts de Build

### Para Desenvolvimento:
```bash
npm run electron-dev
```

### Para Produção:
```bash
npm run dist
```

## 5. Processo de Build Completo

1. **Build da aplicação React:**
   ```bash
   npm run build
   ```

2. **Criar executável:**
   ```bash
   npm run electron-pack
   ```

3. **Ou fazer tudo de uma vez:**
   ```bash
   npm run dist
   ```

## 6. Resultado

O executável será gerado na pasta `dist/` com os seguintes arquivos:
- `Prestige Project Manager Setup.exe` - Instalador
- Pasta com arquivos descompactados para execução direta

## 7. Dicas Importantes

### Performance:
- O executável ficará entre 100-200MB devido ao Chromium
- Para reduzir tamanho, considere usar `electron-builder` com compressão

### Distribuição:
- Para distribuir, você precisará assinar digitalmente o executável
- Considere usar auto-updater para atualizações automáticas

### Debugging:
- Use `electron-log` para logs em produção
- Configure error reporting com Sentry ou similar

## 8. Configurações Avançadas

### Auto-Updater:
```javascript
const { autoUpdater } = require('electron-updater');

app.whenReady().then(() => {
  autoUpdater.checkForUpdatesAndNotify();
});
```

### Base de Dados Local:
A aplicação já usa localStorage, que funcionará normalmente no Electron.

### Notificações do Sistema:
```javascript
const { Notification } = require('electron');

new Notification({
  title: 'Projeto Concluído',
  body: 'O projeto foi finalizado com sucesso!'
}).show();
```

## Troubleshooting

### Erro de CORS:
Se encontrar erros de CORS, adicione no BrowserWindow:
```javascript
webSecurity: false
```

### Fonts não carregando:
Certifique-se de que as fonts estão incluídas no build.

### Performance lenta:
Considere usar `webPreferences.experimentalFeatures: true`
