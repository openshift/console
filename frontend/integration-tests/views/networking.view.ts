import { $, $$, browser, ExpectedConditions as until } from 'protractor';
import * as crudView from '../views/crud.view';
import * as utilsView from '../views/utils.view';

const name = $('#name');
const selectServiceBtn = $('#service');
const selectTargetPort = $('#target-port');
const createRouteForm = $('.co-create-route');
const saveButton = $('#save-changes');

const fillRequiredFields = async(routeName: string, servicename: string) => {
  await name.sendKeys(routeName);
  await browser.wait(until.presenceOf(selectServiceBtn));
  await selectServiceBtn.click();
  await utilsView.chooseFromList(servicename);
  await browser.wait(until.presenceOf(selectTargetPort));
  await selectTargetPort.click();
  await $$('li[role=option] a').first().click();
};

export const visitRoutesPage = async(appHost: string, ns: string) => {
  await browser.get(`${appHost}/k8s/ns/${ns}/routes`);
  await crudView.isLoaded();
};

export const visitRoutesDetailsPage = async(appHost: string, ns: string, routename: string) => {
  await browser.get(`${appHost}/k8s/ns/${ns}/routes/${routename}`);
  await crudView.isLoaded();
};

export const createUnsecureRoute = async(routeName: string, servicename: string) => {
  await crudView.createYAMLButton.click();
  await browser.wait(until.presenceOf(createRouteForm));
  await fillRequiredFields(routeName, servicename);
  await saveButton.click();
};

