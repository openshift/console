import { addPage, channelPage } from '../add-flow';
import { addOptions } from '../../constants/add';
import { app, createForm, navigateTo } from '../app';
import { devNavigationMenu } from '../../constants/global';

export const createChannel = (
  channelName: string = 'channel-one',
  appName: string = 'nodejs-ex-git-app',
) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.Channel);
  channelPage.selectChannelType();
  channelPage.enterChannelName(channelName);
  channelPage.enterAppName(appName);
  createForm.clickCreate().then(() => {
    app.waitForLoad();
    cy.log(`Channel "${channelName}" is created`);
  });
};
