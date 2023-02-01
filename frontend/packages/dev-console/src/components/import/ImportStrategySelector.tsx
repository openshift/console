import * as React from 'react';
import { FormGroup, Grid, GridItem, Tile } from '@patternfly/react-core';
import { LayerGroupIcon, CubeIcon, GitAltIcon, StarIcon } from '@patternfly/react-icons';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { useAccessReview } from '@console/dynamic-plugin-sdk/src';
import { ImportStrategy } from '@console/git-service/src';
import { getActiveNamespace } from '@console/internal/actions/ui';
import { BuildStrategyType } from '@console/internal/components/build';
import { ServerlessBuildStrategyType } from '@console/knative-plugin/src';
import { FLAG_KNATIVE_SERVING_SERVICE } from '@console/knative-plugin/src/const';
import { ServiceModel as ksvcModel } from '@console/knative-plugin/src/models';
import { getFieldId, useFlag, useFormikValidationFix } from '@console/shared/src';
import ServerlessFxIcon from './ServerlessFxIcon';
import './ImportStrategySelector.scss';

const ImportStrategySelector: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      import: { recommendedStrategy, selectedStrategy },
      build: { strategy },
    },
    setFieldValue,
  } = useFormikContext<FormikValues>();
  const fieldId = getFieldId('import.selectedStrategy', 'importStrategySelect');

  type ItemListType = {
    name: string;
    type: ImportStrategy;
    build: BuildStrategyType | ServerlessBuildStrategyType;
    priority: number;
    detectedFiles: string[];
    icon: React.ReactNode;
  };

  const itemList: ItemListType[] = [
    {
      name: 'Devfile',
      type: ImportStrategy.DEVFILE,
      build: BuildStrategyType.Devfile,
      priority: 2,
      detectedFiles: [],
      icon: <LayerGroupIcon />,
    },
    {
      name: 'Dockerfile',
      type: ImportStrategy.DOCKERFILE,
      build: BuildStrategyType.Docker,
      priority: 1,
      detectedFiles: [],
      icon: <CubeIcon />,
    },
    {
      name: 'Builder Image',
      type: ImportStrategy.S2I,
      build: BuildStrategyType.Source,
      priority: 0,
      detectedFiles: [],
      icon: <GitAltIcon />,
    },
  ];

  const [knativeServiceAccess] = useAccessReview({
    group: ksvcModel.apiGroup,
    resource: ksvcModel.plural,
    namespace: getActiveNamespace(),
    verb: 'create',
  });

  const canIncludeKnative = useFlag(FLAG_KNATIVE_SERVING_SERVICE) && knativeServiceAccess;

  if (recommendedStrategy?.type === ImportStrategy.SERVERLESS_FUNCTION && canIncludeKnative) {
    itemList.push({
      name: 'Serverless Function',
      type: ImportStrategy.SERVERLESS_FUNCTION,
      build: ServerlessBuildStrategyType.ServerlessFunction,
      priority: 3,
      detectedFiles: [],
      icon: <ServerlessFxIcon />,
    });
  }

  const onSelect = React.useCallback(
    (item) => {
      setFieldValue('import.selectedStrategy.name', item.name);
      setFieldValue('import.selectedStrategy.type', item.type);
      setFieldValue('import.selectedStrategy.priority', item.priority);
      setFieldValue('import.selectedStrategy.detectedFiles', item.detectedFiles);
      setFieldValue('build.strategy', item.build);
      setFieldValue('import.strategyChanged', false);
    },
    [setFieldValue],
  );

  useFormikValidationFix(strategy);

  return (
    <FormGroup fieldId={fieldId} label={t('devconsole~Import Strategy')}>
      <Grid hasGutter>
        {itemList.map((item) => (
          <GridItem span={4} key={item.name}>
            <Tile
              className="odc-import-strategy-selector__tile"
              data-test={`import-strategy ${item.name}`}
              title={item.name}
              icon={item.icon}
              onClick={() => onSelect(item)}
              isSelected={selectedStrategy.type === item.type}
            >
              {recommendedStrategy?.type === item.type && (
                <span className="odc-import-strategy-selector__recommended">
                  <StarIcon />
                </span>
              )}
            </Tile>
          </GridItem>
        ))}
      </Grid>
    </FormGroup>
  );
};

export default ImportStrategySelector;
