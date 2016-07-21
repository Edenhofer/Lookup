# Lookup Chrome Extension

This extension helps you to lookup anything in Wikipedia , Dict.cc, ArchWiki or Duden without interrupting your browsing experience.

-----

## The idea behind the structure of this repo
The root folder contains a subfolder in which the actual extension with all of it files is saved. Therefore the root folder can hold additional files like screenshots, git-hooks or a documentation without hindering the user to easily create a working .crx through Chrome.

## Commands
* Adding git-hooks (through bash)
```bash
for hook in $(git rev-parse --show-toplevel)/*.hook; do
	(cd "$(git rev-parse --show-toplevel)"
		ln -s "../../$(basename ${hook})" ".git/hooks/$(basename ${hook%.hook})");
done
```

## Hooks
* pre-commit
> Reject whitespace errors and auto-generate a zip file ready to upload to the Developer Dashboard.

## Author

Gordian Edenhofer

## License

Unless otherwise stated, the files in this project may be distributed under the terms of the GNU General Public License as published by the Free Software Foundation; either version 2 of the License, or any later version. This work is distributed in the hope that it will be useful, but without any warranty; without even the implied warranty of merchantability or fitness for a particular purpose. See [version 2](https://www.gnu.org/licenses/old-licenses/gpl-2.0.html) and [version 3] (https://www.gnu.org/copyleft/gpl-3.0.html) of the GNU General Public License for more details.
