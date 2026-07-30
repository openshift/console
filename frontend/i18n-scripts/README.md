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

Once your login info is configured, you should be able to log in by running `source ~/.memsourcerc`.

Example CLI usage for upload script: `yarn memsource-upload -v 4.8 -s 200`
* -v is the current OpenShift version
* -s is the current sprint number

Example CLI usage for download script: `yarn memsource-download -p 6sB6qwpbRkGCeBQq4hUyK1`
* -p is the project ID in Memsource. The project ID can be obtained from the Memsource project URL (it's the series of numbers and letters after /show/, i.e. https://cloud.memsource.com/web/project2/show/FBfZeTEWPYaC4VXhgrW0R2).

## Export
`export-pos.sh` is a utility for Memsource automation. It exports all i18next json files
in PO format in all the languages we currently support, so we can hand them off to the translation team.

## i18n-to-PO
`i18n-to-po.js` is a utility for Memsource automation. It is used by `export-pos.sh` to
export individual files.

## PO-to-i18n
`po-to-i18n.js` is a utility for Memsource automation. It is used by the download script to
correctly sort files into their original locations and convert them back into json format.
