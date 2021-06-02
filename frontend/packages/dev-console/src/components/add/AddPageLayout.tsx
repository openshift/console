import * as React from 'react';
import { Skeleton, Switch, Tooltip } from '@patternfly/react-core';
import * as cx from 'classnames';
import { useTranslation } from 'react-i18next';
import { AddActionGroup, isAddActionGroup } from '@console/dynamic-plugin-sdk';
import { useExtensions } from '@console/plugin-sdk/src';
import { PageLayout, useActiveNamespace, RestoreGettingStartedButton } from '@console/shared';
import { filterNamespaceScopedUrl } from '../../utils/add-page-utils';
import { useAddActionExtensions } from '../../utils/useAddActionExtensions';
import AddCardSection from './AddCardSection';
import { GETTING_STARTED_USER_SETTINGS_KEY } from './constants';
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
  const addActionGroupExtensions = useExtensions<AddActionGroup>(isAddActionGroup);
  const [addActionExtensions, addActionExtensionsResolved] = useAddActionExtensions();
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
    addActionExtensionsResolved && addActionExtensions?.length === 0;
  const addActionAccessCheckFailed: boolean =
    extensionsLoaded && filteredAddActionExtensions?.length === 0;

  const getHint = (): React.ReactNode => {
    const hintText: string = t(
      'devconsole~Select a way to create an Application, component or service from one of the options.',
    );
    const switchText: string = showDetails
      ? t('devconsole~Details on')
      : t('devconsole~Details off');
    return (
      <>
        <div className="odc-add-page-layout__hint-block">
          <div className="odc-add-page-layout__hint-block__text">{hintText}</div>
          <div className="odc-add-page-layout__hint-block__actions">
            <RestoreGettingStartedButton userSettingsKey={GETTING_STARTED_USER_SETTINGS_KEY} />
            <div
              className={cx('odc-add-page-layout__hint-block__details-switch', {
                'odc-add-page-layout__hint-block__details-switch__loading-state': !extensionsLoaded,
              })}
              data-test="details-switch"
            >
              {extensionsLoaded ? (
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
                    onChange={(checked) => {
                      setShowDetails(checked);
                    }}
                    data-test="switch"
                  />
                </Tooltip>
              ) : (
                <Skeleton shape="circle" width="24px" />
              )}
              <span
                className="odc-add-page-layout__hint-block__details-switch__text"
                data-test="label"
              >
                {extensionsLoaded ? switchText : <Skeleton height="100%" width="64px" />}
              </span>
            </div>
          </div>
        </div>
        {additionalHint && (
          <div className="odc-add-page-layout__additional-hint-block">{additionalHint}</div>
        )}
      </>
    );
  };

  return (
    <div className="odc-add-page-layout" data-test="add-page">
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
