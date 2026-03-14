import type { FC } from 'react';
import { useCallback } from 'react';
import type { GraphElement } from '@patternfly/react-topology';
import { useTranslation } from 'react-i18next';
import * as UIActions from '@console/internal/actions/ui';
import type { Tab } from '@console/internal/components/utils';
import { SimpleTabNav } from '@console/internal/components/utils';
import { useConsoleDispatch } from '@console/shared/src/hooks/useConsoleDispatch';
import { useConsoleSelector } from '@console/shared/src/hooks/useConsoleSelector';
import { useQueryParams } from '@console/shared/src/hooks/useQueryParams';
import SideBarTabLoader from '../providers/SideBarTabLoader';

const SimpleTabNavWrapper: FC<{ tabs: Tab[] }> = ({ tabs }) => {
  const { t } = useTranslation();
  const selectedTab = useConsoleSelector<string>(({ UI }) =>
    UI.getIn(['overview', 'selectedDetailsTab']),
  );
  const dispatch = useConsoleDispatch();
  const queryParams = useQueryParams();
  const selectTabParam = queryParams.get('selectTab');
  const handleClickTab = useCallback(
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

const SideBarBody: FC<{ element: GraphElement }> = ({ element }) => {
  const uid = element.getId();
  return (
    <SideBarTabLoader key={uid} element={element}>
      {(tabs, loaded) => (loaded ? <SimpleTabNavWrapper tabs={tabs} /> : null)}
    </SideBarTabLoader>
  );
};

export default SideBarBody;
