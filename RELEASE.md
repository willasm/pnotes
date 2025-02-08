<!--
### Added
### Changed
### Deprecated
### Removed
### Fixed
### Security
### Updated
-->
# Release Notes

<!-- ## [v-inc] ${YEAR4}-${MONTHNUMBER}-${DATE} -->

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


For a full list of changes, please see the projects [Changelog](CHANGELOG.md) file.

I hope you enjoy using the Extension, and if you find any bugs, or would like to see a certain feature added, please feel free to contact me.

Enjoy! William
