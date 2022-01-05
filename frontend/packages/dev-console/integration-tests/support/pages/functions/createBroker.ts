import { addOptions } from '../../constants/add';
import { devNavigationMenu } from '../../constants/global';
import { addPage, gitPage } from '../add-flow';
import { app, createForm, navigateTo } from '../app';

export const createBroker = (
  brokerName: string = 'broker-one',
  appName: string = 'nodejs-ex-git-app',
) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.Broker);
  gitPage.enterWorkloadName(brokerName);
  gitPage.enterAppName(appName);
  createForm.clickCreate().then(() => {
    app.waitForLoad();
    cy.log(`Broker "${brokerName}" is created`);
  });
};
