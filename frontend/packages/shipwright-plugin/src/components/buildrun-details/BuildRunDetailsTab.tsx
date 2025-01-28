import * as React from 'react';
import { Flex, FlexItem, Content, ContentVariants } from '@patternfly/react-core';
import { useTranslation } from 'react-i18next';
import { Conditions } from '@console/internal/components/conditions';
import { SectionHeading, ResourceSummary } from '@console/internal/components/utils';
import { BuildRun } from '../../types';
import { isV1Alpha1Resource } from '../../utils';
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
                <Content component={ContentVariants.h3}>
                  {t('shipwright-plugin~BuildSpec details')}
                </Content>
                <BuildSpecSection
                  obj={buildRun}
                  buildSpec={
                    buildRun.status?.buildSpec ||
                    (isV1Alpha1Resource(buildRun)
                      ? buildRun.spec?.buildSpec
                      : buildRun.spec?.build?.spec)
                  }
                  path={
                    buildRun.status?.buildSpec
                      ? 'status.buildSpec'
                      : isV1Alpha1Resource(buildRun)
                      ? 'spec.buildSpec'
                      : 'spec.build.spec'
                  }
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
