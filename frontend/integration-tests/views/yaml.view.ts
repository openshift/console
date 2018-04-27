/* eslint-disable no-undef, no-unused-vars */

import { $, $$, by, Key, browser, ExpectedConditions as until } from 'protractor';

export const saveButton = $('.yaml-editor--buttons').$('#save-changes');
export const cancelButton = $('.yaml-editor--buttons').element(by.buttonText('Cancel'));

export const isLoaded = () => browser.wait(until.visibilityOf(saveButton));

export const editorInput = $$('textarea.ace_text-input').get(0);
export const editorContent = $('div.ace_content');

export const setContent = (text: string) => editorContent.click()
  .then(() => editorInput.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE))
  .then(() => editorInput.sendKeys(Key.chord(Key.COMMAND, 'a'), Key.BACK_SPACE)) // For those OSX users...
  .then(() => text.split(/\n/g).map(line => editorInput.sendKeys(line, Key.ENTER, Key.HOME)));

export const errorMessage = $('.alert-danger');
export const successMessage = $('.alert-success');
