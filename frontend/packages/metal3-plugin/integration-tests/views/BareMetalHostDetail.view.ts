import { $ } from 'protractor';
import { isLoaded } from '@console/internal-integration-tests/views/crud.view';
import { navigateToListView } from './BareMetalHostsPage.view';
import { clickHorizontalTab } from '@console/internal-integration-tests/views/horizontal-nav.view';

export const activeTab = $('.co-m-horizontal-nav-item--active');
export const detailsTabSectionHeading = $('.co-section-heading');

export const navigateToDetailPage = async (name: string) => {
  await navigateToListView();
  const workerLink = $(`[data-test-id="${name}"]`);
  await workerLink.click();
  await isLoaded();
};

export const navigateToTab = async (tabName: string) => {
  if ((await activeTab.getText()) !== tabName) {
    await clickHorizontalTab(tabName);
    await isLoaded();
  }
};
