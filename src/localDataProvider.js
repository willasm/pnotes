const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { readFile } = require('fs/promises');

let treeItemsDataLocal = [];
let userIconPath;
let globalStoragePath;
let userIcons = [];

class LocalNoteDataProvider {

  constructor(context, localNotesFolder) {
    this.context = context;
    this.localNotesFolder = localNotesFolder;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    vscode.workspace.onDidCreateFiles(() => this.onCreateFiles());
    vscode.workspace.onDidDeleteFiles(() => this.onDeleteFiles());
    vscode.workspace.onDidRenameFiles(() => this.onRenameFiles());
    vscode.workspace.onDidSaveTextDocument(() => this.onSaveFiles());
    this.decoratorLocal = new LocalDecorationProvider(this);
  };

  getTreeItem(element) {
    return element;
  };

  getChildren(element) {
    if (element) {
      return element;
    } else {
      return this.convertFilesToTreeItemsLocal();
    };
  };

  async refreshLocal() {
    //console.log("Refreshing Local Data Provider...");
    this._onDidChangeTreeData.fire();
    await new Promise(r => setTimeout(r, 500));
    this.decoratorLocal._onDidChangeFileDecorations.fire();
  };

  onCreateFiles() {
    //console.log('Created File...');
    this.refreshLocal();
  };

  onDeleteFiles() {
    //console.log('Deleted File...');
    this.refreshLocal();
  };

  onRenameFiles() {
    //console.log('Renamed File...');
    this.refreshLocal();
  };

  onSaveFiles() {
    //console.log('Saved Local File...');
    this.refreshLocal();
  };

  //  ╭──────────────────────────────────────────────────────────────────────────────╮
  //  │                  ● Function convertFilesToTreeItemsLocal ●                   │
  //  │                                                                              │
  //  │                • Creates the Treeviews List of Local Notes •                 │
  //  ╰──────────────────────────────────────────────────────────────────────────────╯
  async convertFilesToTreeItemsLocal() {

    // convertFilesToTreeItemsLocal - Get All Local Project Files 
    let localFilesList = [];
    const results = await fs.readdirSync(this.localNotesFolder, { recursive: true, withFileTypes: true, }).filter(async (file) => {
      // Only interested in files
      if (file.isFile()) {
        // Only want Markdown files
        let fileNameLow = path.extname(file.name);
        fileNameLow.toLowerCase();
        if (await fileNameLow.slice(1) == 'md') {
          let fsPath = path.join(file.parentPath, file.name);
          let base = path.basename(fsPath);
          let uri = vscode.Uri.file(path.join(file.parentPath, file.name)).path;

          // convertFilesToTreeItemsLocal - Get Task Count, Tasks Completed and Task Imcompleted for `(TODO).md` 
          let tasksCount = 0;
          let tasksCountStr = '0';
          let tasksCompleted = 0;
          let tasksCompletedStr = '0';
          let tasksIncompleted = 0;
          let tasksIncompletedStr = '0';
          if (await file.name === '(TODO).md') {
            let fileDataTodo = await readFile(fsPath, { 'encoding': 'utf-8' });
            const taskIncompletedRegex = new RegExp(/-\s+\[ \]/g);
            while (await taskIncompletedRegex.exec(fileDataTodo)) {
              tasksCount++;
              tasksIncompleted++;
            };
            const taskCompletedRegex = new RegExp(/-\s+\[x\]/gi);
            while (await taskCompletedRegex.exec(fileDataTodo)) {
              tasksCount++;
              tasksCompleted++;
            };
            tasksCountStr = tasksCount.toString();
            tasksCompletedStr = tasksCompleted.toString();
            tasksIncompletedStr = tasksIncompleted.toString();
          };

          // convertFilesToTreeItemsLocal - Get This Files Priority 
          let fileDataPriority = await readFile(fsPath, { 'encoding': 'utf-8' });
          const yamlRegex = new RegExp(/---.+---/s);
          let yamlText = yamlRegex.exec(fileDataPriority);
          let priority = '0';
          if (await yamlText != null) {
            const yamlPriorityRegex = new RegExp(/Priority:\s*([1-5])\s/si);
            let priorityText = yamlPriorityRegex.exec(yamlText);
            if (priorityText === null) {
              priority = '0';
            } else {
              priority = priorityText[1];
            };
          };

          // convertFilesToTreeItemsLocal - Get This Files Icon 
          let iconFile = '';
          if (await yamlText != null) {
            const yamlIconRegex = new RegExp(/Icon:\s*"?'?(.+?)'?"?\s/si);
            let iconText = yamlIconRegex.exec(yamlText);
            if (iconText === null) {
              iconFile = '';
            } else {
              iconFile = iconText[1];
            };
          };

          // convertFilesToTreeItemsLocal - Handle Other YAML Here 


          // convertFilesToTreeItemsLocal - Get User Icons From Global Storage 
          globalStoragePath = this.context.globalStorageUri.fsPath;
          userIconPath = path.join(globalStoragePath, 'userIcons');
          userIcons = [];
          // Create user icon path if it does not exist
          if (await !fs.existsSync(userIconPath)) {
            await fs.mkdirSync(userIconPath, { recursive: true });
          } else {
            const results = await fs.readdirSync(userIconPath, { recursive: true, withFileTypes: true, }).filter(async (file) => {
              if (file.isFile()) {
                let fileNameLow = path.extname(file.name);
                fileNameLow.toLowerCase();
                if (fileNameLow.slice(1) == 'svg') {
                  userIcons.push(file.name);
                };
              };
            });
          };

          // convertFilesToTreeItemsLocal - Save All Collected Data to Array 
          localFilesList.push({
            fileName: base,
            fsPath: fsPath,
            uri: uri,
            tasksCount: tasksCountStr,
            tasksCompleted: tasksCompletedStr,
            tasksIncompleted: tasksIncompletedStr,
            priority: priority,
            iconFile: iconFile
          });
        };
      };
    });

    // convertFilesToTreeItemsLocal - Wait for Local Files List Creation to Complete 
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (localFilesList.length === 0) {
      return;
    };

    // convertFilesToTreeItemsLocal - Sort the Local Files List 
    await localFilesList.sort(compare);
    let treeItemsArray = [];
    let treeItemIndex = 0;
    treeItemsDataLocal = [];   // Need to reset the tree items array
    localFilesList.forEach((element) => {
      let item = new FileTreeItem(element, vscode.TreeItemCollapsibleState.None, userIcons);
      treeItemsArray.push(item);
      treeItemsDataLocal.push(item);
      treeItemIndex++;
    });

    // convertFilesToTreeItemsLocal - Return the Local Files List to Build Treeview 
    return treeItemsArray;

  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                      ● Class LocalDecorationProvider ●                       │
//  │                                                                              │
//  │               • Provides Decoration for my Treeview (Color) •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
class LocalDecorationProvider {

  constructor(localProvider) {
    this.disposables = [];
    this._onDidChangeFileDecorations = new vscode.EventEmitter();
    this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    this.disposables.push(vscode.window.registerFileDecorationProvider(this));
    this.disposables.push(vscode.window.registerFileDecorationProvider(this.onDidChangeFileDecorations));
    this.localProvider = localProvider;
  };

  async provideFileDecoration(uri) {
    if (uri.scheme === 'bar') {
      let labelSearch = uri.authority;
      let index = 0;
      while (labelSearch != treeItemsDataLocal[index].label) {
        index++;
      };
      let priority = treeItemsDataLocal[index].priority;
      let badge = treeItemsDataLocal[index].badge;
      let label = treeItemsDataLocal[index].label;
      if (label === '(Scratchpad).md') {
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.scratchpadTextColor'),  // Treeview filename foreground text color
          //badge: uri.authority,                                             // This is the number of keyword tags found in the file
          //tooltip: "",                                                      // This has no effect if defined in tree item constructor
          //propagate: true,                                                  // This did not work for me? Not needed anyways.
        };
      } else if (label === '(TODO).md') {
        //console.log("📢badge: ", badge);
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.todoTextColor'),
          badge: badge
        };
      } else if (priority === '1') {
        //console.log('Doing Priority One...');
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.priorityOneTextColor'),
          badge: "1"
        };
      } else if (priority === '2') {
        //console.log('Doing Priority Two...');
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.priorityTwoTextColor'),
          badge: "2"
        };
      } else if (priority === '3') {
        //console.log('Doing Priority Three...');
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.priorityThreeTextColor'),
          badge: "3"
        };
      } else if (priority === '4') {
        //console.log('Doing Priority Four...');
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.priorityFourTextColor'),
          badge: "4"
        };
      } else if (priority === '5') {
        //console.log('Doing Priority Five...');
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.priorityFiveTextColor'),
          badge: "5"
        };
      } else if (priority === '0') {
        //console.log("Local Default Color");
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.filenameTextColor'),
        };
      } else {
        return undefined;
      };
    };
  };

  dispose() {
    this.disposables.forEach((d) => d.dispose());
  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                            ● Class FileTreeItem ●                            │
//  │                                                                              │
//  │                 • Creates a New Tree Item For Current File •                 │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
class FileTreeItem {
  // we must provide the property label for it to show up the tree view
  //-------------------------------------------------------------------
  // [fileData Array]
  //-----------------
  // fileName: base,
  // fsPath: fsPath,
  // uri: uri,
  // taskCount: taskCount,
  // tasksCompleted: tasksIncompletedStr,
  // tasksIncompleted: tasksIncompletedStr,
  // priority: priority
  // iconFile: iconFile

  constructor(fileData, collapsibleState, userIcons) {
    this.collapsibleState = collapsibleState;
    this.label = fileData.fileName;
    this.fsPath = fileData.fsPath;
    this.uri = fileData.uri;
    this.badge = fileData.tasksCount;
    this.priority = fileData.priority;
    this.iconFile = fileData.iconFile;
    if (fileData.fileName === '(Scratchpad).md') {
      this.tooltip = `${fileData.fileName}\n\nUse for short term quick notes that don't require a permanent note\n\nFile Location...\n${this.fsPath}`;
    } else if (fileData.fileName === '(TODO).md') {
      this.tooltip = `Total Tasks: ${fileData.tasksCount}\nIncompleted Tasks: ${fileData.tasksIncompleted}\nCompleted Tasks: ${fileData.tasksCompleted}\n\nFile Location...\n${this.fsPath}`;
    } else {
      this.tooltip = `${fileData.fileName}\n\nFile Location...\n${this.fsPath}`;
    };
    if (userIcons.indexOf(this.iconFile) > -1) {
      this.iconPath = path.join(userIconPath, this.iconFile);
    } else {
      this.iconPath = treeItemIcon(this.label, this.priority);
    };
    this.command = {
      command: "vscode.open",
      title: "Open",
      arguments: [this.uri]
    };
    if (userIcons.indexOf(this.iconFile) > -1) {
      this.iconPath = path.join(userIconPath, this.iconFile);
    } else {
      this.iconPath = treeItemIcon(this.label, this.priority);
    };
    // Pass Data to FileDecorator
    this.resourceUri = vscode.Uri.parse(`bar://${fileData.fileName}`);
  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function treeItemIcon ●                           │
//  │                                                                              │
//  │     • Sets the Icons for Filename Items Based on its Name or Priority •      │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function treeItemIcon(fname, priority) {

  fname = fname.toLowerCase();
  if (fname === '(scratchpad).md') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'scratchpad.svg');
  } else if (fname === '(todo).md') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'todo.svg');
  } else if (priority === '1') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'p1-red-circle.svg');
  } else if (priority === '2') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'p2-orange-circle.svg');
  } else if (priority === '3') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'p3-yellow-circle.svg');
  } else if (priority === '4') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'p4-green-circle.svg');
  } else if (priority === '5') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'p5-blue-circle.svg');
  } else {
    return path.join(__filename, '..', '..', 'images', 'icons', 'blank.svg');
  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                             ● Function compare ●                             │
//  │                                                                              │
//  │                     • Used to Sort an Array of Strings •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function compare(a, b) {
  // Use toUpperCase() to ignore character casing
  const fileA = a.fileName.toUpperCase();
  const fileB = b.fileName.toUpperCase();
  let comparison = 0;
  if (fileA > fileB) {
    comparison = 1;
  } else if (fileA < fileB) {
    comparison = -1;
  };
  return comparison;
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Export modules ●                              │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
module.exports = LocalNoteDataProvider;
