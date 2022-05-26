import { $, $$, by, browser, ExpectedConditions as until } from 'protractor';
import { waitForNone } from '../protractor.conf';

export const yamlEditor = $('.yaml-editor,.osc-yaml-editor');
export const saveButton = $('#save-changes,[data-test="save-changes"]');
export const cancelButton = $('.yaml-editor__buttons').element(by.buttonText('Cancel'));
export const isLoaded = () =>
  browser
    .wait(
      until.and(
        waitForNone($$('.co-m-loader')),
        until.visibilityOf(yamlEditor),
        until.visibilityOf(saveButton),
      ),
    )
    .then(() => browser.sleep(1000));

const getValue = () => (window as any).monaco.editor.getModels()[0].getValue();
export const getEditorContent = async (): Promise<string> => await browser.executeScript(getValue);

const setValue = (text) => (window as any).monaco.editor.getModels()[0].setValue(text);
export const setEditorContent = async (text: string) => {
  await browser.executeScript(setValue, text);
};

export const isSwitchViewLoaded = () =>
  browser
    .wait(until.and(until.visibilityOf(yamlEditor), until.visibilityOf(saveButton)))
    .then(() => browser.sleep(1000));
