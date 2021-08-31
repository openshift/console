import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector, useDispatch } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';
import { SimpleTabNav, Tab } from '@console/internal/components/utils';
import { useQueryParams } from '@console/shared/src';
import SideBarTabLoader from '../providers/SideBarTabLoader';

const SimpleTabNavWrapper: React.FC<{ tabs: Tab[] }> = ({ tabs }) => {
  const { t } = useTranslation();
  const selectedTab = useSelector(({ UI }) => UI.getIn(['overview', 'selectedDetailsTab']));
  const dispatch = useDispatch();
  const queryParams = useQueryParams();
  const selectTabParam = queryParams.get('selectTab');
  const handleClickTab = React.useCallback(
    (name) => {
      dispatch(UIActions.selectOverviewDetailsTab(name));
    },
    [dispatch],
  );
  return (
    <SimpleTabNav
      selectedTab={selectTabParam || selectedTab || t('topology~Details')}
      tabs={tabs}
      tabProps={null}
      onClickTab={handleClickTab}
      additionalClassNames="co-m-horizontal-nav__menu--within-sidebar co-m-horizontal-nav__menu--within-overview-sidebar"
    />
  );
};

const SideBarBody: React.FC<{ element: GraphElement }> = ({ element }) => {
  return (
    <SideBarTabLoader element={element}>
      {(tabs, loaded) => (loaded ? <SimpleTabNavWrapper tabs={tabs} /> : null)}
    </SideBarTabLoader>
  );
};

export default SideBarBody;
