import * as React from 'react';
import { Skeleton, Switch, Tooltip } from '@patternfly/react-core';
import * as cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { AddActionGroup, isAddActionGroup } from '@console/dynamic-plugin-sdk';
import { getQueryArgument } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src';
import { PageLayout, useActiveNamespace } from '@console/shared';
import TopologyQuickSearch from '@console/topology/src/components/quick-search/TopologyQuickSearch';
import TopologyQuickSearchButton from '@console/topology/src/components/quick-search/TopologyQuickSearchButton';
import { filterNamespaceScopedUrl } from '../../utils/add-page-utils';
import { useAddActionExtensions } from '../../utils/useAddActionExtensions';
import { ResourceQuotaAlert } from '../resource-quota/ResourceQuotaAlert';
import AddCardSection from './AddCardSection';
import { GettingStartedSection } from './GettingStartedSection';
import { useAccessFilterExtensions } from './hooks/useAccessFilterExtensions';
import { useShowAddCardItemDetails } from './hooks/useShowAddCardItemDetails';
import './AddPageLayout.scss';

type AddPageLayoutProps = {
  title: string;
  hintBlock?: React.ReactNode;
};

const AddPageLayout: React.FC<AddPageLayoutProps> = ({ title, hintBlock: additionalHint }) => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const [viewContainer, setViewContainer] = React.useState<HTMLElement>(null);
  const [isQuickSearchOpen, setIsQuickSearchOpen] = React.useState<boolean>(
    typeof getQueryArgument('catalogSearch') === 'string',
  );
  const setIsQuickSearchOpenAndFireEvent = React.useCallback((open: boolean) => {
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

  const getHint = (): React.ReactNode => {
    return (
      <>
        <div className="odc-add-page-layout__hint-block">
          <div className="odc-add-page-layout__hint-block__text">
            <TopologyQuickSearchButton onClick={() => setIsQuickSearchOpen(true)} />
          </div>
          <div className="odc-add-page-layout__hint-block__actions">
            <div className="odc-add-page-layout__resource-quota-message-block">
              <ResourceQuotaAlert namespace={activeNamespace} />
            </div>
            <div
              className={cx('odc-add-page-layout__hint-block__details-switch', {
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
                  <Skeleton shape="circle" width="24px" />
                ))}
            </div>
          </div>
          <TopologyQuickSearch
            namespace={activeNamespace}
            viewContainer={viewContainer}
            isOpen={isQuickSearchOpen}
            setIsOpen={setIsQuickSearchOpenAndFireEvent}
          />
        </div>
        {additionalHint && (
          <div className="odc-add-page-layout__additional-hint-block">{additionalHint}</div>
        )}
      </>
    );
  };

  return (
    <div
      className="odc-add-page-layout ocs-quick-search-modal__no-backdrop"
      data-test="add-page"
      ref={setViewContainer}
    >
      <PageLayout title={title} hint={getHint()}>
        <GettingStartedSection />
        <AddCardSection
          addActionExtensions={filteredAddActionExtensions}
          addActionGroupExtensions={addActionGroupExtensions}
          namespace={activeNamespace}
          extensionsLoaded={extensionsLoaded}
          loadingFailed={addActionLoadingFailed}
          accessCheckFailed={addActionAccessCheckFailed}
        />
      </PageLayout>
    </div>
  );
};

export default AddPageLayout;
