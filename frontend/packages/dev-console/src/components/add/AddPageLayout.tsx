import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { LoadingBox } from '@console/internal/components/utils';
import { AddActionGroup, isAddActionGroup } from '@console/dynamic-plugin-sdk';
import { Switch, Tooltip } from '@patternfly/react-core';
import { PageLayout, useActiveNamespace } from '@console/shared';
import { useExtensions } from '@console/plugin-sdk/src';
import AddCardSection from './AddCardSection';
import { useAddActionExtensions } from '../../utils/useAddActionExtensions';
import { useShowAddCardItemDetails } from '../../hooks/useShowAddCardItemDetails';
import './AddPageLayout.scss';

type AddPageLayoutProps = {
  title: string;
  hintBlock?: React.ReactNode;
};

const AddPageLayout: React.FC<AddPageLayoutProps> = ({ title, hintBlock }) => {
  const { t } = useTranslation();
  const [activeNamespace] = useActiveNamespace();
  const addActionGroupExtensions = useExtensions<AddActionGroup>(isAddActionGroup);
  const [addActionExtensions, resolved] = useAddActionExtensions();

  const [showDetails, setShowDetails] = useShowAddCardItemDetails();

  if (!resolved) {
    return <LoadingBox />;
  }

  const defaultHintText = t(
    'devconsole~Select a way to create an Application, component or service from one of the options.',
  );

  const defaultHintBlock: React.ReactNode = (
    <div className="odc-add-page-layout-hint-block">
      <div className="odc-add-page-layout-hint-block__text">{defaultHintText}</div>
      <div className="odc-add-page-layout-hint-block__details-switch">
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
        <span className="odc-add-page-layout-hint-block__details-switch__text">
          {showDetails ? t('devconsole~Details on') : t('devconsole~Details off')}
        </span>
      </div>
    </div>
  );

  return (
    <PageLayout title={title} hint={hintBlock || defaultHintBlock} isDark>
      {/* GettingStartedSection component will be added in https://issues.redhat.com/browse/ODC-5560 */}
      <AddCardSection
        addActionExtensions={addActionExtensions}
        addActionGroupExtensions={addActionGroupExtensions}
        namespace={activeNamespace}
      />
    </PageLayout>
  );
};

export default AddPageLayout;
