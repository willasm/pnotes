"use strict";

const vscode = require("vscode");
const fs = require("fs-extra");
const path = require("path");
const os = require("os");

const LocalProvider = require("./localDataProvider.js");
const GlobalProvider = require("./globalDataProvider.js");
const { error } = require("console");
const { existsSync } = require("fs");
let settings = vscode.workspace.getConfiguration("pnotes");
let oldSettings = vscode.workspace.getConfiguration("project-notes");
let oldLocalPath = oldSettings.get("localNotesFolder") || ".pnotes";
let allProjectNotesLocation = settings.get("projectNotesFolderLocation");
let useScratchpad = settings.get("autoCreateScratchpadLocalProjectNote");
let useTodo = settings.get("autoCreateTodoLocalProjectNote");
let useGuide = settings.get("createGlobalProjectNotesGuideFile");
let usePrompt = settings.get("promptMoveLocalNotes");
//let guideImage = vscode.extensions.getExtension('willasm.pnotes').packageJSON.extensionLocation.fsPath+path.sep+'images'+path.sep+'ProjectNotesSidebar.png';
let allProjectNotesFolder = "";
let projectsOldPnotesFolder = "";
let localNotesRootFolder = "";
let globalNotesRootFolder = "";
let thisProjectsNotesFolder = "";
let thisProjectsNotesFolderName = "";

let myContext;

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                            ● Function activate ●                             │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function activate(context) {

  // activate - Initialize Extension 
  //--------------------------------------------------------------------------------
  myContext = context;                    // Save context

  // activate - Get Folders Configuration 
  if (allProjectNotesLocation === "" || allProjectNotesLocation === undefined) {
    allProjectNotesLocation = os.homedir();
    settings.update("projectNotesFolderLocation", allProjectNotesLocation, true);
    allProjectNotesFolder = path.join(os.homedir(), path.sep, '.projectnotes');
    localNotesRootFolder = path.join(allProjectNotesFolder, path.sep, 'projects');
    globalNotesRootFolder = path.join(allProjectNotesFolder, path.sep, 'global');
    await fs.mkdirSync(allProjectNotesFolder,(err) => {if (err) throw err});
    await fs.mkdirSync(localNotesRootFolder,(err) => {if (err) throw err});
    await fs.mkdirSync(globalNotesRootFolder,(err) => {if (err) throw err});
  } else {
    allProjectNotesFolder = path.join(allProjectNotesLocation, path.sep, '.projectnotes');
    localNotesRootFolder = path.join(allProjectNotesFolder, path.sep, 'projects');
    globalNotesRootFolder = path.join(allProjectNotesFolder, path.sep, 'global');
    if (!fs.existsSync(allProjectNotesFolder)) {
      await fs.mkdirSync(allProjectNotesFolder,(err) => {if (err) throw err});
      await fs.mkdirSync(localNotesRootFolder,(err) => {if (err) throw err});
      await fs.mkdirSync(globalNotesRootFolder,(err) => {if (err) throw err});
    };
  };
  
  // activate - Get This Projects Local Notes Folder 
  let workspaceFolders = vscode.workspace.workspaceFolders
  const hashCode = s => s.split('').reduce((a,b)=>{a=((a<<5)-a)+b.charCodeAt(0);return a&a},0)>>>0;
  if (workspaceFolders.length === 0) {
    return;
  } else if (workspaceFolders.length === 1) {
    let thisProjectsNotesFolderNameFull = workspaceFolders[0].uri.fsPath;
    let nameHash = hashCode(thisProjectsNotesFolderNameFull);
    thisProjectsNotesFolderName = thisProjectsNotesFolderNameFull.split(path.sep).pop()+nameHash;
    thisProjectsNotesFolder = path.join(localNotesRootFolder, path.sep, thisProjectsNotesFolderName);
  } else {
    let locFlag = false;
    for (let i = 0; i < workspaceFolders.length; i++) {
      let thisProjectsNotesFolderNameFull = workspaceFolders[i].uri.fsPath;
      let nameHash = hashCode(thisProjectsNotesFolderNameFull);
      thisProjectsNotesFolderName = thisProjectsNotesFolderNameFull.split(path.sep).pop()+nameHash;
      if (fs.existsSync(path.join(localNotesRootFolder, path.sep, thisProjectsNotesFolderName))) {
        locFlag = true;
        thisProjectsNotesFolder = path.join(localNotesRootFolder, path.sep, thisProjectsNotesFolderName);
        break;
      };
    };
    if (!locFlag) {
      let choice = await vscode.window.showWorkspaceFolderPick({placeHolder: `Extension Project Notes requests a workspace name selection to be used for local notes`})
      if (choice === undefined) {
        let thisProjectsNotesFolderNameFull = workspaceFolders[0].uri.fsPath;
        let nameHash = hashCode(thisProjectsNotesFolderNameFull);
        thisProjectsNotesFolderName = thisProjectsNotesFolderNameFull.split(path.sep).pop()+nameHash;
        thisProjectsNotesFolder = path.join(localNotesRootFolder, path.sep, thisProjectsNotesFolderName);
        thisProjectsNotesFolder = path.join(localNotesRootFolder, path.sep, thisProjectsNotesFolderName);
          } else {
        let rootFolder = workspaceFolders[0].uri.fsPath;
        let rootFolderPath = rootFolder.substring(0, rootFolder.lastIndexOf('/'));
        let thisProjectsNotesFolderNameFull = path.join(rootFolderPath, path.sep, choice.name);
        let nameHash = hashCode(thisProjectsNotesFolderNameFull);
        thisProjectsNotesFolderName = thisProjectsNotesFolderNameFull.split(path.sep).pop()+nameHash;
        thisProjectsNotesFolder = path.join(localNotesRootFolder, path.sep, thisProjectsNotesFolderName);
      };
    };
  };
  // Create this projects notes folder if not yet created
  if (!fs.existsSync(thisProjectsNotesFolder)) {
    await fs.mkdirSync(thisProjectsNotesFolder,(err) => {if (err) throw err});
  };

  // activate - Initialize Default Notes 
  let localScratchpadFile = path.join(thisProjectsNotesFolder, path.sep, "(Scratchpad).md");
  let localTodoFile = path.join(thisProjectsNotesFolder, path.sep, "(TODO).md");
  let globalNotesTipsFile = path.join(globalNotesRootFolder, path.sep, "(Project Notes Guide).md");
  let localScratchpadFileSource = path.join(context.extensionPath, path.sep, "src", path.sep, "(Scratchpad).md");
  let scratchpadBuffer = await fs.readFileSync(localScratchpadFileSource, 'utf8');
  if (!fs.existsSync(localScratchpadFile)) {
    if (useScratchpad) {
      await fs.writeFileSync(localScratchpadFile, scratchpadBuffer);
    };
  };
  let localTodoFileSource = path.join(context.extensionPath, path.sep, "src", path.sep)+"(TODO).md";
  let todoBuffer = await fs.readFileSync(localTodoFileSource, 'utf8');
  if (!fs.existsSync(localTodoFile)) {
    if (useTodo) {
      await fs.writeFileSync(localTodoFile, todoBuffer);
    };
  };
  let globalNotesTipsFileSource = path.join(context.extensionPath, path.sep, "src", path.sep)+"(Project Notes Guide).md";
  let globalNotesTipsFileBuffer = await fs.readFileSync(globalNotesTipsFileSource, 'utf8');
  if (!fs.existsSync(globalNotesTipsFile)) {
    if (useGuide) {
      await fs.writeFileSync(globalNotesTipsFile, globalNotesTipsFileBuffer);
      settings.update("createGlobalProjectNotesGuideFile",false, true);
    };
  };

  // activate - Handle Local Notes in Old Local Folders Location 
  projectsOldPnotesFolder = path.join(workspaceFolders[0].uri.fsPath, oldLocalPath);
  if (fs.existsSync(projectsOldPnotesFolder)) {
    const oldFilesCount = await fs.readdirSync(projectsOldPnotesFolder).length
    if (oldFilesCount) {
      if (usePrompt) {
      let retSelection = await vscode.window.showInformationMessage('Local project notes detected in old location...','More Info', 'Move Them', 'Copy Them', 'Ignore');
        if (retSelection === "More Info") {
          let infoFile = await vscode.workspace.openTextDocument(path.join(context.extensionPath, path.sep, "src", path.sep, "LocalNotesHaveMoved.md"));
          const pathToNote = vscode.Uri.file(infoFile.uri.fsPath);
          await vscode.commands.executeCommand('markdown.showPreview', pathToNote);
        } else if (retSelection === "Move Them") {
          fs.moveSync(projectsOldPnotesFolder, thisProjectsNotesFolder, { overwrite: true });
        } else if (retSelection === "Copy Them") {
          fs.copySync(projectsOldPnotesFolder, thisProjectsNotesFolder, { overwrite: true, preserveTimestamps: true });
          fs.renameSync(projectsOldPnotesFolder, projectsOldPnotesFolder+'-bkp')
        } else if (retSelection === "Ignore") {
          settings.update("promptMoveLocalNotes", false, true);
        };
      };
    };
  };

// console.log("projectsOldPnotesFolder: ", projectsOldPnotesFolder);
// console.log("globalNotesTipsFile", globalNotesTipsFile);
// console.log("localTodoFile", localTodoFile);
// console.log("localScratchpadFile", localScratchpadFile);
// console.log('------------------------------------------');
// console.log("allProjectNotesLocation", allProjectNotesLocation);
// console.log("allProjectNotesFolder", allProjectNotesFolder);
// console.log("localNotesRootFolder", localNotesRootFolder);
// console.log("globalNotesRootFolder", globalNotesRootFolder);
// console.log("thisProjectsNotesFolder", thisProjectsNotesFolder);
// console.log("thisProjectsNotesFolderName", thisProjectsNotesFolderName);

  // activate - Remove Older Unused Settings 
  // Old Project Notes Settings
  oldSettings.update("globalNotesFolder", undefined, true);
  oldSettings.update("localNotesFolder", undefined, true);
  // Redundant pnotes Settings
  settings.update("globalNotesFolder", undefined, true);
  settings.update("localNotesFolder", undefined, true);
  settings.update("addLocalProjectsNoteFolderToGitIgnoreFile", undefined, true);
  settings.update("createGitIgnoreFileIfNotFound", undefined, true);

  // activate - Register Local Notes Treeview Data Provider 
  const LocalOutlineProvider = new LocalProvider(context, thisProjectsNotesFolder);
  vscode.window.registerTreeDataProvider('localNotesTreeview', LocalOutlineProvider);

  // activate - Register Global Notes Treeview Data Provider 
  const GlobalOutlineProvider = new GlobalProvider(context, globalNotesRootFolder);
  vscode.window.registerTreeDataProvider('globalNotesTreeview', GlobalOutlineProvider);

  // activate - Register Local Notes Refresh Treeview Command 
  vscode.commands.registerCommand("pnotes.refreshLocal", () =>
    LocalOutlineProvider.refresh()
  );

  // activate - Register Global Notes Refresh Treeview Command 
  vscode.commands.registerCommand("pnotes.refreshGlobal", () =>
    GlobalOutlineProvider.refresh()
  );

//   vscode.workspace.onWillSaveTextDocument(async () => {
//     console.log('doing');
//     await LocalOutlineProvider.refresh();
// //    vscode.commands.executeCommand("pnotes.refreshLocal");
//   });

//   vscode.workspace.onDidSaveTextDocument(async () => {
//     console.log('done');
//     await LocalOutlineProvider.refresh();
// //    vscode.commands.executeCommand("pnotes.refreshLocal");
//   });

  // activate - Create Local Notes folder file watcher 
  const localWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(thisProjectsNotesFolder), '**/*.{md,MD,Md,mD}'));
  localWatcher.onDidCreate(uri => LocalOutlineProvider.refresh()); // Listen to files/folders being created
  localWatcher.onDidDelete(uri => LocalOutlineProvider.refresh()); // Listen to files/folders getting deleted
  localWatcher.onDidChange(uri => LocalOutlineProvider.refresh()); // Listen to files/folders getting saved

  // activate - Create Global Notes folder file watcher 
  const globalWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(globalNotesRootFolder), '**/*.{md,MD,Md,mD}'));
  globalWatcher.onDidCreate(uri => GlobalOutlineProvider.refresh()); // Listen to files/folders being created
  globalWatcher.onDidDelete(uri => GlobalOutlineProvider.refresh()); // Listen to files/folders getting deleted
  globalWatcher.onDidChange(uri => GlobalOutlineProvider.refresh()); // Listen to files/folders getting saved

  // activate - Register Extension Commands 
  vscode.commands.registerCommand('pnotes.setNotesRootFolder', setNotesRootFolder);
  vscode.commands.registerCommand('pnotes.newLocalNote', newLocalNote);
  vscode.commands.registerCommand('pnotes.previewLocalNote', previewLocalNote);
  vscode.commands.registerCommand('pnotes.renameLocalNote', renameLocalNote);
  vscode.commands.registerCommand('pnotes.deleteLocalNote', deleteLocalNote);
  vscode.commands.registerCommand('pnotes.newGlobalNote', newGlobalNote);
  vscode.commands.registerCommand('pnotes.previewGlobalNote', previewGlobalNote);
  vscode.commands.registerCommand('pnotes.renameGlobalNote', renameGlobalNote);
  vscode.commands.registerCommand('pnotes.deleteGlobalNote', deleteGlobalNote);
  vscode.commands.registerCommand('pnotes.openNoteLink', openNoteLink);
  vscode.commands.registerCommand('pnotes.newTodo', newTodo);
  vscode.commands.registerCommand('pnotes.addUserIcons', addUserIcons);
  vscode.commands.registerCommand('pnotes.listUserIcons', listUserIcons);
  vscode.commands.registerCommand('pnotes.removeUserIcons', removeUserIcons);

  // activate - Push Subscriptions 
  context.subscriptions.push(setNotesRootFolder);
  context.subscriptions.push(newLocalNote);
  context.subscriptions.push(previewLocalNote);
  context.subscriptions.push(renameLocalNote);
  context.subscriptions.push(deleteLocalNote);
  context.subscriptions.push(newGlobalNote);
  context.subscriptions.push(previewGlobalNote);
  context.subscriptions.push(renameGlobalNote);
  context.subscriptions.push(deleteGlobalNote);
  context.subscriptions.push(openNoteLink);
  context.subscriptions.push(newTodo);
  context.subscriptions.push(addUserIcons);
  context.subscriptions.push(listUserIcons);
  context.subscriptions.push(removeUserIcons);
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                       ● Function setNotesRootFolder ●                        │
//  │                                                                              │
//  │                • Set Global and Local Notes Folder Location •                │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function setNotesRootFolder() {

  // setNotesRootFolder - Get Global Notes Folder From User 
  const home = vscode.Uri.file(path.join(os.homedir()))
  const options = {
    title: "Select Folder Location for Global and Local Notes",
    defaultUri: home,
    canSelectMany: false,
    canSelectFolders: true,
    canSelectFiles: false,
    openLabel: "Select Folder for All Global and Local Notes"
  };
  const folderUri = await vscode.window.showOpenDialog(options);
  if (folderUri && folderUri[0]) {
    if (fs.existsSync(path.join(allProjectNotesLocation, '.projectnotes'))) {
      await fs.renameSync(path.join(allProjectNotesLocation, '.projectnotes'), path.join(folderUri[0].fsPath, '.projectnotes'));
    };
    allProjectNotesLocation = folderUri[0].fsPath;
    await settings.update("projectNotesFolderLocation",allProjectNotesLocation,1);
    await vscode.commands.executeCommand('workbench.action.restartExtensionHost');
    //await vscode.commands.executeCommand('workbench.action.reloadWindow');
  };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function newLocalNote ●                           │
//  │                                                                              │
//  │                          • Create New Local Note •                           │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function newLocalNote() {

  // newLocalNote - Prompt user for new notes name 
  let fileName = await vscode.window.showInputBox({
    placeHolder: "Enter new project note name (Extension .md is not required)",
    prompt: "Create New Project Note: "
  });
  // newLocalNote - Return if no note name entered or user pressed escape 
  if (fileName === undefined || fileName === "") {
    return;
  }

  // newLocalNote - Get full path to new local note 
  let parts = fileName.split(".");
  fileName = parts[0]+'.md';
  let newLocalNote = path.join(thisProjectsNotesFolder, path.sep, fileName);

  // newLocalNote - Create New Project Note and Open for Editing  
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.createFile(vscode.Uri.file(newLocalNote), {overwrite: false});
  await vscode.workspace.applyEdit(workspaceEdit);
  const document = await vscode.workspace.openTextDocument(newLocalNote);
  vscode.window.showTextDocument(document, {preview: false});

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function previewLocalNote ●                         │
//  │                                                                              │
//  │                     • Open Local Note in Preview Mode •                      │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function previewLocalNote() {

  const pathToNote = vscode.Uri.file(arguments[0].fsPath);
  await vscode.commands.executeCommand('markdown.showPreview', pathToNote);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                         ● Function renameLocalNote ●                         │
//  │                                                                              │
//  │                            • Rename Local Note •                             │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function renameLocalNote() {

  // renameLocalNote - Prompt user for new name 
  let fileName = await vscode.window.showInputBox({
      placeHolder: "Enter new project note name (Extension .md is not required)",
      prompt: "Rename Project Note: ",
      value: path.basename(arguments[0].fsPath)
  });
  if (fileName === undefined || fileName === "") {
      return;
  }
  let parts = fileName.split(".");
  fileName = parts[0]+'.md';
  let newLocalNote = path.join(thisProjectsNotesFolder, path.sep, fileName);
  
  // renameLocalNote - Perform Rename 
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.renameFile(vscode.Uri.file(arguments[0].fsPath),vscode.Uri.file(newLocalNote), {overwrite: false});
  await vscode.workspace.applyEdit(workspaceEdit);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                         ● Function deleteLocalNote ●                         │
//  │                                                                              │
//  │                            • Delete Local Note •                             │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function deleteLocalNote() {

  // deleteLocalNote - Prompt user for confirmation 
  let fName = arguments[0].label;
  const selectedItem = await vscode.window.showWarningMessage('Delete Local Note? '+fName,'Continue','Cancel');
  if ('Continue' !== selectedItem) {
    return;
  }
  
  // deleteLocalNote - Delete the Project Note 
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.deleteFile(vscode.Uri.file(arguments[0].fsPath));
  await vscode.workspace.applyEdit(workspaceEdit);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function newGlobalNote ●                          │
//  │                                                                              │
//  │                        • Create Global Project Note •                        │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function newGlobalNote() {

  // newGlobalNote - Prompt user for new notes name 
  let fileName = await vscode.window.showInputBox({
    placeHolder: "Enter new global note name (Extension .md is not required)",
    prompt: "Create New Global Note: "
  });
  // newGlobalNote - Return if no note name entered or user pressed escape 
  if (fileName === undefined || fileName === "") {
    return;
  }
  let parts = fileName.split(".");
  fileName = parts[0]+'.md';
  let newGlobalNote = path.join(globalNotesRootFolder, path.sep, fileName);

  // newGlobalNote - Create New Global Note and Open for Editing  
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.createFile(vscode.Uri.file(newGlobalNote), {overwrite: false});
  await vscode.workspace.applyEdit(workspaceEdit);
  const document = await vscode.workspace.openTextDocument(newGlobalNote);
  vscode.window.showTextDocument(document, {preview: false});

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function previewGlobalNote ●                        │
//  │                                                                              │
//  │                     • Open Global Note in Preview Mode •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function previewGlobalNote() {

  const pathToNote = vscode.Uri.file(arguments[0].fsPath);
  await vscode.commands.executeCommand('markdown.showPreview', pathToNote);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function renameGlobalNote ●                         │
//  │                                                                              │
//  │                            • Rename Global Note •                            │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function renameGlobalNote() {

  // renameGlobalNote - Prompt user for new name 
  let fileName = await vscode.window.showInputBox({
      placeHolder: "Enter new global note name (Extension .md is not required)",
      prompt: "Rename Global Note: ",
      value: path.basename(arguments[0].fsPath)
  });
  if (fileName === undefined || fileName === "") {
      return;
  }
  let parts = fileName.split(".");
  fileName = parts[0]+'.md';
  let newGlobalNote = path.join(globalNotesRootFolder, path.sep, fileName);
  
  // renameGlobalNote - Perform Rename 
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.renameFile(vscode.Uri.file(arguments[0].fsPath),vscode.Uri.file(newGlobalNote), {overwrite: false});
  await vscode.workspace.applyEdit(workspaceEdit);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function deleteGlobalNote ●                         │
//  │                                                                              │
//  │                            • Delete Global Note •                            │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function deleteGlobalNote() {

  // deleteGlobalNote - Prompt user for confirmation 
  let fName = arguments[0].label;
  const selectedItem = await vscode.window.showWarningMessage('Delete Global Note? '+fName,'Continue','Cancel');
  if ('Continue' !== selectedItem) {
    return;
  }
  
  // deleteGlobalNote - Delete the Global Note 
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.deleteFile(vscode.Uri.file(arguments[0].fsPath));
  await vscode.workspace.applyEdit(workspaceEdit);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function openNoteLink ●                           │
//  │                                                                              │
//  │                  • Open Project or Global Note File Links •                  │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function openNoteLink() {

  // openNoteLink - Verify Text Editor Open 
  let editor = vscode.window.activeTextEditor;
  if (!editor) {
      vscode.window.showWarningMessage('Text Editor Not Open!');
      return;
  };

  // openNoteLink - Get current lines text 
  const lineText = editor.document.lineAt(editor.selection.active.line).text;
  const projectRegex = new RegExp(/local file:\s*([\(\)A-Za-z0-9_-]+.md)/i);
  const globalRegex = new RegExp(/global file:\s*([\(\)A-Za-z0-9_-]+.md)/i);
  let foundLocalNote = projectRegex.test(lineText);
  let foundGlobalNote = globalRegex.test(lineText);
  let notesFilePath = "";

  // openNoteLink - Get Local Note Filename from comment 
  if (foundLocalNote) {
      let filenameArray = projectRegex.exec(lineText);
      let filename = filenameArray[1];
      notesFilePath = path.join(thisProjectsNotesFolder, path.sep, filename);
  };

  // openNoteLink - Get Global Note Filename from comment 
  if (foundGlobalNote) {
      let filenameArray = globalRegex.exec(lineText);
      let filename = filenameArray[1];
      notesFilePath = path.join(globalNotesRootFolder, path.sep, filename);
  };

  // openNoteLink - Open Local Note -or- Global Note Filename.MD if either is found 
  if (notesFilePath.length == 0) {
      vscode.window.showInformationMessage('No Project or Global file link found on this line');
      return;
  };

  // openNoteLink - Verfiy file exists, if it does then open it 
  if (fs.existsSync(notesFilePath)) {
    // File exists in path
    vscode.workspace.openTextDocument(vscode.Uri.file(notesFilePath)).then(
      document => vscode.window.showTextDocument(document));
      return;
  };

  // openNoteLink - If it does not exist, then create it 
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.createFile(vscode.Uri.file(notesFilePath), {overwrite: false});
  await vscode.workspace.applyEdit(workspaceEdit);
  const document = await vscode.workspace.openTextDocument(notesFilePath);
  vscode.window.showTextDocument(document, {preview: false});

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                             ● Function newTodo ●                             │
//  │                                                                              │
//  │                    • Create New Task in `TODO.md` File •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function newTodo() {

  // newTodo - Ensure Use Todo File is Enabled in Settings Before Continuing 
  if (!useTodo) {
    vscode.window.showInformationMessage("Auto create TODO file is disabled in settings, please enable the setting and try again");
    return;
  };

  // newTodo - Ensure (TODO).md File is Exists Before Continuing 
  if (!fs.existsSync(path.join(thisProjectsNotesFolder, path.sep, "(TODO).md"))) {
    vscode.window.showInformationMessage("(TODO).md file does not exist in Local Notes Folder, please enable auto create TODO file in this extensions settings");
    return;
  };

  // newTodo - Get Local Notes Folder From User 
  let options = {
    placeHolder: `Enter the new todo tasks text...`,
    prompt: "Enter new todo task",
    title: "---=== Project Notes - Create New TODO Task ===---"
  };
  const newTask = await vscode.window.showInputBox(options);

  // newTodo - Check if User Cancelled 
  if (!newTask) {
    return;
  };

  // newTodo - Create New Task String 
  let newTaskText = `- [ ] ${newTask}`;

  // newTodo - Open TODO File 
  let todoFileData = await fs.readFileSync(path.join(thisProjectsNotesFolder, path.sep, "(TODO).md"), {'encoding':'utf-8'});
  let newFileData;
  if (todoFileData.endsWith('\n')) {
    newFileData = todoFileData.concat(newTaskText,'\n');
  } else {
    newFileData = todoFileData.concat('\n',newTaskText,'\n');
  };

  // newTodo - Write New TODO Task to File 
  await fs.writeFileSync(path.join(thisProjectsNotesFolder, path.sep, "(TODO).md"), newFileData);
  //LocalOutlineProvider. //new LocalProvider(context, thisProjectsNotesFolder);
  //LocalProvider.prototype.refresh(); //(path.join(thisProjectsNotesFolder, path.sep, "(TODO).md")); //new LocalProvider(context, thisProjectsNotesFolder);

};

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function addUserIcons ●                           │
//  │                                                                              │
//  │                         • Get User Icons From User •                         │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function addUserIcons() {

  // addUserIcons - Initialize Required Variables 
  let globalStoragePath = myContext.globalStorageUri.fsPath;
  let userIconPath = path.join(globalStoragePath,'userIcons');
  const home = vscode.Uri.file(path.join(os.homedir()));
  const options = OpenDialogOptions = {
      title: `---=== Project Notes - Add New User Icon(s) ===---`,
      defaultUri: home,
      canSelectMany: true,
      canSelectFolders: false,
      canSelectFiles: true,
      filters: {'Icons': ['svg']},
      openLabel: "Select SVG Icon Files to Add to Project Notes Extension"
  };
  let iconsRet = await vscode.window.showOpenDialog(options);

  // addUserIcons - User Cancelled 
  if (!iconsRet) {
    return;
  };

  // addUserIcons - Copy New Icons to Global Storage 
  let index = 0;
  iconsRet.forEach(file => {
    let dest = path.join(userIconPath,path.basename(iconsRet[index].fsPath));
    fs.copyFileSync(iconsRet[index].fsPath, dest);
    index++;
  });

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                          ● Function listUserIcons ●                          │
//  │                                                                              │
//  │                         • List Current User Icons •                          │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function listUserIcons() {

  // listUserIcons - Initialize Required Variables 
  let globalStoragePath = myContext.globalStorageUri.fsPath;
  let userIconPath = path.join(globalStoragePath,'userIcons');
  let userIcons = [];

  // listUserIcons - Create User Icon Path if it Does Not Exist 
  if (await !fs.existsSync(userIconPath)) {
    await fs.mkdirSync(userIconPath, { recursive: true });
    await vscode.window.showInformationMessage('No User Icons Are Currently defined. Run Command "Project Notes: Add New User Icons" to Add Icons','Ok');
    return;

    // listUserIcons - Get List of Icons From Global Storage 
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

  // listUserIcons - Get Icon Selection From User 
  if (userIcons.length > 0) {
    let optionsUserIcons = {
      placeHolder: "Select Icon to Copy Name to Clipboard (Esc to cancel)",
      title: `---=== Project Notes - Listing Current User Icons ===---`
    };
    let pick = await vscode.window.showQuickPick(userIcons, optionsUserIcons);

    // listUserIcons - User Cancelled 
    if (!pick) {
      return;
    };

    vscode.env.clipboard.writeText(pick);

  // listUserIcons - Inform User That No Icons Were Found 
  } else {
    await vscode.window.showInformationMessage('No User Icons Are Currently defined. Run Command "Project Notes: Add New User Icons" to Add Icons','Ok');
    return;
  };

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                         ● Function removeUserIcons ●                         │
//  │                                                                              │
//  │                  • Remove User Icons From Global Storage •                   │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function removeUserIcons() {

  // removeUserIcons - Initialize Required Variables 
  let globalStoragePath = myContext.globalStorageUri.fsPath;
  let userIconPath = path.join(globalStoragePath,'userIcons');
  let userIcons = [];

  // removeUserIcons - Create User Icon Path if it Does Not Exist 
  if (await !fs.existsSync(userIconPath)) {
    await fs.mkdirSync(userIconPath, { recursive: true });
    await vscode.window.showInformationMessage('No User Icons Are Currently defined. Run Command "Project Notes: Add New User Icons" to Add Icons','Ok');
    return;

  // removeUserIcons - Otherwise Create User Icon(s) List 
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

  // removeUserIcons - Get Remove Icons Selection From User 
  if (userIcons.length > 0) {
    let optionsUserIcons = {
      placeHolder: "Select Icon(s) to Remove (Esc to cancel)",
      title: `---=== Project Notes - Remove Current User Icons ===---`,
      canPickMany: true
    };
    let pick = await vscode.window.showQuickPick(userIcons, optionsUserIcons);

    // removeUserIcons - User Cancelled 
    if (!pick) {
      return;
    };

    // removeUserIcons - Remove Users Selected Icons 
    for (let index = 0; index < pick.length; index++) {
      let pickedPath = path.join(userIconPath,pick[index]);
      fs.rmSync(pickedPath);
    };

  // removeUserIcons - Inform User That No Icons Were Found 
  } else {
    await vscode.window.showInformationMessage('No User Icons Are Currently defined. Run Command "Project Notes: Add New User Icons" to Add Icons','Ok');
    return;
  };

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                           ● Function deactivate ●                            │
//  │                                                                              │
//  │                       • Deactivate Extension Cleanup •                       │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
function deactivate() {}


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                              ● Export modules ●                              │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
module.exports = {
  activate,
  deactivate,
};
