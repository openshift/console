import * as React from 'react';
import { shallow, ShallowWrapper } from 'enzyme';
import * as rbacModule from '@console/dynamic-plugin-sdk/src/app/components/utils/rbac';
import * as flagsModule from '@console/dynamic-plugin-sdk/src/utils/flags';
import * as k8sGet from '@console/internal/components/utils/k8s-get-hook';
import { MultiTabListPage } from '@console/shared';
import { t } from '../../../../../../__mocks__/i18next';
import { sampleSecretData } from '../../../test-data/pac-data';
import * as pipelinesHooks from '../../../utils/hooks';
import PipelinesListPage from '../PipelinesListsPage';

const i18nNS = 'pipelines-plugin';

type PipelinesListPageProps = React.ComponentProps<typeof PipelinesListPage>;

describe('PipelinesListPage', () => {
  let wrapper: ShallowWrapper<PipelinesListPageProps>;
  let spyUseFlag;
  let spyPipelineTechPreviewBadge;
  let spyUseAccessReview;
  let spyK8sGet;

  beforeEach(() => {
    spyUseFlag = jest.spyOn(flagsModule, 'useFlag');
    spyPipelineTechPreviewBadge = jest.spyOn(pipelinesHooks, 'usePipelineTechPreviewBadge');
    spyUseAccessReview = jest.spyOn(rbacModule, 'useAccessReview');
    spyK8sGet = jest.spyOn(k8sGet, 'useK8sGet');

    spyUseFlag.mockReturnValue(true);
    spyPipelineTechPreviewBadge.mockReturnValue(null);
    spyUseAccessReview.mockReturnValue([true, false]);
    spyK8sGet.mockReturnValue([sampleSecretData, true, null]);
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('Shoud show CTA for GitHub app as Setup GitHub App if user has required access and App has not been setup', () => {
    spyK8sGet.mockReturnValue([undefined, true, null]);
    wrapper = shallow(<PipelinesListPage />);
    const multiTabListPage = wrapper.find(MultiTabListPage);
    expect(multiTabListPage.exists()).toBe(true);
    expect(multiTabListPage.props().secondaryButtonAction.href).toEqual(
      '/pac/ns/openshift-pipelines',
    );
    expect(multiTabListPage.props().secondaryButtonAction.label).toEqual(
      t(`${i18nNS}~Setup GitHub App`),
    );
  });

  it('Shoud show CTA for GitHub app as View GitHub App if user has required access and App has been setup', () => {
    wrapper = shallow(<PipelinesListPage />);
    const multiTabListPage = wrapper.find(MultiTabListPage);
    expect(multiTabListPage.exists()).toBe(true);
    expect(multiTabListPage.props().secondaryButtonAction.href).toEqual(
      '/pac/ns/openshift-pipelines',
    );
    expect(multiTabListPage.props().secondaryButtonAction.label).toEqual(
      t(`${i18nNS}~View GitHub App`),
    );
  });

  it('Shoud not show CTA for GitHub app if user does not have required access', () => {
    spyUseAccessReview.mockReturnValue([false, false]);
    wrapper = shallow(<PipelinesListPage />);
    const multiTabListPage = wrapper.find(MultiTabListPage);
    expect(multiTabListPage.exists()).toBe(true);
    expect(multiTabListPage.props().secondaryButtonAction).toBeUndefined();
  });
});
