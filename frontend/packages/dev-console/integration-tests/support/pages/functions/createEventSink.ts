import { addOptions } from '../../constants/add';
import { devNavigationMenu } from '../../constants/global';
import { addPage, createEventSinkPage, eventSinkPage, gitPage } from '../add-flow';
import { app, createForm, navigateTo } from '../app';

export const createEventSink = (
  cardName: string = 'Log Sink',
  target: string,
  eventSinkName: string = 'event-sink-one',
) => {
  navigateTo(devNavigationMenu.Add);
  addPage.selectCardFromOptions(addOptions.EventSink);
  eventSinkPage.search(cardName);
  eventSinkPage.clickEventSourceType(cardName);
  eventSinkPage.clickCreateEventSinkOnSidePane();
  createEventSinkPage.selectOutputTargetName(target);
  gitPage.enterWorkloadName(eventSinkName);
  createForm.clickCreate().then(() => {
    app.waitForLoad();
    cy.log(`Event Sink "${eventSinkName}" is created`);
  });
};
