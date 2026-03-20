const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 640,
    minHeight: 480,
    title: '工数計算ツール',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
    // タスクバー用アイコン（dist/icon-192.png があれば使用）
    // icon: path.join(__dirname, '../dist/icon-192.png'),
  })

  // 本番ビルドのHTMLを読み込む
  win.loadFile(path.join(__dirname, '../dist/index.html'))
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  app.quit()
})
