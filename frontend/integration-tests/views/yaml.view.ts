import { $, $$, by, Key, browser, ExpectedConditions as until } from 'protractor';
import { waitForNone } from '../protractor.conf';

export const saveButton = $('.yaml-editor__buttons').$('#save-changes');
export const cancelButton = $('.yaml-editor__buttons').element(by.buttonText('Cancel'));
export const editorInput = $('textarea.ace_text-input');
export const editorContent = $('div.ace_content');
export const isLoaded = () => browser.wait(until.and(waitForNone($$('.co-m-loader')), until.visibilityOf(saveButton)));
const insertLine = (line) => editorInput.sendKeys(line, Key.ENTER, Key.HOME);
export const setContent = async(text: string) => {
  const lines = text.split(/\n/g);
  await editorContent.click();
  await editorInput.sendKeys(Key.chord(Key.CONTROL, 'a'), Key.BACK_SPACE);
  await editorInput.sendKeys(Key.chord(Key.COMMAND, 'a'), Key.BACK_SPACE); // For those OSX users...

  // Lines should be inserted sychronously and sequentially
  for (const line of lines) {
    await insertLine(line);
  }
};
