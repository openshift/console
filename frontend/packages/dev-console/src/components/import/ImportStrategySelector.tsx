import * as React from 'react';
import { FormGroup, Grid, GridItem, Tile } from '@patternfly/react-core';
import { LayerGroupIcon, CubeIcon, GitAltIcon, StarIcon } from '@patternfly/react-icons';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ImportStrategy } from '@console/git-service/src';
import { BuildStrategyType } from '@console/internal/components/build';
import { getFieldId, useFormikValidationFix } from '@console/shared/src';
import './ImportStrategySelector.scss';

const ImportStrategySelector: React.FC = () => {
  const { t } = useTranslation();
  const {
    values: {
      import: { recommendedStrategy, selectedStrategy },
      build: { strategy },
    },
    setFieldValue,
    setFieldTouched,
  } = useFormikContext<FormikValues>();
  const fieldId = getFieldId('import.selectedStrategy', 'importStrategySelect');

  const itemList = [
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

  const onSelect = React.useCallback(
    (item) => {
      setFieldValue('import.selectedStrategy.name', item.name);
      setFieldValue('import.selectedStrategy.type', item.type);
      setFieldValue('import.selectedStrategy.priority', item.priority);
      setFieldValue('import.selectedStrategy.detectedFiles', item.detectedFiles);
      setFieldValue('build.strategy', item.build);
      setFieldTouched('import.selectedStrategy', true);
    },
    [setFieldTouched, setFieldValue],
  );

  useFormikValidationFix(strategy);

  return (
    <FormGroup fieldId={fieldId} label={t('devconsole~Import Strategy')}>
      <Grid hasGutter>
        {itemList.map((item) => (
          <GridItem span={4} key={item.name}>
            <Tile
              className="odc-import-strategy-selector__tile"
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
