import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Switch, Tooltip } from '@patternfly/react-core';
import { useExtensions } from '@console/plugin-sdk/src';
import { LoadingBox } from '@console/internal/components/utils';
import { AddActionGroup, isAddActionGroup } from '@console/dynamic-plugin-sdk';
import { PageLayout, useActiveNamespace, RestoreGettingStartedButton } from '@console/shared';

import { useAddActionExtensions } from '../../utils/useAddActionExtensions';
import { useShowAddCardItemDetails } from '../../hooks/useShowAddCardItemDetails';

import AddCardSection from './AddCardSection';
import { GettingStartedSection } from './GettingStartedSection';
import { GETTING_STARTED_USER_SETTINGS_KEY } from './constants';

import './AddPageLayout.scss';

type AddPageLayoutProps = {
  title: string;
  hintBlock?: React.ReactNode;
};

const AddPageLayout: React.FC<AddPageLayoutProps> = ({ title, hintBlock: additionalHint }) => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const addActionGroupExtensions = useExtensions<AddActionGroup>(isAddActionGroup);
  const [addActionExtensions, resolved] = useAddActionExtensions();

  const [showDetails, setShowDetails] = useShowAddCardItemDetails();

  if (!resolved) {
    return <LoadingBox />;
  }

  const hintText = t(
    'devconsole~Select a way to create an Application, component or service from one of the options.',
  );

  const hint: React.ReactNode = (
    <>
      <div className="odc-add-page-layout__hint-block">
        <div className="odc-add-page-layout__hint-block__text">{hintText}</div>
        <div className="odc-add-page-layout__hint-block__actions">
          <RestoreGettingStartedButton userSettingsKey={GETTING_STARTED_USER_SETTINGS_KEY} />
          <div className="odc-add-page-layout__hint-block__details-switch">
            <Tooltip content={t('devconsole~Show or hide details about each item')} position="top">
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
                data-test-id="odc-add-page-details-switch"
              />
            </Tooltip>
            <span className="odc-add-page-layout__hint-block__details-switch__text">
              {showDetails ? t('devconsole~Details on') : t('devconsole~Details off')}
            </span>
          </div>
        </div>
      </div>
      {additionalHint && (
        <div className="odc-add-page-layout__additional-hint-block">{additionalHint}</div>
      )}
    </>
  );

  return (
    <div className="odc-add-page-layout">
      <PageLayout title={title} hint={hint} isDark>
        <GettingStartedSection />
        <AddCardSection
          addActionExtensions={addActionExtensions}
          addActionGroupExtensions={addActionGroupExtensions}
          namespace={activeNamespace}
        />
      </PageLayout>
    </div>
  );
};

export default AddPageLayout;
