import * as React from 'react';
import { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import { useSelector, useDispatch } from 'react-redux';
import * as UIActions from '@console/internal/actions/ui';
import { SimpleTabNav, Tab } from '@console/internal/components/utils';
import { RootState } from '@console/internal/redux';
import { useQueryParams } from '@console/shared/src';
import SideBarTabLoader from '../providers/SideBarTabLoader';

const SimpleTabNavWrapper: React.FC<{ tabs: Tab[] }> = ({ tabs }) => {
  const { t } = useTranslation();
  const selectedTab = useSelector<RootState, string>(({ UI }) =>
    UI.getIn(['overview', 'selectedDetailsTab']),
  );
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
      withinSidebar
      selectedTab={selectTabParam || selectedTab || t('topology~Details')}
      tabs={tabs}
      onClickTab={handleClickTab}
    />
  );
};

const SideBarBody: React.FC<{ element: GraphElement }> = ({ element }) => {
  const uid = element.getId();
  return (
    <SideBarTabLoader key={uid} element={element}>
      {(tabs, loaded) => (loaded ? <SimpleTabNavWrapper tabs={tabs} /> : null)}
    </SideBarTabLoader>
  );
};

export default SideBarBody;
