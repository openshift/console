import * as React from 'react';
import { Button } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { ExternalLink } from '@console/internal/components/utils';
import useMigrationTool from '../../../hooks/use-migration-tool';
import MigrationToolContent from './MigrationToolContent';

const MigrationTool = () => {
  const { t } = useTranslation();
  const [
    mtvSubscription,
    mtvOperator,
    mtvForkLift,
    mtvUIRoute,
    createForkLift,
  ] = useMigrationTool();

  return (
    <div className="kv-migration-tool--main">
      {mtvUIRoute ? (
        <Button isInline variant="secondary">
          <ExternalLink text={t('kubevirt-plugin~Launch Migration Tool')} href={mtvUIRoute} />
        </Button>
      ) : (
        <Button
          isInline
          variant="secondary"
          onClick={() =>
            MigrationToolContent({
              mtvOperator,
              mtvSubscription,
              createForkLift,
            })
          }
        >
          {!mtvSubscription && t('kubevirt-plugin~Install Migration Tool')}
          {mtvSubscription && !mtvForkLift && t('kubevirt-plugin~Install ForkLift Instance')}
          {mtvSubscription && mtvForkLift && t('kubevirt-plugin~ForkLift Instance is building...')}
        </Button>
      )}
    </div>
  );
};

export default MigrationTool;
