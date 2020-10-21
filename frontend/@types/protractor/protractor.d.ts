// https://github.com/angular/protractor/issues/5348#issuecomment-558790111
// Note: This stub exists to override Protractor types which are incompatible with TS 3.7 as of 5.4.2 and 6.0.0
declare module 'protractor' {
  let $: any;
  let $$: any;
  let browser: any;
  let by: any;
  let element: any;
  let ExpectedConditions: any;
  let Key: any;
  let until: any;
  let protractor: any;
}
