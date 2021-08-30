import * as React from 'react';
import {
  AlertVariant,
  Alert,
  ButtonVariant,
  Button,
  SplitItem,
  Split,
} from '@patternfly/react-core';
import { PencilAltIcon, UndoIcon } from '@patternfly/react-icons';
import { FormikValues, useFormikContext } from 'formik';
import { useTranslation } from 'react-i18next';
import { ImportStrategy } from '@console/git-service/src';
import { NormalizedBuilderImages } from '../../utils/imagestream-utils';
import BuilderSection from './builder/BuilderSection';
import DevfileStrategySection from './devfile/DevfileStrategySection';
import DockerSection from './git/DockerSection';
import ImportStrategySelector from './ImportStrategySelector';
import FormSection from './section/FormSection';
import './ImportStrategySection.scss';

export interface ImportStrategySectionProps {
  builderImages: NormalizedBuilderImages;
}

const ImportStrategySection: React.FC<ImportStrategySectionProps> = ({ builderImages }) => {
  const { t } = useTranslation();
  const { values, setFieldValue, setValues } = useFormikContext<FormikValues>();
  const {
    import: {
      strategies: importStrategies,
      loaded,
      loadError,
      selectedStrategy,
      showEditImportStrategy,
      recommendedStrategy,
    },
    devfile,
    docker,
  } = values;
  const recommendedValues = React.useRef<FormikValues>(null);

  const strategySections = React.useMemo(
    () => ({
      [ImportStrategy.DEVFILE]: <DevfileStrategySection />,
      [ImportStrategy.DOCKERFILE]: <DockerSection />,
      [ImportStrategy.S2I]: <BuilderSection builderImages={builderImages} />,
    }),
    [builderImages],
  );

  const recommendedStrategyDescriptions = React.useMemo(
    () => ({
      [ImportStrategy.DEVFILE]: t('devconsole~The Devfile at {{filePath}} is recommended.', {
        filePath: devfile?.devfilePath,
      }),
      [ImportStrategy.DOCKERFILE]: t('devconsole~The Dockerfile at {{filePath}} is recommended.', {
        filePath: docker?.dockerfilePath,
      }),
      [ImportStrategy.S2I]: t('devconsole~A Builder Image is recommended.'),
    }),
    [devfile, docker, t],
  );

  const alertInfo = React.useMemo(() => {
    let title;
    let description;
    let variant;
    if (loaded && !loadError && importStrategies.length > 0) {
      variant = AlertVariant.success;
      if (selectedStrategy.type === recommendedStrategy.type) {
        if (importStrategies.length > 1) {
          title = t('devconsole~Multiple import strategies detected');
        } else if (importStrategies.length === 1) {
          title = t('devconsole~{{strategy}} detected.', { strategy: selectedStrategy.name });
        }
        description = recommendedStrategyDescriptions[selectedStrategy.type];
      } else {
        title = t('devconsole~Import strategy changed to {{strategy}}', {
          strategy: selectedStrategy.name,
        });
        description = '';
        variant = AlertVariant.info;
      }
    } else {
      variant = AlertVariant.warning;
      title = t('devconsole~Unable to detect import strategy');
      description = (
        <span>
          {loadError && (
            <>
              <p>{t('devconsole~Error: {{loadError}}', { loadError })}</p> <br />
            </>
          )}
          <p>{t('devconsole~Select from the options below.')}</p>
        </span>
      );
    }
    return { title, description, variant };
  }, [
    loaded,
    loadError,
    importStrategies.length,
    selectedStrategy.type,
    selectedStrategy.name,
    recommendedStrategy,
    recommendedStrategyDescriptions,
    t,
  ]);

  const handleEditStrategy = React.useCallback(() => {
    if (showEditImportStrategy) {
      setValues(recommendedValues.current);
    } else {
      recommendedValues.current = values;
    }
    setFieldValue('import.showEditImportStrategy', !showEditImportStrategy);
  }, [setFieldValue, setValues, showEditImportStrategy, values]);

  return (
    <>
      <FormSection>
        <Alert isInline variant={alertInfo.variant} title={alertInfo.title}>
          {alertInfo.description}
        </Alert>
        {recommendedStrategy && (
          <Split>
            <SplitItem isFilled />
            <SplitItem>
              <Button
                variant={ButtonVariant.link}
                className="odc-import-strategy-section__edit-strategy-button"
                onClick={handleEditStrategy}
                icon={!showEditImportStrategy ? <PencilAltIcon /> : <UndoIcon />}
              >
                {!showEditImportStrategy
                  ? t('devconsole~Edit Import Strategy')
                  : t('devconsole~Revert to recommended')}
              </Button>
            </SplitItem>
          </Split>
        )}
      </FormSection>
      <div className={recommendedStrategy ? 'odc-import-strategy-section__strategy-selector' : ''}>
        {showEditImportStrategy && (
          <>
            <FormSection>
              <ImportStrategySelector />
            </FormSection>
            <br />
          </>
        )}
        {strategySections[selectedStrategy.type]}
      </div>
    </>
  );
};

export default ImportStrategySection;
