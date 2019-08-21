import { browser, element, by } from 'protractor';

import { appHost } from '../protractor.conf';
import * as crudView from './crud.view';

export const createApplicationButton = element(by.buttonText('Create Application'));

export const visitOpenShiftImageStream = async(name: string) => {
  await browser.get(`${appHost}/k8s/ns/openshift/imagestreams/${name}`);
  await crudView.isLoaded();
};
