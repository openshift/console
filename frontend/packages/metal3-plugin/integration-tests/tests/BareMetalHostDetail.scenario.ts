import {
  navigateToDetailPage,
  navigateToTab,
  detailsTabSectionHeading,
} from '../views/BareMetalHostDetail.view';
import { getResourceTitle } from '../views/common';

const name = 'openshift-worker-0';

xdescribe('Bare Metal Host detail', () => {
  beforeAll(async () => {
    await navigateToDetailPage(name);
  });

  it('loads', () => {
    const titleText = getResourceTitle();
    expect(titleText).toEqual(name);
  });
});

xdescribe('Bare Metal Host Details tab', () => {
  beforeAll(async () => {
    await navigateToDetailPage(name);
    await navigateToTab('Details');
  });

  it('loads', () => {
    expect(detailsTabSectionHeading.getText()).toEqual('Bare Metal Host Overview');
  });
});
