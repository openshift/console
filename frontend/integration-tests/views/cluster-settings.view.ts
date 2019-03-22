import { element, by, browser, $$ } from 'protractor';
import { waitForNone } from '../protractor.conf';

export const heading = element(by.cssContainingText('h1.co-m-pane__heading', 'Cluster Settings'));
export const isLoaded = async() => await browser.wait(waitForNone($$('.co-m-loader')));
