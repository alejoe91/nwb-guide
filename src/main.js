const {app, BrowserWindow, dialog} = require('electron')
app.showExitPrompt = true
const path = require('path')
const glob = require('glob')
const os = require("os")
const contextMenu = require('electron-context-menu');
const log  = require("electron-log");
require('v8-compile-cache')
const {ipcMain} = require('electron')
const { autoUpdater } = require("electron-updater");
const { JSONStorage } = require('node-localstorage');
const { trackEvent } = require('./scripts/analytics');
const { fstat } = require('fs');

log.transports.console.level = false
global.trackEvent = trackEvent;
const nodeStorage = new JSONStorage(app.getPath('userData'));
/*************************************************************
 * Python Process
 *************************************************************/

const PY_DIST_FOLDER = 'pysodadist'
const PY_FOLDER = 'pysoda'
const PY_MODULE = 'api' // without .py suffix

let pyProc = null
let pyPort = null

const guessPackaged = () => {
  const fullPath = path.join(__dirname, PY_DIST_FOLDER)
  return require('fs').existsSync(fullPath)
}

const getScriptPath = () => {
  if (!guessPackaged()) {
    return path.join(__dirname, PY_FOLDER, PY_MODULE + '.py')
  }
  if (process.platform === 'win32') {
    return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE, PY_MODULE + '.exe')
  }

  if (process.env.NODE_ENV === 'development')
  {
    return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE, PY_MODULE)
  }
  else
  {
    return path.join(__dirname, PY_DIST_FOLDER, PY_MODULE, PY_MODULE);
    return path.join(__dirname, "../app.asar.unpacked/"+ PY_DIST_FOLDER, PY_MODULE, PY_MODULE);
  }
}

const selectPort = () => {
  pyPort = 4242
  return pyPort
}

const createPyProc = () => {
  let script = getScriptPath()
  let port = '' + selectPort()

  log.info(script);
  if (require('fs').existsSync(script))
  {
    log.info("file exists");
  }
  else
  {
    log.info("file does not exist");
  }
  if (guessPackaged()) {
    log.info("execFile");
    pyProc = require('child_process').execFile(script, [port], { stdio: 'ignore' })
  } else {
    log.info("spawn");
    pyProc = require('child_process').spawn('python', [script, port], { stdio: 'ignore' })
  }

  log.info(pyProc);
  if (pyProc != null) {
    console.log('child process success on port ' + port)
    log.info('child process success on port ' + port)
  } else {
    console.error('child process failed to start on port' + port)
  }
}

const exitPyProc = () => {
  pyProc.kill()
  pyProc = null
  pyPort = null
}

app.on('ready', createPyProc)
app.on('will-quit', exitPyProc)


/*************************************************************
 * Main app window
 *************************************************************/

let mainWindow = null
let user_restart_confirmed = false;
let updatechecked = false;

function initialize () {
  makeSingleInstance()

  loadDemos()
  function createWindow () {

    // mainWindow.webContents.openDevTools();

    mainWindow.webContents.once('dom-ready', () => {
      if (updatechecked == false)
      {
        log.info('checking for updates');
        console.log("checking for updates");
        autoUpdater.checkForUpdatesAndNotify();
      }
    });

    mainWindow.on('close', (e) => {
      if (!user_restart_confirmed) {
        if (app.showExitPrompt) {
          e.preventDefault() // Prevents the window from closing
          if (user_restart_confirmed) {
            quit_app();
          }
          dialog.showMessageBox(BrowserWindow.getFocusedWindow(), {
            type: 'question',
            buttons: ['Yes', 'No'],
            title: 'Confirm',
            message: 'Any running proccess will be stopped. Are you sure you want to quit?'
          }, function (response) {
            if (response === 0) { // Runs the following if 'Yes' is clicked
              quit_app();
            }
          })
        }
      }
      else {
        if (process.platform == "darwin") {
          exitPyProc();
          app.relaunch();
          app.exit();
        }
        else {
          var first_launch = nodeStorage.getItem('firstlaunch');
          nodeStorage.setItem('firstlaunch', true);
          exitPyProc();
          app.exit();
        }
      }
    })

  }

  const quit_app = () => {
    app.showExitPrompt = false
    mainWindow.close()
    /// feedback form iframe prevents closing gracefully
    /// so force close
    if (!mainWindow.closed) {
      mainWindow.destroy()
    }
  }


  app.on('ready', () => {
    const windowOptions = {
      minWidth: 1080,
      minHeight: 680,
      width: 1080,
      height: 720,
      center: true,
      show: false,
      icon: __dirname + '/assets/menu-icon/soda_icon.png',
      webPreferences: {
        nodeIntegration: true,
        enableRemoteModule: true
      }
    }

    mainWindow = new BrowserWindow(windowOptions)
    mainWindow.loadURL(path.join('file://', __dirname, '/index.html'))

    const splash = new BrowserWindow({ width: 220, height: 190, frame: false, alwaysOnTop: true, transparent: true });
    splash.loadURL(path.join('file://', __dirname, '/splash-screen.html'));
    //
    // // if main window is ready to show, then destroy the splash window and show up the main window
    mainWindow.once('ready-to-show', () => {
    setTimeout(function(){
        splash.close();
        mainWindow.show();
        createWindow();
        var first_launch = nodeStorage.getItem('firstlaunch');
        if (first_launch == true || first_launch == undefined)
        {
          mainWindow.reload();
          mainWindow.focus();
          console.log("mainWindow reloaded for first launch");
          nodeStorage.setItem('firstlaunch', false);
        }
        log.info('checking');
        console.log("checking");
        autoUpdater.checkForUpdatesAndNotify();
        updatechecked = true;
        //trackEvent('Success', 'App Launched - OS',  os.platform() + "-" + os.release());
        //trackEvent('Success', 'App Launched - SODA',  app.getVersion());
      }, 5000);
    });
  })

  app.on('ready', () => {
    //createWindow()
    trackEvent('Success', 'App Launched - OS',  os.platform() + "-" + os.release());
    trackEvent('Success', 'App Launched - SODA',  app.getVersion());
  })

  app.on('window-all-closed', () => {
    // if (process.platform !== 'darwin') {
      app.quit()
    // }
  })
}

// Make this app a single instance app.
const gotTheLock = app.requestSingleInstanceLock()

function makeSingleInstance () {
  if (process.mas) return

  if (!gotTheLock) {
    app.quit()
  } else {

    app.on('second-instance', () => {
      if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore()
        mainWindow.focus()
      }
    })
  }
}

/*
the saveImage context Menu-Item works; however, it does not notify users that a download occurs.
If you check your download folder, you'll see it there.
See: https://github.com/nteract/nteract/issues/1655
showSaveImageAs prompts the users where they want to save the image.
*/
contextMenu()

// Require each JS file in the main-process dir
function loadDemos () {
  const files = glob.sync(path.join(__dirname, 'main-process/**/*.js'))
  files.forEach((file) => { require(file) })
}

initialize()


ipcMain.on('resize-window', (event, dir) => {
  var x = mainWindow.getSize()[0]
  var y = mainWindow.getSize()[1]
  if (dir === 'up'){
    x = x+1
    y = y+1
  } else {
    x = x-1
    y = y-1
  }
  mainWindow.setSize(x, y)
})

// Google analytics tracking function
// To use, category and action is required. Label and value can be left out
// if not needed. Sample requests from renderer.js is shown below:
//ipcRenderer.send('track-event', "App Backend", "Python Connection Established");
//ipcRenderer.send('track-event', "App Backend", "Errors", "server", error);

ipcMain.on("track-event", (event, category, action, label, value) => {
  if (label == undefined && value == undefined)
  {
    trackEvent(category, action);
  }
  else if (label != undefined && value == undefined)
  {
    trackEvent(category, action, label);
  }
  else
  {
    trackEvent(category, action, label, value);
  }
});

ipcMain.on("app_version", (event) => {
  event.sender.send("app_version", { version: app.getVersion() });
});

autoUpdater.on("update-available", () => {
  trackEvent("App Update", "Update Requested", "User OS", os.platform() + "-" + "-" + os.release() + " - SODAv" + app.getVersion());
  log.info('update_available');
  mainWindow.webContents.send("update_available");
});

autoUpdater.on("update-downloaded", () => {
  trackEvent("App Update", "Update Downloaded", "User OS", os.platform() + "-" + "-" + os.release() + " - SODAv" + app.getVersion());
  log.info('update_downloaded');
  mainWindow.webContents.send("update_downloaded");
});

ipcMain.on("restart_app", () => {
  user_restart_confirmed = true;
  trackEvent("App Update", "App Restarted", "User OS", os.platform() + "-" + "-" + os.release() + " - SODAv" + app.getVersion());
  log.info('quitAndInstall');
  autoUpdater.quitAndInstall();
});