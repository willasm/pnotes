const vscode = require("vscode");
const path = require("path");
const fs = require("fs");
const os = require("os");
const { env } = require("process");
const { readFile } = require('fs/promises');
const ProjectProvider = require("./projectDataProvider.js");
//const ProjectDecorationProvider = require("./projectDataProvider");
const GlobalProvider = require("./globalDataProvider.js");

let myContext;
let settings = vscode.workspace.getConfiguration("pnotes");
let oldSettings = vscode.workspace.getConfiguration("project-notes");
let oldGlobalNotesFolder = oldSettings.get("globalNotesFolder");
let oldLocalNotesFolder = oldSettings.get("localNotesFolder");
let globalNotesFolder = settings.get("globalNotesFolder");
let localNotesFolder = settings.get("localNotesFolder");
let useScratchpad = settings.get("autoCreateScratchpadLocalProjectNote");
let useTodo = settings.get("autoCreateTodoLocalProjectNote");
let useGuide = settings.get("createGlobalProjectNotesGuideFile");
let addToGitIgnore = settings.get("addLocalProjectsNoteFolderToGitIgnoreFile");
let createGitIgnore = settings.get("createGitIgnoreFileIfNotFound");
let localNotesPath = vscode.workspace.workspaceFolders[0].uri.fsPath+path.sep+localNotesFolder;
let localScratchpadFile = localNotesPath+path.sep+"(Scratchpad).md";
let localTodoFile = localNotesPath+path.sep+"(TODO).md";
let globalNotesTipsFile = globalNotesFolder+path.sep+"(Project Notes Guide).md";
let gitIgnoreFile = vscode.workspace.workspaceFolders[0].uri.fsPath+path.sep+'.gitignore';
let guideImage = vscode.extensions.getExtension('willasm.pnotes').packageJSON.extensionLocation.fsPath+path.sep+'images'+path.sep+'ProjectNotesSidebar.png';

//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                            ● Function Activate ●                             │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function activate(context) {

  // activate - Initialize Extension 
  //--------------------------------------------------------------------------------
  myContext = context;                                                      // Save context
  fs.copyFileSync(guideImage, globalNotesFolder+path.sep+'ProjectNotesSidebar.png');  // Copy guides image to global notes folder
  
  // activate - Use Old Settings if Available 
  if (oldGlobalNotesFolder != undefined && oldGlobalNotesFolder.length > 0) {
    globalNotesFolder = oldGlobalNotesFolder;
    settings.update("globalNotesFolder",globalNotesFolder, 1);
    // Need to remove old setting or this will always run
    oldSettings.update("globalNotesFolder",undefined, 1);
  };
  if (oldLocalNotesFolder != undefined && oldLocalNotesFolder.length > 0) {
    localNotesFolder = oldLocalNotesFolder;
    settings.update("localNotesFolder",localNotesFolder, 1);
    // Need to remove old setting or this will always run
    oldSettings.update("localNotesFolder",undefined, 1);
  };

  // activate - Get New Settings 
  if (globalNotesFolder == undefined || globalNotesFolder == "") {  // Set default global notes location to home folder + '.pnotes'
    let globalNotesFolderUri = vscode.Uri.file(path.join(os.homedir(), path.sep, '.pnotes'));
    globalNotesFolder = globalNotesFolderUri.fsPath;
    settings.update("globalNotesFolder",globalNotesFolder, 1);
  };
  if (localNotesFolder == undefined || localNotesFolder == "") {    // Set default local notes location to workspace folder + '.pnotes'
    let localNotesFolderUri = vscode.workspace.workspaceFolders[0].uri.fsPath+path.sep+'.pnotes';
    localNotesFolder = localNotesFolderUri.fsPath;
    settings.update("localNotesFolder",localNotesFolder, 1);
  };

  // activate - Ensure Old `Project Notes + TODO Highlighter` Extension is Not Installed 
  let oldVer = vscode.extensions.getExtension('willasm.project-notes');
  if (oldVer != undefined) {
    await vscode.window.showWarningMessage('Old extension version `Project Notes + TODO Highlighter` is still installed. Please remove or disable it before using this updated version of the extension','Ok');
  };

  // activate - Define Global Notes Guide File 
  const globalGuideFileData =
`<!--- OPEN IN PREVIEW MODE FOR BEST VIEWING RESULTS (CTRL+SHIFT+V) -->\n\n
# Welcome to Project Notes\n
> Note that it is ok to delete this file once you are finished reading it. You can always re-create the file by enabling the setting \`Create Global Project Notes Guide File\` in this extensions settings.\n
## Project Notes Sidebar Screenshot\n
![Project Notes Sidebar](ProjectNotesSidebar.png)\n
## Commands Available from the Command Palette\n
\`Project Notes: Set Global Notes Folder Location\` Sets the folder location for your global notes\n
\`Project Notes: Set Local Notes Folder Name\` Sets the workspace sub-folder name for your project notes (Defaults to \`.pnotes\`)\n
\`Project Notes: Open Note File Link\` Opens note file link on the current line of the editor (See Project Notes \`README.md\` for a detailed description)\n
\`Project Notes: Create New TODO Task\` Prompts for the text of a new task which will be appended to the \`(TODO).md\` file in the local projects folder\n
\`Project Notes: Add New User Icons\` Opens an "Open File Dialog" allowing you to select multiple svg icons for use with files in the tree view\n
\`Project Notes: List Current User Icons\` Opens a quick pick list of all current user icons\n
\`Project Notes: Remove User Icons\` Opens a multi-select quick pick list allowing you to select multiple icons for removal from the extension\n
`;

  // activation - Create global notes folder and `(Project Notes Guide).md` if needed 
  if (!fs.existsSync(globalNotesFolder)) {
    fs.mkdirSync(globalNotesFolder, { recursive: true });
    if (useGuide) {
      fs.writeFileSync(globalNotesTipsFile,globalGuideFileData);
      settings.update("createGlobalProjectNotesGuideFile",false, 1);
    }
  };
  if (!fs.existsSync(globalNotesTipsFile) && useGuide == true) {
    fs.writeFileSync(globalNotesTipsFile,globalGuideFileData);
    settings.update("createGlobalProjectNotesGuideFile",false, 1);
  };

  // activation - Create local notes folder and `(Scratchpad).md` and `(todo).md` if needed 
  if (!fs.existsSync(localNotesPath)) {
    fs.mkdirSync(localNotesPath, { recursive: true });
    if (useScratchpad) {
      fs.writeFileSync(localScratchpadFile,"# Scratchpad\n");
    }
  };
  if (!fs.existsSync(localScratchpadFile) && useScratchpad == true) {
    fs.writeFileSync(localScratchpadFile,"# Scratchpad\n");
  };
  if (!fs.existsSync(localTodoFile) && useTodo == true) {
    fs.writeFileSync(localTodoFile,"# TODO\n");
  };

  // activation - Create `.gitignore` File and Add Local Project Notes Folder if Needed 
  if (fs.existsSync(gitIgnoreFile)) {
    if (addToGitIgnore) {
      let ignoreData = await readFile(gitIgnoreFile, {'encoding':'utf-8','flag:':'r+'});
      if (!ignoreData.includes(localNotesFolder)) {
        let data = await ignoreData.concat(['\n'+localNotesFolder+'/\n']);
        let re = new RegExp(`\s*[\r\n]+(${localNotesFolder})`);
        data = await data.replace(re, '\n'+localNotesFolder);
        fs.writeFileSync(gitIgnoreFile, data, {'encoding':'utf-8'}, function(err) {
        if (err) {
          console.error(err);
        };
        });
      };
    };
  } else {
    if (createGitIgnore) {
      if (addToGitIgnore) {
        fs.writeFileSync(gitIgnoreFile, localNotesFolder+'/\n');
      } else {
        fs.writeFileSync(gitIgnoreFile,"");
      };
    };
  };

  // activation - Register Project Notes Treeview Data Provider 
  const ProjectOutlineProvider = new ProjectProvider(context, localNotesPath);
  vscode.window.registerTreeDataProvider('projectNotesTreeview', ProjectOutlineProvider);

  // activation - Register Global Notes Treeview Data Provider 
  const GlobalOutlineProvider = new GlobalProvider(context, globalNotesFolder);
  vscode.window.registerTreeDataProvider('globalNotesTreeview', GlobalOutlineProvider);

  // activation - Create Global Notes folder file watcher 
  const globalWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(globalNotesFolder), '**/*.{md,MD,Md,mD}'));
  globalWatcher.onDidCreate(uri => GlobalOutlineProvider.refresh()); // Listen to files/folders being created
  globalWatcher.onDidDelete(uri => GlobalOutlineProvider.refresh()); // Listen to files/folders getting deleted

  // activation - Create Local Notes folder file watcher 
  const localWatcher = vscode.workspace.createFileSystemWatcher(new vscode.RelativePattern(vscode.Uri.file(localNotesPath), '**/*.{md,MD,Md,mD}'));
  localWatcher.onDidCreate(uri => ProjectOutlineProvider.refresh()); // Listen to files/folders being created
  localWatcher.onDidDelete(uri => ProjectOutlineProvider.refresh()); // Listen to files/folders getting deleted
//  localWatcher.onDidChange(uri => ProjectOutlineProvider.refresh()); // Listen to files/folders getting deleted

  // activation - Register Extension Commands 
  vscode.commands.registerCommand('pnotes.setNotesGlobalFolder', setNotesGlobalFolder);
  vscode.commands.registerCommand('pnotes.setNotesLocalFolder', setNotesLocalFolder);
  vscode.commands.registerCommand('pnotes.newProjectNote', newProjectNote);
  vscode.commands.registerCommand('pnotes.previewProjectNote', previewProjectNote);
  vscode.commands.registerCommand('pnotes.renameProjectNote', renameProjectNote);
  vscode.commands.registerCommand('pnotes.deleteProjectNote', deleteProjectNote);
  vscode.commands.registerCommand('pnotes.newGlobalNote', newGlobalNote);
  vscode.commands.registerCommand('pnotes.previewGlobalNote', previewGlobalNote);
  vscode.commands.registerCommand('pnotes.renameGlobalNote', renameGlobalNote);
  vscode.commands.registerCommand('pnotes.deleteGlobalNote', deleteGlobalNote);
  vscode.commands.registerCommand('pnotes.openNoteLink', openNoteLink);
  vscode.commands.registerCommand('pnotes.newTodo', newTodo);
  vscode.commands.registerCommand('pnotes.addUserIcons', addUserIcons);
  vscode.commands.registerCommand('pnotes.listUserIcons', listUserIcons);
  vscode.commands.registerCommand('pnotes.removeUserIcons', removeUserIcons);

  // activation - Push Subscriptions 
  context.subscriptions.push(setNotesGlobalFolder);
  context.subscriptions.push(setNotesLocalFolder);
  context.subscriptions.push(newProjectNote);
  context.subscriptions.push(previewProjectNote);
  context.subscriptions.push(renameProjectNote);
  context.subscriptions.push(deleteProjectNote);
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
//  │                      ● Function setNotesGlobalFolder ●                       │
//  │                                                                              │
//  │                     • Set Global Notes Folder Location •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function setNotesGlobalFolder() {

  // setNotesGlobalFolder - Get Global Notes Folder From User 
  const home = vscode.Uri.file(path.join(os.homedir()))
  const options = OpenDialogOptions = {
    title: "Select Folder Location for Global Notes",
    defaultUri: home,
    canSelectMany: false,
    canSelectFolders: true,
    canSelectFiles: false,
    openLabel: "Select Folder for Global Notes"
  };
  const folderUri = await vscode.window.showOpenDialog(options);
  if (folderUri && folderUri[0]) {
    globalNotesFolder = folderUri[0].fsPath;
    settings.update("globalNotesFolder",globalNotesFolder,1);
    await vscode.commands.executeCommand('workbench.action.restartExtensionHost');
    //await vscode.commands.executeCommand('workbench.action.reloadWindow');
    };
};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                       ● Function setNotesLocalFolder ●                       │
//  │                                                                              │
//  │                      • Set Local Notes Folder Location •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function setNotesLocalFolder() {

  // setNotesLocalFolder - Get Local Notes Folder From User 
  let options = {
    placeHolder: `Current local notes folder is ${localNotesFolder}`,
    prompt: "Enter new local notes folder name",
    title: "---=== Project Notes - Set Local Notes Folder Name ===---"
  };
  const newLocalFolder = await vscode.window.showInputBox(options);

  // setNotesLocalFolder - Check if User Cancelled 
  if (!newLocalFolder) {
    return;
  }

  // setNotesLocalFolder - Save New Local Notes Folder 
  //let settings = vscode.workspace.getConfiguration("pnotes");
  settings.update("localNotesFolder",newLocalFolder,1);
  await vscode.commands.executeCommand('workbench.action.restartExtensionHost');
  //await vscode.commands.executeCommand('workbench.action.reloadWindow');

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                         ● Function newProjectNote ●                          │
//  │                                                                              │
//  │                         • Create New Project Note •                          │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function newProjectNote() {

  // newProjectNote - Prompt user for new notes name 
  let fileName = await vscode.window.showInputBox({
    placeHolder: "Enter new project note name (Extension .md is not required)",
    prompt: "Create New Project Note: "
  });
  // newProjectNote - Return if no note name entered or user pressed escape 
  if (fileName === undefined || fileName === "") {
    return;
  }

  // newProjectNote - Get full path to new local note 
  let parts = fileName.split(".");
  fileName = parts[0]+'.md';
  let newProjectNote = vscode.workspace.workspaceFolders[0].uri.fsPath+path.sep+localNotesFolder+path.sep+fileName;

  // newProjectNote - Create local notes folder if needed 
  let newProjectNotePath = vscode.workspace.workspaceFolders[0].uri.fsPath+path.sep+localNotesFolder;
  if (!fs.existsSync(newProjectNotePath)) {
      fs.mkdirSync(newProjectNotePath, {recursive: true});
  };

  // newProjectNote - Create New Project Note and Open for Editing  
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.createFile(vscode.Uri.file(newProjectNote), {overwrite: false});
  await vscode.workspace.applyEdit(workspaceEdit);
  const document = await vscode.workspace.openTextDocument(newProjectNote);
  vscode.window.showTextDocument(document, {preview: false});

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                       ● Function previewProjectNote ●                        │
//  │                                                                              │
//  │                    • Open Project Note in Preview Mode •                     │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function previewProjectNote() {

  const pathToNote = vscode.Uri.file(arguments[0].fsPath);
  await vscode.commands.executeCommand('markdown.showPreview', pathToNote);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function renameProjectNote ●                        │
//  │                                                                              │
//  │                           • Rename Project Note •                            │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function renameProjectNote() {

  // renameProjectNote - Prompt user for new name 
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
  let newProjectNote = vscode.workspace.workspaceFolders[0].uri.fsPath+path.sep+localNotesFolder+path.sep+fileName;
  
  // renameProjectNote - Perform Rename 
  const workspaceEdit = new vscode.WorkspaceEdit();
  workspaceEdit.renameFile(vscode.Uri.file(arguments[0].fsPath),vscode.Uri.file(newProjectNote), {overwrite: false});
  await vscode.workspace.applyEdit(workspaceEdit);

};


//  ╭──────────────────────────────────────────────────────────────────────────────╮
//  │                        ● Function deleteProjectNote ●                        │
//  │                                                                              │
//  │                           • Delete Project Note •                            │
//  ╰──────────────────────────────────────────────────────────────────────────────╯
async function deleteProjectNote() {

  // deleteProjectNote - Prompt user for confirmation 
  let fName = arguments[0].label;
  const selectedItem = await vscode.window.showWarningMessage('Delete Project Note? '+fName,'Continue','Cancel');
  if ('Continue' !== selectedItem) {
    return;
  }
  
  // deleteProjectNote - Delete the Project Note 
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
  let newGlobalNote = globalNotesFolder + path.sep + fileName;

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
  let newGlobalNote = globalNotesFolder+path.sep+fileName;
  
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
  }

  // openNoteLink - Get current lines text 
  const lineText = editor.document.lineAt(editor.selection.active.line).text;
  const projectRegex = new RegExp(/project file: *([A-Za-z0-9_-]+.md)/i);
  const globalRegex = new RegExp(/global file: *([A-Za-z0-9_-]+.md)/i);
  let foundProjectNote = projectRegex.test(lineText);
  let foundGlobalNote = globalRegex.test(lineText);
  let notesFilePath = "";

  // openNoteLink - Get Project Note Filename from comment 
  if (foundProjectNote) {
      let filenameArray = projectRegex.exec(lineText);
      let filename = filenameArray[1];
      notesFilePath = vscode.workspace.workspaceFolders[0].uri.fsPath+path.sep+localNotesFolder+path.sep+filename;
  }

  // openNoteLink - Get Global Note Filename from comment 
  if (foundGlobalNote) {
      let filenameArray = globalRegex.exec(lineText);
      let filename = filenameArray[1];
      notesFilePath = globalNotesFolder+path.sep+filename;
  }

  // openNoteLink - Open Project Note -or- Global Note Filename.MD if either is found 
  if (notesFilePath.length == 0) {
      vscode.window.showWarningMessage('No Project or Global file link found on this line!');
      return;
  }

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
    vscode.window.showWarningMessage("Auto create TODO file is disabled in settings, Please enable the setting and try again");
    return;
  }

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

  // newTodo - Create local notes folder and `Scratchpad.md` and `todo.md` if needed 
  if (!fs.existsSync(localNotesPath)) {
    fs.mkdirSync(localNotesPath, { recursive: true });
    if (useScratchpad) {
      fs.writeFileSync(localScratchpadFile,"# Scratchpad\n");
    }
  };
  if (!fs.existsSync(localScratchpadFile) && useScratchpad == true) {
    fs.writeFileSync(localScratchpadFile,"# Scratchpad\n");
  };
  if (!fs.existsSync(localTodoFile) && useTodo == true) {
    fs.writeFileSync(localTodoFile,"# TODO\n");
  };

  // newTodo - Open TODO File 
  let todoFileData = await readFile(localTodoFile, {'encoding':'utf-8'});
  //console.log('localTodoFile:', localTodoFile);
  let newFileData;
  if (todoFileData.endsWith('\n')) {
    newFileData = todoFileData.concat(newTaskText,'\n');
  } else {
    newFileData = todoFileData.concat('\n',newTaskText,'\n');
  };

  // newTodo - Write New TODO Task to File 
  await fs.writeFileSync(localTodoFile, newFileData);

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
    //console.log('Icon:',iconsRes[index].fsPath);
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
    //console.log('User Icons',userIcons);
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
      //console.log('Picked:', pickedPath);
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
