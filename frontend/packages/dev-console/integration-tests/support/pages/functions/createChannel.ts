import { addOptions } from '../../constants/add';
import { devNavigationMenu } from '../../constants/global';
import { addPage, channelPage } from '../add-flow';
import { app, createForm, navigateTo } from '../app';

export const createChannel = (channelName: string = 'channel-one') => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.Channel);
  channelPage.selectChannelType();
  channelPage.enterChannelName(channelName);
  createForm.clickCreate().then(() => {
    app.waitForLoad();
    cy.log(`Channel "${channelName}" is created`);
  });
};
