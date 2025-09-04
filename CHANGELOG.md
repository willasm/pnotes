# Change Log

<!-- ## [v-inc] ${YEAR4}-${MONTHNUMBER}-${DATE} -->

## [2.1.4] 2025-09-04
### Added
- Warning prompt before moving notes folder

### Changed
- The settings `Project Notes Folder Location` now includes the `.projectnotes` folder rather than adding it internally
  - This is all taken care of by the extension (no need for the user to edit anything)
  - This was done to make it clearer where the notes are stored for those that like to manually edit settings.json

### Updated
- Readme file now includes more detailed information on the location of your notes

## [2.1.3] 2025-09-01
### Changed
- Extended Global and Local note filename links to include characters `! @ # $ . space ( ) [ ] { } - +`
  - Updated my [comment-highlighter extension](https://github.com/willasm/comment-highlighter) to support the new characters

## [2.1.2] 2025-08-27
### Added
Global and Local note filenames can contain the period character (as requested)

### Fixed
- Image link in `LocalNotesHaveMoved.md`

### Removed
- Unnecessary console.log()'s

## [2.1.1] 2025-02-07
### Fixed
- Unintentionally removed the required `node_modules` folder in `.vscodeignore` which broke the extension

## [2.1.0] 2025-02-07
### Changed
- Local project notes have been moved out of the projects workspace
  - (See `LocalNotesHaveMoved.md` for full details)
- `(Project Notes Guide).md` now has much more relevant information
- Renamed `projectDataProvider.js` to `localDataProvider.js` (more descriptive name)
- `projectNoteLink` snippet renamed to `localNoteLink` (more descriptive prefix name)
  - Body changed from `Project File: ${1:Filename}.md$0` to `Local File: ${1:Filename}.md$0`

### Added
- Refresh buttons for both global and local treeviews
- `.vscodeignore` to reduce the vsix package size
- `LocalNotesHaveMoved.md` document detailing the local notes move
- `PromptMoveLocalNotes.png` image for local notes move prompt
- `(Project Notes Guide).md`, `(Scratchpad).md`, `(Project Notes Guide).md` default documents added to `src` folder
  - (For easier editing)

### Updated
- `.gitignore`
- `README.md` with all the relevant changes
- All descriptive images

## [2.0.2] 2024-07-15
### Fixed
- Forgot to update change logs

## [2.0.1] 2024-07-15
### Fixed
- Creating default global notes folder automatically was not workig correctly (worked only by editing in settings)

## [2.0.0] 2024-07-04
- Initial release of this new updated version
- This version is Not Compatible with the old version `Project Notes + TODO Highlighter`, please remove it if it is installed
- The comment highlighting has been removed and created as its own extension `Comment Highlighter`
- The new `Comment Highlighter` extension can be found [here](https://marketplace.visualstudio.com/items?itemName=willasm.comment-highlighter)

