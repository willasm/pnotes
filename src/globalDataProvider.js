const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { readFile } = require('fs/promises');

let treeItemsDataGlobal = [];
let userIconPath;
let globalStoragePath;
let userIcons = [];

class GlobalNoteDataProvider {

  constructor(context, globalNotesFolder) {
    this.context = context;
    this.globalNotesFolder = globalNotesFolder;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    vscode.workspace.onDidCreateFiles(() => this.onCreateFiles());
    vscode.workspace.onDidDeleteFiles(() => this.onDeleteFiles());
    vscode.workspace.onDidRenameFiles(() => this.onRenameFiles());
    vscode.workspace.onDidSaveTextDocument(() => this.onSaveFiles());
    this.decoratorGlobal = new GlobalDecorationProvider(this);
  };

  getTreeItem(element) {
    return element;
  };

  getChildren(element) {
    if (element) {
      return element;
    } else {
      return this.convertFilesToTreeItemsGlobal();
    };
  };

  async refreshGlobal() {
    //console.log("Refreshing Global Data Provider...");
    this._onDidChangeTreeData.fire();
    await new Promise(r => setTimeout(r, 500));
    this.decoratorGlobal._onDidChangeFileDecorations.fire();
  };

  onCreateFiles() {
    //console.log('Created File...');
    this.refreshGlobal();
  };

  onDeleteFiles() {
    //console.log('Deleted File...');
    this.refreshGlobal();
  };

  onRenameFiles() {
    //console.log('Renamed File...');
    this.refreshGlobal();
  };

  onSaveFiles() {
    //console.log('Saved Global File...');
    this.refreshGlobal();
  };

  //  ╭──────────────────────────────────────────────────────────────────────────────╮
  //  │                  ● Function convertFilesToTreeItemsGlobal ●                  │
  //  │                                                                              │
  //  │                • Creates the Treeviews List of Global Notes •                │
  //  ╰──────────────────────────────────────────────────────────────────────────────╯
  async convertFilesToTreeItemsGlobal() {

    // convertFilesToTreeItemsGlobal - Get All Global Project Files 
    let globalFilesList = [];
    const results = await fs.readdirSync(this.globalNotesFolder, { recursive: true, withFileTypes: true, }).filter(async (file) => {
      // Only interested in files
      if (file.isFile()) {
        // Only want Markdown files
        let fileNameLow = path.extname(file.name);
        fileNameLow.toLowerCase();
        if (await fileNameLow.slice(1) == 'md') {
          let fsPath = path.join(file.parentPath, file.name);
          let base = path.basename(fsPath);
          let uri = vscode.Uri.file(path.join(file.parentPath, file.name)).path;

          // convertFilesToTreeItemsGlobal - Get This Files Priority 
          let fileDataPriority = await readFile(fsPath, { 'encoding': 'utf-8' });
          const yamlRegex = new RegExp(/---.+---/s);
          let yamlText = yamlRegex.exec(fileDataPriority);
          let priority = '0';
          if (await yamlText != null) {
            const yamlPriorityRegex = new RegExp(/[^]Priority:\s*([1-5])\s/si);
            let priorityText = yamlPriorityRegex.exec(yamlText);
            if (priorityText === null) {
              priority = '0';
            } else {
              priority = priorityText[1];
            };
          };

          // convertFilesToTreeItemsGlobal - Get This Files Icon 
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

          // convertFilesToTreeItemsGlobal - Handle Other YAML Here 


          // convertFilesToTreeItemsGlobal - Get User Icons From Global Storage 
          globalStoragePath = this.context.globalStorageUri.fsPath;
          userIconPath = path.join(globalStoragePath, 'userIcons');
          userIcons = [];
          // Create user icon path if it does not exist
          if (!fs.existsSync(userIconPath)) {
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

          // convertFilesToTreeItemsGlobal - Save All Collected Data to Array 
          globalFilesList.push({
            fileName: base,
            fsPath: fsPath,
            uri: uri,
            priority: priority,
            iconFile: iconFile
          });
        };
      };
    });

    // convertFilesToTreeItemsGlobal - Wait for Global Files List Creation to Complete 
    await new Promise((resolve) => setTimeout(resolve, 250));
    if (globalFilesList.length === 0) {
      return;
    };

    // convertFilesToTreeItemsGlobal - Sort the Project Files List 
    await globalFilesList.sort(compare);
    let treeItemsArray = [];
    let treeItemIndex = 0;
    treeItemsDataGlobal = [];   // Need to reset the tree items array
    globalFilesList.forEach((element) => {
      let item = new FileTreeItem(element, vscode.TreeItemCollapsibleState.None, userIcons);
      treeItemsArray.push(item);
      treeItemsDataGlobal.push(item);
      treeItemIndex++;
    });

    // convertFilesToTreeItemsGlobal - Return the Project Files List to Build Treeview 
    return treeItemsArray;

  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                      ● Class GlobalDecorationProvider ●                      │
//  │                                                                              │
//  │               • Provides Decoration for my Treeview (Color) •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
class GlobalDecorationProvider {

  constructor(globalProvider) {
    this.disposables = [];
    this._onDidChangeFileDecorations = new vscode.EventEmitter();
    this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    this.disposables.push(vscode.window.registerFileDecorationProvider(this));
    this.disposables.push(vscode.window.registerFileDecorationProvider(this.onDidChangeFileDecorations));
    this.globalProvider = globalProvider;
  };

  async provideFileDecoration(uri) {
    if (uri.scheme === 'bar') {
      let labelSearch = uri.authority;
      let index = 0;
      while (labelSearch != treeItemsDataGlobal[index].label) {
        index++;
      };
      let priority = treeItemsDataGlobal[index].priority;
      let label = treeItemsDataGlobal[index].label;
      if (label === '(Project Notes Guide).md') {
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.guideTextColor'), // Treeview filename foreground text color
          //badge: uri.authority,                                       // This is the number of keyword tags found in the file
          //tooltip: "",                                                // This has no effect if defined in tree item constructor
          //propagate: true,                                            // This did not work for me? Not needed anyways.
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
        //console.log('Global Default Color');
        return {
          color: new vscode.ThemeColor('pnoteTreeItem.filenameTextColor'),
        };
      } else {
        return undefined;
      };
    };
    return undefined;
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
  // priority: priority

  constructor(fileData, collapsibleState, userIcons) {
    this.collapsibleState = collapsibleState;
    this.label = `${fileData.fileName}`;
    this.fsPath = `${fileData.fsPath}`;
    this.uri = `${fileData.uri}`;
    this.priority = fileData.priority;
    this.iconFile = fileData.iconFile;
    if (fileData.fileName === '(Project Notes Guide).md') {
      this.tooltip = `This is a quick guide for the "Project Notes" extension\nIt is ok to delete this if you no longer wish to see it\n\nFile Location...\n${this.fsPath}`;
      this.command = {
        command: "vscode.open",
        title: "Open",
        //        command: "markdown.showPreview",
        //        title: "showPreview",
        //        command: "pnotes.previewGlobalNote",
        //        title: "Preview Global Note",
        arguments: [fileData.uri],
      };
    } else {
      this.tooltip = `${fileData.fileName}\n\nFile Location...\n${this.fsPath}`;
      this.command = {
        command: "vscode.open",
        title: "Open",
        arguments: [fileData.uri]
      };
    };
    if (userIcons.indexOf(this.iconFile) > -1) {
      this.iconPath = path.join(userIconPath, this.iconFile);
    } else {
      this.iconPath = treeItemIcon(this.label, this.priority);
    };
    //      this.iconPath = treeItemIcon(this.label, this.priority);
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
  if (fname === '(project notes guide).md') {
    return path.join(__filename, '..', '..', 'images', 'icons', 'information.svg');
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
  }
  return comparison;
};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Export modules ●                              │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
module.exports = GlobalNoteDataProvider;
