/* eslint-disable no-undef, no-unused-vars */

import { $, $$, by, browser, ExpectedConditions as until } from 'protractor';

export const isLoaded = () => browser.wait(until.presenceOf($('.co-clusterserviceversion-list')), 10000);

export const appTiles = $$('.co-clusterserviceversion-list-item');

export const appTileFor = (name: string) => appTiles.filter(tile => tile.$('.co-clusterserviceversion-logo__name__clusterserviceversion').getText()
  .then(text => text === name)).first();

export const viewDetailsFor = (name: string) => appTileFor(name).element(by.linkText('View details')).click();

export const viewInstancesFor = (name: string) => appTileFor(name).element(by.linkText('View instances')).click();
