![](https://img.shields.io/visual-studio-marketplace/v/willasm.pnotes)
![](https://img.shields.io/visual-studio-marketplace/d/willasm.pnotes)
![](https://img.shields.io/visual-studio-marketplace/r/willasm.pnotes)
![](https://img.shields.io/visual-studio-marketplace/release-date/willasm.pnotes)
![](https://img.shields.io/visual-studio-marketplace/last-updated/willasm.pnotes)

<!-- omit in toc -->
# Project Notes
IMPORTANT: If you have the old version of this extension installed `Project Notes + TODO Highlighter` it should be removed before installing this newer version. They are not compatible with each other and will cause issues if they are run simutaneously.

Note: This is a complete rewrite of my earlier version `Project Notes + TODO Highlighter` found here on [VS Code Marketplace](https://marketplace.visualstudio.com/items?itemName=willasm.project-notes) and on [Github](https://github.com/willasm/project-notes). The syntax highlighting was only intended to be a minor addition to the extension but it has grown to the point where it really needed be its own seperate extension. `Comment Highlighter` can now be found on [VSCode Marketplace](https://marketplace.visualstudio.com/items?itemName=willasm.comment-highlighter) and on [Github](https://github.com/willasm/comment-highlighter). Seperating the old extension into two extensions allows me to focus exclusivly on each of the new extensions as needed. The old extension will remain available for those that wish to use it but it will only receive limited support for bug fixes if they are discovered.

<!-- omit in toc -->
## Table of Contents
- [Features](#features)
- [Screenshot](#screenshot)
- [Settings](#settings)
- [Commands](#commands)
- [Using File Links](#using-file-links)
  - [Project Note Links](#project-note-links)
  - [Global Note Links](#global-note-links)
- [Special Files](#special-files)
  - [(Sratchpad).md](#sratchpadmd)
  - [(TODO).md](#todomd)
  - [(Project Notes Guide).md](#project-notes-guidemd)
- [Frontmatter Keys for files `Priority` and files `Icon`](#frontmatter-keys-for-files-priority-and-files-icon)
  - [Priority](#priority)
  - [Icon](#icon)
- [Changing the Default File Colors](#changing-the-default-file-colors)
- [Acknowledgements](#acknowledgements)
  - [Icon made by Freepik from www.flaticon.com](#icon-made-by-freepik-from-wwwflaticoncom)
- [Recommended](#recommended)
- [Release Notes and Changelog](#release-notes-and-changelog)

## Features
- Maintains 2 lists of notes, one project specific and one global available to all projects.
- Reads all files in sub-folders of the notes folders
- Insert Links to project note files inside your codes comments.
- Insert Links to global note files inside your codes comments.
- Local notes folder name is user definable, (defaults to `.pnotes`).
- Global notes location can be set to any preferred location (uses `.pnotes` folder in the current users home folder by default).
- Auto generates `(Scratchpad).md` in Project Notes folder - Scratchpad for quick notes that don't require a dedicated note
  - Can be turned off in the settings
- Auto generates `(TODO).md` in Project Notes folder - Quick access task list
  - Use the command `Project Notes: Create New TODO Task` to add new task
  - Can be turned off in the settings
- Auto generates `(Project Notes Guide).md` in Global Notes folder - Quick guide on this extensions usage
  - This file can safely be deleted after viewing
  - Will only create the file once (Can be re-created by enabling it in the settings)
- User definable colors for all files
  - In settings.json under the key "workbench.colorCustomizations" type "pnoteTreeItem." to get a popup of all available colors
- Assign different icons to any file you wish
  - You can add icons to the extension with the command `Project Notes: Add New User Icons`
  - You can list current user icons with the command `Project Notes: List Current User Icons`
  - You can remove current user icons with the command `Project Notes: Remove User Icons`
- Assign a priority to any file (Priority 1 to 5, each with its own color and icon)
- Auto add Project Notes folder (.pnotes by default) to `.gitignore` file
  - Can auto create `.gitignore` file if it does not exist [See the Settings Section](#settings) for details

## Screenshot
![Example Screenshot](/images/ProjectNotesSidebar.png)
<!-- ![App Screenshot](https://lanecdr.org/wp-content/uploads/2019/08/placeholder.png)   -->

## Settings
- `Local Notes Folder` (Folder Name for Local Notes)
  - Use the command `Project Notes: Set Local Notes Folder Name` to set this
  - Default is `.pnotes`
- `Global Notes Folder` (Folder Location for Global Notes)
  - Use the command `Project Notes: Set Globals Notes Folder Location` to set this
  - Default is `.pnotes`
- `Auto Create Scratchpad Local Project Note`
  - Creates a local project note, `(Scratchpad).md` file
  - Useful for those quick notes that do not require a dedicated note file 
  - With the name `(Scratchpad).md` it will always appear at or near the top of the notes list
  - Default is `true`
- `Auto Create Todo Local Project Note`
  - Creates a local project note, `(TODO).md` file
  - Useful for creating a list of those quick tasks that you wish to accomplish
  - With the name `(TODO).md` it will always appear near the top of the notes list
  - Default is `true`
- `Create Global Project Notes Guide File`
  - A handy quick reference file for `Project Notes` extension
  - Can be safely deleted when done viewing
  - Once created, this setting is automatically set to `false` to prevent creating it again after deleting the note
  - Can be restored by enabling this setting again
  - Default is `true`
- `Add Local Projects Note Folder To Git Ignore File`
  - Adds the local projects folder (.pnotes by default) to the `.gitignore` file (if it exists)
  - Default is `true`
- `Create Git Ignore File If Not Found`
  - Creates a `.gitignore` file in the workspace root folder if it does not exist
  - Default is `true`

## Commands
The following commands are available from the command pallette: (Windows: CTRL+Shift+P or F1) (Mac: CMD+Shift+P)
- `Project Notes: Set Local Notes Folder Name`
  - Sets the local notes folder name
  - Creates an input box where you can type in your preferred local notes folder name
  - Defaults to `.pnotes` folder in the current workspace root folder otherwise

- `Project Notes: Set Globals Notes Folder Location`
  - Sets the global notes folder location
  - Creates an open dialog to browse to your desired folder
  - Select new folder from the dialog to create the folder if needed
  - Defaults to `.pnotes` folder in the current users home folder otherwise

- `Project Notes: Open Note File Link`
  - Opens a Project or Global Note File from a Comment File Link. [See Using File Links](#using-file-links)

- `Project Notes: Create New TODO Task`
  - Prompts for the text of a new task which will be appended to the `(TODO).md` file in the local projects folder
  - Hovering over the file will show a tooltip with Total Tasks, Incompleted Tasks, and Completed Tasks

- `Project Notes: Add New User Icons`
  - Opens an "Open File Dialog" allowing you to select multiple svg icons for use with files in the tree view
  - Original icon is not touched at all, it is just copied to this extensions global storage
  - Icons are stored in this extensions global storage meaning that they will remain there after extension updates

- `Project Notes: List Current User Icons`
  - Opens a quick pick list of all current user icons
  - Selecting in icon will copy its name to the clipboard (Makes it easier to assign an icon to a file)

- `Project Notes: Remove User Icons`
  - Opens a multi-select quick pick list allowing you to select multiple icons for removal from the extension

## Using File Links
### Project Note Links
Create inside a comment the text as `Project File: {Filename}.md` for project notes. The `Project File:` portion is the trigger for determining the following notes file name.

### Global Note Links
Create inside a comment the text as `Global File: {Filename}.md` for global notes. The `Global File:` portion is the trigger for determining the following notes file name.

To create (or open an existing note) simply run the command `Project Notes: Open Note File Link` with the cursor anywhere on the same line as the `Project File: Filename.md` or `Global File: Filename.md` comment. If the file already exists it will be opened in a new editor window, otherwise a new file with the file name in the comment is created and opened for editing.

All local Project Note Files are stored in the `.pnotes` folder (by default) which is created if it does not exist. You may want to add to your `.gitignore` file `.pnotes/` if you do not want Git to track your notes. This can be done for you if the settings `Add Local Projects Note Folder To Git Ignore File` and `Create Git Ignore File If Not Found` are set to true.

Snippets are included for inserting both types of note links.
- Type `projectNoteLink` to insert project file link
- Type `globalNoteLink` to insert global file link

## Special Files
### (Sratchpad).md
The file `(Sratchpad).md` is created in the Project Notes folder if enabled in the [settings](#settings). This scratchpad is for those quick notes that don't require a dedicated note. If this file is deleted it will be recreated the next time you open this project in VS Code, unless it is disabled in the [settings](#settings).

### (TODO).md
The file `(TODO).md` is created in the Project Notes folder if enabled in the [settings](#settings). This is essentially a quick access todo task list for your project. You can add a new task by running the command `Project Notes: Create New TODO Task`. This will prompt you for the text of the task and append the new task to the end of the file in the format `- [ ] {YOUR TEXT INPUT}`. When hovering your mouse over this file, a tooltip will be displayed showing the "Total Tasks: {NUMBER}", "Incompleted Tasks: {NUMBER}" and "Completed Tasks: {NUMBER}". The total tasks are also displayed as a badge to the right of the file name `(TODO).md`.

TODO Example with Tooltip...

![tooltip-example](/images/TodoTooltip.png)

### (Project Notes Guide).md
The file `(Project Notes Guide).md` is created in the Global Notes folder if enabled in the [settings](#settings). This is a quick guide on this extensions usage. It will only be created the first time the extension is run after which the setting to create this file is set to false. It is perfectly fine to delete this file if you no longer wish to see it. If you would like to re-create it, just enable it in the [settings](#settings) again and restart VS Code.

## Frontmatter Keys for files `Priority` and files `Icon`
### Priority
Adding the key `Priority: {NUMBER}` (1 to 5 - 1 = highest, 5 = lowest) to the notes frontmatter will set the color of the notes name to 1 - Red, 2 - Orange, 3 - Yellow, 4 - Green and 5 - Blue. It will also prepend the name with a circular icon of the same color. See the [screenshot](#screenshot) for an example.

### Icon
Adding the key `Icon: {FILENAME.svg}` to the notes frontmatter will set this files icon to a user added icon. The filename can be unquoted, double quoted, or single quoted - whichever you prefer. You can add new icons to the extension with the command `Project Notes: Add New User Icons`. The original icons are left untouched, they are just copied to this extensions global storage folder. You can get a list of all current user icons by running the command `Project Notes: List Current User Icons`. Selecting an item from this list will copy the filename to the clipboard easily allowing you to paste the name into the frontmatter. To remove user icons from this extension you can run the command `Project Notes: Remove User Icons`. This creates a multi-select picker allowing you to remove all selected icons. Note that setting a user icon on a file with a priority value set will override the the default circular icon used for priorities.

Example:

```yaml
---
Priority: {number 1 to 5}
Icon: {filename.svg}
---
```

## Changing the Default File Colors
You can override the default file colors in the `settings.json` file under the `workbench.colorCustomizations` key...

`pnoteTreeItem.filenameTextColor` sets all normal files text color

`pnoteTreeItem.scratchpadTextColor` sets the (Scratchpad).md files text color

`pnoteTreeItem.todoTextColor` sets the (TODO).md files text color

`pnoteTreeItem.guideTextColor` sets the (Project Notes Guide).md files text color

`pnoteTreeItem.priorityOneTextColor` sets the Priority One file text color

`pnoteTreeItem.priorityTwoTextColor` sets the Priority Two file text color

`pnoteTreeItem.priorityThreeTextColor` sets the Priority Three file text color

`pnoteTreeItem.priorityFourTextColor` sets the Priority Four file text color

`pnoteTreeItem.priorityFiveTextColor` sets the Priority Five file text color

Example Screenshot...

![Example Screenshot](/images/ColorOverride.png)

## Acknowledgements
### Icon made by Freepik from www.flaticon.com
<a href="https://www.flaticon.com/free-icons/notepad" title="notepad icons">Notepad icons created by Freepik - Flaticon</a>

## Recommended
The [Comment Highlighter](https://marketplace.visualstudio.com/items?itemName=willasm.comment-highlighter) extension which has support for highlighting project and global file links.

## Release Notes and Changelog
See the [Release Notes](RELEASE.md) for details on this released version or [Changelog](CHANGELOG.md) for a history of all changes.

