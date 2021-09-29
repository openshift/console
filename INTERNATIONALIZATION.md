# OpenShift Internationalization

#### i18next and react-i18next

Internationalization is implemented with [i18next](https://www.i18next.com/) and [react-i18next](https://react.i18next.com/).

The react-i18next library offers a [hook](https://react.i18next.com/latest/usetranslation-hook), [higher order component](https://react.i18next.com/latest/withtranslation-hoc), and [function](https://react.i18next.com/latest/trans-component) that can be used with React components.

With these tools, we can translate text without having to worry about a key naming strategy. The text is used as the key.

Internationalized text and translations are located in JSON files in a locales folder in each package, as well as a locales folder in the public folder.

In general, these files shouldn't be manually updated, though sometimes plurals will need to be adjusted manually
after files are generated.

To generate and update text files:
```
cd frontend
yarn i18n
```

This command launches the [code parser](https://github.com/i18next/i18next-parser), generates JSON files containing English key:value pairs for all internationalized strings, and consolidates any English JSON files with identical names to avoid namespace conflicts in i18next.

#### Scope
We are not able to translate all text in the application. Text located in backend code or non-Red-Hat-controlled development environments may not be accessible for translation.

This may include items such as:
* Resource statuses (i.e. "Running")
* Events surfaced from Kubernetes
* Alerts
* Error messages displayed to the user or in logs
* Operators that surface informational messages
* Logging messages
* Monitoring dashboard chart titles and dropdowns that come from the config map dashboard definition

Localizaton is not included in the CLI at this time, and bidirectional (right-to-left) text such as Hebrew and Arabic are out of scope.

#### Internationalization guidelines

* Any usage of i18next's `TFunction` (rather than react-i18next's `TFunction`) must be performed inside a function or component.
* Don't use backticks inside of a `TFunction`. Our code parser will not automatically pick up the keys that contain backticks.

Examples:
```
Bad: t(`public~Hello, it is now {{date}}`, { date: new Date() })
Good: t('public~Hello, it is now {{date}}', { date: new Date() })
```

* `aria-label`, `aria-placeholder`, `aria-roledescription`, and `aria-valuetext` should be internationalized.
* Use the query parameter `?pseudolocalization=true&lng=en` to see pseudolocalization on strings you've marked for internationalization.
    * Pseudolocalization adds brackets around the text and makes it longer so you can test components with different text lengths.
* Make sure there are no missing key warnings in your browser's developer tools - missing keys will trigger errors in integration tests. The warning will show up as an error in the JavaScript console.
* When displaying a resource kind, you can hard-code it directly in the internationalized text or use the predefined label on the model for the kind.
    * `model.labelPlural` contains the key for the internationalized kind name and must be wrapped in its own `TFunction`. Not all kinds have this attribute, so it is necessary to check for it first as shown below:
```
model.labelPlural ? t(model.labelPlural) :  model.label
```
* While i18next extracts translation keys in runtime, i18next-parser doesn't run the code, so it can't interpolate values in these expressions:

```
t(key)
t('key' + id)
t(`key${id}`)
```

As a workaround, you should specify possible static values in comments anywhere in your file:
```
// t('key_1')
// t('key_2')
t(key)
/*
t('key1')
t('key2')
*/
t('key' + id)
```

* The optional i18nKey property on the [react-i18next Trans component](https://react.i18next.com/latest/trans-component) should only be used as a last resort. There is a known (rare) issue with the parser, where it will sometimes incorrectly generate a key that contains HTML tags. If this is the case, you will see a missingKey error in the developer tools of your browser or in our end to end tests. In this instance, the i18nKey prop should be used and made the same as the text being internationalized. HTML tags like `<strong>` can be used directly in the i18nKey prop.
* Write tests for pseudolocalized code in Cypress

#### Adding internationalization to a new package
Whenever a new package is added, you will need to make a few changes so it is picked up by our existing internationalization tools.

1. In `frontend/webpack.config.ts` (around line 209), add:
```
new CopyWebpackPlugin([{ from: './packages/package-name/locales', to: 'locales' }])
```

2. Create a new unique namespace for use in `TFunctions` in the package. This will also be the name of the JSON file generated in `package-name/locales`. We typically use the package name for the namespace.

3. Register your new namespace in the `ns` array in `public/i18n.js` on line 34.

Example:
```
i18n.init({
  ns: ['public', 'package-name'],
...
```

#### Translations

OpenShift is currently translated into three languages: Chinese, Korean, and Japanese.

Translation work is done by the Red Hat Globalization team. We send them updated files from the public and packages folders on a weekly or biweekly basis for the entire console and regularly import new translations.

#### Adding support for a new language

To add support for a new language to OpenShift:
1. Look up the [ISO 639-1 code](https://www.loc.gov/standards/iso639-2/php/code_list.php) for the new language.
2. Add the new language code to `./frontend/i18n-scripts/languages.sh`
3. Update the language switcher component (`./frontend/public/components/modals/language-preferences-modal.tsx`) to support the new language if translations are available.

#### Utilities
We have added various scripts to help us automate internationalization-related tasks in OpenShift.

These scripts can all be found in `./frontend/i18n-scripts`.

For more information, please review the [README](./frontend/i18n-scripts/README.md).

#### Testing
We test that internationalization is working for various pages and components using the [i18next-pseudo](https://github.com/MattBoatman/i18next-pseudo) JavaScript library, which returns translated strings in "pseudolocalization" format. Our Cypress custom commands [cy.isPseudoLocalized()](https://github.com/openshift/console/blob/9c930b7b411f5e88f2f890639159e09bdadb78dc/frontend/packages/integration-tests-cypress/support/i18n.ts#L45) and [cy.testI18n()](https://github.com/openshift/console/blob/9c930b7b411f5e88f2f890639159e09bdadb78dc/frontend/packages/integration-tests-cypress/support/i18n.ts#L13) append query params to URLs to invoke "pseudolocalization" and are used in various test suites such as [pseudolocalization.spec.ts](https://github.com/openshift/console/blob/1072d1bf6007fcd50dffd57219c300d3fe882e8b/frontend/packages/integration-tests-cypress/tests/i18n/pseudolocalization.spec.ts#L29) and [resource-crud.spec.ts](https://github.com/openshift/console/blob/12d9a30211a86a4979effb80c7cc8af8a68fd4a4/frontend/packages/integration-tests-cypress/tests/crud/resource-crud.spec.ts#L141) to verify strings in the masthead, dashboard, navigation menu, list views, and detail pages are translated.
