const vscode = require("vscode");
const fs = require("fs");
const path = require("path");
const { readFile } = require('fs/promises');

let treeItemsDataProject = [];
let userIconPath;
let globalStoragePath;
let userIcons = [];

class ProjectNoteDataProvider {

  constructor(context, localNotesPath) {
    this.context = context;
    this.localNotesPath = localNotesPath;
    this._onDidChangeTreeData = new vscode.EventEmitter();
    this.onDidChangeTreeData = this._onDidChangeTreeData.event;
    vscode.workspace.onDidRenameFiles(() => this.onRenameFiles());
//    vscode.workspace.onDidChangeTextDocument(() => this.onDidChangeTextDocument());
    vscode.workspace.onDidSaveTextDocument((e) => this.onSaveFiles(e));
    vscode.workspace.onDidChangeConfiguration(() => {
      this.localNotesFolder = vscode.workspace.getConfiguration('pnotes').get('localNotesFolder');
      this.refresh();
    });
    //this.DecoratorLocal = new ProjectDecorationProvider();
    new ProjectDecorationProvider(this);

  };

  getTreeItem(element) {
    return element;
  };

  getChildren(element) {
    if (element) {
      return element;
    } else {
      return this.convertFilesToTreeItemsProject();
    };
  };
  
  refresh() {
    //console.log("Refreshing Project Data Provider...");
    this._onDidChangeTreeData.fire();
  };

  onRenameFiles() {
    //console.log('Renamed File...');
    this.refresh();
  };

  // onDidChangeTextDocument() {
  //   console.log('Changed File...');
  //   this.refresh();
  // };

  onSaveFiles(e) {
    //console.log('Saved File...',e);
    this.refresh();
  };

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                 ● Function convertFilesToTreeItemsProject ●                  │
//  │                                                                              │
//  │               • Creates the Treeviews List of Project Notes •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
  async convertFilesToTreeItemsProject() {

    let projectFilesList = [];
    //console.log('Converting Projects...');
    // convertFilesToTreeItemsProject - Get All Local Project Files 
    const results = await fs.readdirSync(this.localNotesPath, {recursive: true,withFileTypes: true,}).filter(async (file) => {
      // Only interested in files
      if (file.isFile()) {
        // Only want Markdown files
        let fileNameLow = path.extname(file.name);
        fileNameLow.toLowerCase();
        if (await fileNameLow.slice(1) == 'md') {
          let fsPath = path.join(file.path, file.name);
          let base = path.basename(fsPath);
          let uri = vscode.Uri.file(path.join(file.path, file.name)).path;

          // convertFilesToTreeItemsProject - Get Task Count, Tasks Completed and Task Imcompleted for `(TODO).md` 
          let tasksCount = 0;
          let tasksCountStr = '0';
          let tasksCompleted = 0;
          let tasksCompletedStr = '0';
          let tasksIncompleted = 0;
          let tasksIncompletedStr = '0';
          if (await file.name === '(TODO).md') {
            //console.log('Here...');
            let fileDataTodo = await readFile(fsPath, {'encoding':'utf-8'});
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

          // convertFilesToTreeItemsProject - Get This Files Priority 
          let fileDataPriority = await readFile(fsPath, {'encoding':'utf-8'});
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

          // convertFilesToTreeItemsProject - Get This Files Icon 
          let iconFile = '';
          if (await yamlText != null) {
            const yamlIconRegex = new RegExp(/Icon:\s*"?'?(.+?)'?"?\s/si);
            let iconText = yamlIconRegex.exec(yamlText);
            if (iconText === null) {
              iconFile = '';
            } else {
              iconFile = iconText[1];
            };
//            console.log('iconFile:', iconFile);
          };

          // convertFilesToTreeItemsProject - Handle Other YAML Here 

          // convertFilesToTreeItemsProject - Get User Icons From Global Storage 
          globalStoragePath = this.context.globalStorageUri.fsPath;
          userIconPath = path.join(globalStoragePath,'userIcons');
          userIcons = [];
          // Create user icon path if it does not exist
          if (await !fs.existsSync(userIconPath)) {
            await fs.mkdirSync(userIconPath, { recursive: true });
          } else {
            const results = await fs.readdirSync(userIconPath, {recursive: true,withFileTypes: true,}).filter(async (file) => {
              if (file.isFile()) {
                let fileNameLow = path.extname(file.name);
                fileNameLow.toLowerCase();
                if (fileNameLow.slice(1) == 'svg') {
                  userIcons.push(file.name);
                };
              };
            });
          };

          // convertFilesToTreeItemsProject - Save All Collected Data to Array 
          projectFilesList.push({
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

    // convertFilesToTreeItemsProject - Wait for Project Files List Creation to Complete 
    let safetyValve = 0;
    while (projectFilesList.length === 0) {
      await new Promise(r => setTimeout(r, 100));
      safetyValve++
      if (safetyValve == 1000) {
        break;
      }
    };

    // convertFilesToTreeItemsProject - Sort the Project Files List 
    await projectFilesList.sort(compare);
    let treeItemsArray = [];
    let treeItemIndex = 0;
    treeItemsDataProject = [];   // Need to reset the tree items array
    projectFilesList.forEach((element) => {
      let item = new FileTreeItem(element, vscode.TreeItemCollapsibleState.None, userIcons);
      treeItemsArray.push(item);
      treeItemsDataProject.push(item);
      treeItemIndex++;
    });

    // convertFilesToTreeItemsProject - Return the Project Files List to Build Treeview 
    return treeItemsArray;

  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                      ● Class LocalDecorationProvider ●                       │
//  │                                                                              │
//  │               • Provides Decoration for my Treeview (Color) •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
class ProjectDecorationProvider {

  constructor(projectProvider) {
    //console.log('projectProvider:', projectProvider);
    this.disposables = [];
    this._onDidChangeFileDecorations = new vscode.EventEmitter();
    this.onDidChangeFileDecorations = this._onDidChangeFileDecorations.event;
    this.disposables.push(vscode.window.registerFileDecorationProvider(this));
    this.disposables.push(vscode.window.registerFileDecorationProvider(this.onDidChangeFileDecorations));
    //this.handleSaved();
    this.projectProvider = projectProvider;
    this.handleChange();
  }; 

  handleChange() {
    const changeDecoration = this._onDidChangeFileDecorations;
    this.projectProvider.onDidChangeTreeData(function () {
      changeDecoration.fire();
    });
  };

//   handleSaved() {
//     vscode.workspace.onDidSaveTextDocument(() => {
//       // Need delay to allow tree data to refresh first
//       console.log('Saved Project Decorations...');
// //      let delay = async () => {await new Promise(r => setTimeout(r, 1000))};
// //      delay();
//       this._onDidChangeFileDecorations.fire();
//     });
// };

//   refresh() {
//     // Need delay to allow tree data to refresh first
//     console.log('>>> Refreshing Project Decoration Provider...');
// //    let delay = async () => {await new Promise(r => setTimeout(r, 1000))};
// //    delay();
//     this._onDidChangeFileDecorations.fire();
//   };

  async provideFileDecoration(uri) {
    if (uri.scheme === 'foo') {
      //console.log('Updating Decorations...');
      let labelSearch = uri.authority;
      let index = 0;
      while (labelSearch != treeItemsDataProject[index].label) {
        index++
      };
      let priority = treeItemsDataProject[index].priority;
      let badge = treeItemsDataProject[index].badge;
      let label = treeItemsDataProject[index].label;
      const filenameTextColor = new vscode.ThemeColor('pnoteTreeItem.filenameTextColor');
      const scratchpadTextColor = new vscode.ThemeColor('pnoteTreeItem.scratchpadTextColor');
      const todoTextColor = new vscode.ThemeColor('pnoteTreeItem.todoTextColor');
      const priorityOneTextColor = new vscode.ThemeColor('pnoteTreeItem.priorityOneTextColor');
      const priorityTwoTextColor = new vscode.ThemeColor('pnoteTreeItem.priorityTwoTextColor');
      const priorityThreeTextColor = new vscode.ThemeColor('pnoteTreeItem.priorityThreeTextColor');
      const priorityFourTextColor = new vscode.ThemeColor('pnoteTreeItem.priorityFourTextColor');
      const priorityFiveTextColor = new vscode.ThemeColor('pnoteTreeItem.priorityFiveTextColor');
      if (label === '(Scratchpad).md') {
        return {
          color: scratchpadTextColor,       // Treeview filename foreground text color
          //badge: uri.authority,           // This is the number of keyword tags found in the file
          //tooltip: "",                    // This has no effect if defined in tree item constructor
          //propagate: true,                // This did not work for me? Not needed anyways.
        };
      } else if (label === '(TODO).md') {
        return {
          color: todoTextColor,
          badge: badge,
        };
      } else if (priority === '1') {
        //console.log('Doing Priority One...');
        return {
          color: priorityOneTextColor,
        };
      } else if (priority === '2') {
        //console.log('Doing Priority Two...');
        return {
          color: priorityTwoTextColor,
        };
      } else if (priority === '3') {
        //console.log('Doing Priority Three...');
        return {
          color: priorityThreeTextColor,
        };
      } else if (priority === '4') {
        //console.log('Doing Priority Four...');
        return {
          color: priorityFourTextColor,
        };
      } else if (priority === '5') {
        //console.log('Doing Priority Five...');
        return {
          color: priorityFiveTextColor,
        };
      } else {
        return {
          color: filenameTextColor,
        };
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
    if (fileData.fileName === '(TODO).md') {
      this.tooltip = `Total Tasks: ${fileData.tasksCount}\nIncompleted Tasks: ${fileData.tasksIncompleted}\nCompleted Tasks: ${fileData.tasksCompleted}\n\nFile Location...\n${this.fsPath}`
    } else {
      this.tooltip = `${fileData.fileName}\n\nFile Location...\n${this.fsPath}`;
    };
    if (userIcons.indexOf(this.iconFile) > -1) {
//      console.log('found it',this.iconFile);
      this.iconPath = path.join(userIconPath, this.iconFile)
    } else {
      this.iconPath = treeItemIcon(this.label, this.priority);
    };
    this.command = {
      command: "vscode.open",
      title: "Open",
      arguments: [this.uri]
    };
    // Pass Data to FileDecorator
    this.resourceUri = vscode.Uri.parse(`foo://${fileData.fileName}`);
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
module.exports = ProjectNoteDataProvider;
