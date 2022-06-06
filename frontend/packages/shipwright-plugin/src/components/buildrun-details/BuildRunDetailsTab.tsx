import * as React from 'react';
import { Flex, FlexItem, Text, TextVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Conditions } from '@console/internal/components/conditions';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { BuildRun } from '../../types';
import BuildSpecSection from '../build-details/BuildSpecSection';
import BuildRunSection from './BuildRunSection';

type BuildRunDetailsTabProps = {
  obj: BuildRun;
};

const BuildRunDetailsTab: React.FC<BuildRunDetailsTabProps> = ({ obj: buildRun }) => {
  const { t } = useTranslation();

  return (
    <>
      <div className="co-m-pane__body">
        <SectionHeading text={t('shipwright-plugin~BuildRun details')} />

        <div className="row">
          <div className="col-sm-6">
            <ResourceSummary resource={buildRun} />
          </div>
          <div className="col-sm-6">
            <Flex direction={{ default: 'column' }}>
              <FlexItem>
                <BuildRunSection buildRun={buildRun} />
              </FlexItem>
              <FlexItem>
                <Text component={TextVariants.h3}>{t('shipwright-plugin~BuildSpec details')}</Text>
                <BuildSpecSection
                  obj={buildRun}
                  buildSpec={buildRun.status?.buildSpec || buildRun.spec?.buildSpec}
                  path={buildRun.status?.buildSpec ? 'status.buildSpec' : 'spec.buildSpec'}
                />
              </FlexItem>
            </Flex>
          </div>
        </div>
      </div>

      {buildRun.status?.conditions?.length ? (
        <div className="co-m-pane__body">
          <SectionHeading text={t('shipwright-plugin~Conditions')} />
          <Conditions conditions={buildRun.status.conditions} />
        </div>
      ) : null}
    </>
  );
};

export default BuildRunDetailsTab;
