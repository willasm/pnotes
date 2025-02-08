# Local Notes Have Been Moved

## IMPORTANT CHANGE IN v2.1.0
> This does not effect new users using v2.1.0 and newer

The local project notes have been removed from the projects folder (.pnotes by default). This was done prevent issues I was having with cloned repos where the `.pnotes` folder was unexpected. This also removes the need to have/edit a `.gitignore` file in the projects folder.

The global notes location is in the users home directory in the folder `~\.projectnotes\global`. If you already have existing global notes they should be moved/copied to this new location.

The local notes are now stored alongside the global notes (in the users home folder by default) within the folder `.projectnotes`. The local notes for each project are stored in a folder with the name of the projects workspace + a string of numbers. These numbers are a hash generated from the full path string to the projects workspace Eg. `C:\myprojects\MyProjectName` would generate a folder name similar to this`MyProjectName143216523`. This means your notes can be moved anywhere you want and they will still be found by this extension as the hash to the projects path will remain constant. Of course if you moved the location of your source code then a new folder hash would be generated and you would need to manually move them into the newly generated folder.

An example tree structure inside the users home folder would be...

```
.projectnotes
├── global
│   ├── Nodemon - FAQ.md
│   ├── Nodemon - Readme.md
│   ├── Nodemon - Sample.md
│   ├── npkill.md
│   ├── (Project Notes Guide).md
└── projects
    ├── snippets1714543890
    │   ├── (Scratchpad).md
    │   └── (TODO).md
    └── test-folder374942317
        ├── (Scratchpad).md
        └── (TODO).md
```
When opening any project that still has Local Project Notes stored in the folder `.pnotes` you will be presented with the following prompt message...

![Move Local Project Files Prompt](/images/PromptMoveLocalNotes.png)

Selecting `More Info` opens this document

Selecting `Move Them` will move them to the new location for Local Project Notes (default new location is `~\.projectnotes\local`)

Selecting `Copy Them` will copy them to the new location for Local Project Notes and the original notes are not removed. Please keep in mind that the local project notes in the sidebars treeview are read from the new location and not from the old location. The folder `.pnotes` in the projects folder will be renamed to `.pnotes-bkp` to prevent this prompt dialog opening every time the project is loaded. You can delete the old notes folder `.pnotes-bkp` after copying the local notes to the new location if you wish.

Selecting `Ignore` will change the extensions setting `Prompt Move Local Notes` to false disabling this prompt for all projects

Note: Selecting `Ignore` is not recommended as the treeview for local project notes will not display project notes from the old location but only from the new one.
