# Change Log

<!-- ## [v-inc] ${YEAR4}-${MONTHNUMBER}-${DATE} -->

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

