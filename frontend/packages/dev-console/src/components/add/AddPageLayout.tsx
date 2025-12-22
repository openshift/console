import type { FC } from 'react';
import { useState, useCallback } from 'react';
import { PageSection, Skeleton, Switch, Tooltip } from '@patternfly/react-core';
import { css } from '@patternfly/react-styles';
import { useTranslation } from 'react-i18next';
import { AddActionGroup, isAddActionGroup } from '@console/dynamic-plugin-sdk';
import { GettingStartedSection } from '@console/internal/components/dashboard/project-dashboard/getting-started/GettingStartedSection';
import { getQueryArgument } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src/api/useExtensions';
import { useActiveNamespace } from '@console/shared';
import { PageHeading } from '@console/shared/src/components/heading/PageHeading';
import TopologyQuickSearch from '@console/topology/src/components/quick-search/TopologyQuickSearch';
import TopologyQuickSearchButton from '@console/topology/src/components/quick-search/TopologyQuickSearchButton';
import { filterNamespaceScopedUrl } from '../../utils/add-page-utils';
import { useAddActionExtensions } from '../../utils/useAddActionExtensions';
import { ResourceQuotaAlert } from '../resource-quota/ResourceQuotaAlert';
import AddCardSection from './AddCardSection';
import { useAccessFilterExtensions } from './hooks/useAccessFilterExtensions';
import { useShowAddCardItemDetails } from './hooks/useShowAddCardItemDetails';
import './AddPageLayout.scss';

type AddPageLayoutProps = {
  title: string;
};

const AddPageLayout: FC<AddPageLayoutProps> = ({ title }) => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const [isQuickSearchOpen, setIsQuickSearchOpen] = useState<boolean>(
    typeof getQueryArgument('catalogSearch') === 'string',
  );
  const setIsQuickSearchOpenAndFireEvent = useCallback((open: boolean) => {
    setIsQuickSearchOpen(open);
  }, []);
  const addActionGroupExtensions = useExtensions<AddActionGroup>(isAddActionGroup);
  const [
    addActionExtensions,
    addActionExtensionsResolved,
    allAddActionsDisabled,
  ] = useAddActionExtensions();
  const [
    filteredAddActionExtensions,
    filteredAddActionExtensionsLoaded,
  ] = useAccessFilterExtensions(
    activeNamespace,
    filterNamespaceScopedUrl(activeNamespace, addActionExtensions),
  );
  const [showDetails, setShowDetails] = useShowAddCardItemDetails();

  const extensionsLoaded: boolean =
    addActionExtensionsResolved && filteredAddActionExtensionsLoaded;
  const addActionLoadingFailed: boolean =
    !allAddActionsDisabled && addActionExtensionsResolved && addActionExtensions?.length === 0;
  const addActionAccessCheckFailed: boolean =
    !allAddActionsDisabled && extensionsLoaded && filteredAddActionExtensions?.length === 0;

  const HelpText = (
    <div className="odc-add-page-layout__hint-block">
      <div className="odc-add-page-layout__hint-block__text">
        <TopologyQuickSearchButton
          onClick={() => setIsQuickSearchOpen(true)}
          tooltipPosition="top"
        />
      </div>
      <div className="odc-add-page-layout__hint-block__actions">
        <div className="odc-add-page-layout__resource-quota-message-block">
          <ResourceQuotaAlert namespace={activeNamespace} />
        </div>
        <div
          className={css('odc-add-page-layout__hint-block__details-switch', {
            'odc-add-page-layout__hint-block__details-switch__loading-state': !extensionsLoaded,
          })}
          data-test="details-switch"
        >
          {!allAddActionsDisabled &&
            (extensionsLoaded ? (
              <Tooltip
                content={t('devconsole~Show or hide details about each item')}
                position="top"
              >
                <Switch
                  aria-label={
                    showDetails
                      ? t('devconsole~Show add card details')
                      : t('devconsole~Hide add card details')
                  }
                  isChecked={showDetails}
                  onChange={(_event, checked) => {
                    setShowDetails(checked);
                  }}
                  data-test="switch"
                  label={showDetails ? t('devconsole~Details on') : t('devconsole~Details off')}
                  className="odc-add-page-layout__hint-block__details-switch__text"
                />
              </Tooltip>
            ) : (
              <Skeleton shape="circle" width="24px" data-test="add-page-skeleton" />
            ))}
        </div>
      </div>
      <TopologyQuickSearch
        namespace={activeNamespace}
        isOpen={isQuickSearchOpen}
        setIsOpen={setIsQuickSearchOpenAndFireEvent}
      />
    </div>
  );

  return (
    <div className="odc-add-page-layout ocs-quick-search-modal__no-backdrop" data-test="add-page">
      <PageHeading title={title} />
      <PageSection>
        {HelpText}
        <GettingStartedSection userSettingKey="devconsole.addPage.gettingStarted" />
        <AddCardSection
          addActionExtensions={filteredAddActionExtensions}
          addActionGroupExtensions={addActionGroupExtensions}
          namespace={activeNamespace}
          extensionsLoaded={extensionsLoaded}
          loadingFailed={addActionLoadingFailed}
          accessCheckFailed={addActionAccessCheckFailed}
        />
      </PageSection>
    </div>
  );
};

export default AddPageLayout;
