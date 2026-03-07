/** @type {Cypress.ConfigOptions} */
module.exports = {
  viewportWidth: 1920,
  viewportHeight: 1080,

  /**
   * CSP directives to be preserved during Cypress test runs.
   *
   * Note that Cypress only supports a small subset of all standard CSP directives.
   * Therefore, CSP violation testing via Cypress is limited but still useful to have.
   *
   * @see {@link Cypress.ConfigOptions.experimentalCspAllowList}
   * @see https://docs.cypress.io/app/references/experiments#Experimental-CSP-Allow-List
   */
  experimentalCspAllowList: [
    'child-src',
    'default-src',
    'form-action',
    'frame-src',
    'script-src-elem',
    'script-src',
  ],
};
