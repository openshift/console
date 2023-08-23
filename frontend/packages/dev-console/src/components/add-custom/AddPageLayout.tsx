import * as React from 'react';
import { AddActionGroup, isAddActionGroup } from '@console/dynamic-plugin-sdk';
import { getQueryArgument } from '@console/internal/components/utils';
import { useExtensions } from '@console/plugin-sdk/src';
import { PageLayout, useActiveNamespace, RestoreGettingStartedButton } from '@console/shared';
import { filterNamespaceScopedUrl } from '../../utils/add-page-utils';
import { useAddActionExtensions } from '../../utils/useAddActionExtensions';
import { ResourceQuotaAlert } from '../resource-quota/ResourceQuotaAlert';
import AddCardSection from './AddCardSection';
import { GETTING_STARTED_USER_SETTINGS_KEY } from './constants';
import { useAccessFilterExtensions } from './hooks/useAccessFilterExtensions';
import TopologyQuickSearch from './TopologyQuickSearch';
import TopologyQuickSearchButton from './TopologyQuickSearchButton';
import './AddPageLayout.scss';

type AddPageLayoutProps = {
  title: string;
  hintBlock?: React.ReactNode;
};

const AddPageLayout: React.FC<AddPageLayoutProps> = ({ title, hintBlock: additionalHint }) => {
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

  const extensionsLoaded: boolean =
    addActionExtensionsResolved && filteredAddActionExtensionsLoaded;
  const addActionLoadingFailed: boolean =
    !allAddActionsDisabled && addActionExtensionsResolved && addActionExtensions?.length === 0;
  const addActionAccessCheckFailed: boolean =
    !allAddActionsDisabled && extensionsLoaded && filteredAddActionExtensions?.length === 0;

  const getHint = (): React.ReactNode => {
    return (
      <>
        <div className="odc-add-page-layout__hint-block  pf-u-pt-md">
          <div className="odc-add-page-layout__hint-block__text">
            <TopologyQuickSearchButton onClick={() => setIsQuickSearchOpen(true)} />
          </div>
          <div className="odc-add-page-layout__hint-block__actions">
            <div className="odc-add-page-layout__resource-quota-message-block">
              <ResourceQuotaAlert namespace={activeNamespace} />
            </div>
            <RestoreGettingStartedButton userSettingsKey={GETTING_STARTED_USER_SETTINGS_KEY} />
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
