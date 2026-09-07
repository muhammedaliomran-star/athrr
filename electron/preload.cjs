const { contextBridge, ipcRenderer } = require("electron");

function on(channel, cb) {
  const handler = (_e, payload) => cb(payload);
  ipcRenderer.on(channel, handler);
  return () => ipcRenderer.removeListener(channel, handler);
}

contextBridge.exposeInMainWorld("athar", {
  version: "desktop",
  listDrives: () => ipcRenderer.invoke("athar:listDrives"),
  startScan: (opts) => ipcRenderer.invoke("athar:startScan", opts),
  cancelScan: () => ipcRenderer.invoke("athar:cancelScan"),
  pauseScan: (paused) => ipcRenderer.invoke("athar:pauseScan", paused),
  onScanProgress: (cb) => on("athar:scanProgress", cb),
  onScanDone: (cb) => on("athar:scanDone", cb),
  onScanError: (cb) => on("athar:scanError", cb),
  chooseFolder: () => ipcRenderer.invoke("athar:chooseFolder"),
  defaultDestination: () => ipcRenderer.invoke("athar:defaultDestination"),
  recover: (opts) => ipcRenderer.invoke("athar:recover", opts),
  onRecoverProgress: (cb) => on("athar:recoverProgress", cb),
  clearCarved: () => ipcRenderer.invoke("athar:clearCarved"),
  openFolder: (p) => ipcRenderer.invoke("athar:openFolder", p),
});
