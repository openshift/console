# i18n-scripts

The i18n-scripts folder contains all homebrewed scripts for i18n workflow automation
in OpenShift.

## Languages
The list of languages we're using are stored in `languages.sh`. All scripts
that rely on language information import this variable, and it should be updated
whenever OpenShift gains support for an additional language.

## Memsource Automation
We have created two scripts to handle pushing and pulling translations to/from
Memsource, the tool the Red Hat Globalization team uses for translation jobs.

Before running either tool, you must first install the [unofficial Memsource CLI client](https://github.com/unofficial-memsource/memsource-cli-client#pip-install).
You also have to [configure it with your Memsource login info](https://github.com/unofficial-memsource/memsource-cli-client#configuration-red-hat-enterprise-linux-derivatives).

Example CLI usage for upload script: `yarn memsource-upload -v 4.8 -s 200`
* -v is the current OpenShift version
* -s is the current sprint number

Example CLI usage for download script: `yarn memsource-download -p 6sB6qwpbRkGCeBQq4hUyK1`
* -p is the project ID in Memsource. The project ID can be obtained from the Memsource project URL (it's the series of numbers and letters after /show/, i.e. https://cloud.memsource.com/web/project2/show/FBfZeTEWPYaC4VXhgrW0R2).

## Build
`build-i18n.sh` runs as part of the general `yarn i18n` command workflow. This script
runs the i18next parser across the entire codebase and generates json files based on
the marked keys in the application.

## Folder Consolidation
`consolidate-public-folders.js` runs as part of the general `yarn i18n` command workflow.
The goal of the script is to consolidate all json files across the application with the name
"public" into a single json file in the public folder. This is required to avoid namespace conflicts,
as i18next requires unique namespaces.

## English Defaults
`set-english-defaults.js` runs as part of the general `yarn i18n` command workflow.
This script programmatically adds values for each new key in a json file after the parser is run.
The goal of this script was to save developers time and minimize errors, as it saves developers
from having to manually edit json files most of the time. In some cases, such as complex pluralization,
manual edits will be required.

## Export
`export-pos.sh` is a utility for Memsource automation. It exports all i18next json files
in PO format in all the languages we currently support, so we can hand them off to the translation team.

## i18n-to-PO
`i18n-to-po.js` is a utility for Memsource automation. It is used by `export-pos.sh` to
export individual files.

## PO-to-i18n
`po-to-i18n.js` is a utility for Memsource automation. It is used by the download script to
correctly sort files into their original locations and convert them back into json format.
