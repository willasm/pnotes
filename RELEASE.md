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

For a full list of changes, please see the projects [Changelog](CHANGELOG.md) file.

I hope you enjoy using the Extension, and if you find any bugs, or would like to see a certain feature added, please feel free to contact me.

Enjoy! William
