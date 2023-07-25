import * as React from 'react';
import { Alert, ExpandableSection, Tooltip } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ReadableResourcesNames } from '@console/dev-console/src/components/import/import-types';
import { NormalizedBuilderImages } from '@console/dev-console/src/utils/imagestream-utils';
import { getGitService } from '@console/git-service/src';
import { LoadingInline } from '@console/internal/components/utils';
import { k8sList } from '@console/internal/module/k8s';
import {
  FLAG_OPENSHIFT_PIPELINE_AS_CODE,
  FUNC_PIPELINE_RUNTIME_LABEL,
} from '@console/pipelines-plugin/src/const';
import {
  BlueInfoCircleIcon,
  CheckboxField,
  DropdownField,
  RadioGroupField,
  useFlag,
} from '@console/shared';
import { CLUSTER_PIPELINE_NS, PIPELINE_RUNTIME_LABEL } from '../../../const';
import { PipelineModel } from '../../../models';
import { PipelineKind } from '../../../types';
import PipelineVisualization from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';
import { PipelineType } from '../import-types';
import PacSection from './PacSection';
import './PacSection.scss';

const labelType = 'pipeline.openshift.io/type';
const labelDocker = 'pipeline.openshift.io/strategy';

const getAlertText = (
  isDockerStrategy: boolean,
  builderImage: string,
  resourceType: string,
): string => {
  const MISSING_DOCKERFILE_LABEL_TEXT = i18next.t(
    'pipelines-plugin~The pipeline template for Dockerfiles is not available at this time.',
  );
  if (isDockerStrategy) return MISSING_DOCKERFILE_LABEL_TEXT;

  return i18next.t(
    'pipelines-plugin~There are no pipeline templates available for {{builderImage}} and {{resourceType}} combination.',
    { builderImage, resourceType },
  );
};

type PipelineTemplateProps = {
  builderImages: NormalizedBuilderImages;
  existingPipeline?: PipelineKind;
};

const PipelineTemplate: React.FC<PipelineTemplateProps> = ({ builderImages, existingPipeline }) => {
  const { t } = useTranslation();
  const [noTemplateForRuntime, setNoTemplateForRuntime] = React.useState(false);
  const [isPacRepo, setIsPacRepo] = React.useState(false);
  const [isPipelineTypeChanged, setIsPipelineTypeChanged] = React.useState(false);
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [pipelineTemplates, setPipelineTemplates] = React.useState([]);
  const pipelineStorageRef = React.useRef<{ [image: string]: PipelineKind[] }>({});
  const isRepositoryEnabled = useFlag(FLAG_OPENSHIFT_PIPELINE_AS_CODE);

  const {
    values: {
      import: { recommendedStrategy, selectedStrategy },
      git: { url, type, ref, dir, secretResource },
      pipeline,
      image,
      build,
      resources,
    },
    setFieldValue,
    setFieldTouched,
  } = useFormikContext<FormikValues>();

  const isDockerStrategy = build.strategy === 'Docker';
  const isPipelineAttached = !_.isEmpty(existingPipeline);
  const isServerlessFunctionStrategy = build.strategy === 'ServerlessFunction';

  const getPipelineNames = (pipelines: PipelineKind[]): string =>
    pipelines
      .map((pl) => pl.metadata?.name)
      .sort()
      .join(',');

  const handlePipelineTypeChange = React.useCallback(async () => {
    const gitService = url && getGitService(url, type, ref, dir, secretResource);
    const isPacRepository =
      gitService && isRepositoryEnabled && (await gitService.isTektonFolderPresent());
    if (isPacRepository) {
      setIsPacRepo(true);
      setFieldValue('pipeline.enabled', true);
      setFieldValue('pipeline.type', PipelineType.PAC);
      setFieldValue('pac.repository.gitUrl', url);
      setFieldValue('pac.pipelineType', PipelineType.PAC);
      setFieldValue('pac.pipelineEnabled', true);
    } else {
      setFieldValue('pipeline.enabled', false);
      setFieldValue('pipeline.type', PipelineType.PIPELINE);
      setFieldValue('pac.repository.gitUrl', '');
      setFieldValue('pac.pipelineType', PipelineType.PIPELINE);
      setFieldValue('pac.pipelineEnabled', false);
    }
    setIsPipelineTypeChanged(true);
  }, [url, type, ref, dir, secretResource, isRepositoryEnabled, setFieldValue]);

  React.useEffect(() => {
    pipelineStorageRef.current = {};
  }, [selectedStrategy]);

  React.useEffect(() => {
    setFieldValue('pac.pipelineEnabled', !!pipeline.enabled);
    // Added setTimeout to re-validate yup validation after onchange event
    setTimeout(() => {
      setFieldTouched('pipeline.enabled', true);
    }, 0);
  }, [pipeline.enabled, setFieldValue, setFieldTouched]);

  React.useEffect(() => {
    let ignore = false;

    const builderPipelineLabel = { [PIPELINE_RUNTIME_LABEL]: image.selected };
    const dockerPipelineLabel = { [labelDocker]: 'docker' };
    const funcPipelineLabel = { [FUNC_PIPELINE_RUNTIME_LABEL]: image.selected };

    let labelSelector;
    if (isDockerStrategy) {
      labelSelector = dockerPipelineLabel;
    } else if (isServerlessFunctionStrategy) {
      labelSelector = funcPipelineLabel;
    } else {
      labelSelector = builderPipelineLabel;
    }
    const fetchPipelineTemplate = async () => {
      let fetchedPipelines: PipelineKind[] = null;
      if (
        !pipelineStorageRef.current[image.selected] ||
        !pipelineStorageRef.current[image.selected]?.length
      ) {
        fetchedPipelines = (await k8sList(PipelineModel, {
          ns: CLUSTER_PIPELINE_NS,
          labelSelector,
        })) as PipelineKind[];
      }
      if (ignore) return;

      if (fetchedPipelines) {
        pipelineStorageRef.current[image.selected] = fetchedPipelines;
      }

      const imagePipelines: PipelineKind[] = pipelineStorageRef.current[image.selected] || [];
      const resourceSpecificPipelines = imagePipelines.filter(
        (pl) => pl.metadata?.labels?.[labelType] === resources,
      );
      const candidatePipelines = [
        ...resourceSpecificPipelines,
        ...imagePipelines.filter((pl) => !pl.metadata?.labels?.[labelType]),
      ];

      if (getPipelineNames(pipelineTemplates) !== getPipelineNames(candidatePipelines)) {
        setPipelineTemplates(candidatePipelines);
      }
      const pipelineTemplate = candidatePipelines[0];

      if (isPipelineAttached) {
        setFieldValue('pipeline.template', existingPipeline);
        setFieldValue('pipeline.templateSelected', existingPipeline.metadata.name);
        setNoTemplateForRuntime(false);
      } else if (
        pipeline.templateSelected &&
        pipelineTemplates.some((pl) => pl.metadata.name === pipeline.templateSelected)
      ) {
        setFieldValue(
          'pipeline.template',
          pipelineTemplates.find((pl) => pl.metadata.name === pipeline.templateSelected),
        );
        setNoTemplateForRuntime(false);
      } else if (pipelineTemplate) {
        setFieldValue('pipeline.template', pipelineTemplate);
        setFieldValue('pipeline.templateSelected', pipelineTemplate.metadata.name);
        setNoTemplateForRuntime(false);
      } else {
        setFieldValue('pipeline.template', null);
        setFieldValue('pipeline.templateSelected', '');
        setFieldValue('pipeline.enabled', false);
        setNoTemplateForRuntime(true);
      }
    };

    fetchPipelineTemplate();
    if (!isPipelineAttached && !isPipelineTypeChanged) {
      handlePipelineTypeChange();
    }
    return () => {
      ignore = true;
    };
  }, [
    resources,
    recommendedStrategy,
    image.selected,
    isDockerStrategy,
    setFieldValue,
    pipeline.templateSelected,
    pipelineTemplates,
    isPipelineAttached,
    existingPipeline,
    handlePipelineTypeChange,
    isServerlessFunctionStrategy,
    isPipelineTypeChanged,
  ]);

  const pipelineTemplateItems = React.useMemo(() => {
    const items = {};
    for (const img of pipelineTemplates) {
      const { name } = img.metadata;
      items[name] = name;
    }
    if (pipeline.templateSelected) {
      items[pipeline.templateSelected] = pipeline.templateSelected;
    }
    return items;
  }, [pipeline.templateSelected, pipelineTemplates]);

  if (noTemplateForRuntime) {
    const builderImageTitle =
      builderImages?.[image.selected]?.title || t('pipelines-plugin~this Builder Image');
    const resourceName = t(ReadableResourcesNames[resources]);
    return (
      <Alert
        isInline
        variant="info"
        title={getAlertText(isDockerStrategy, builderImageTitle, resourceName)}
      />
    );
  }

  const onChangePipelineType = (value: PipelineType) => {
    setFieldValue('pac.pipelineType', value);
    setFieldValue('pipeline.type', value);
    // Added setTimeout to re-validate yup validation after onchange event
    setTimeout(() => {
      setFieldTouched('pipeline.type', true);
    }, 0);
  };

  return pipeline.template ? (
    <>
      <CheckboxField
        label={t('pipelines-plugin~Add pipeline')}
        name="pipeline.enabled"
        isDisabled={isPipelineAttached}
      />
      {pipeline.enabled && isPacRepo && (
        <RadioGroupField
          className="odc-pipeline-section-pac__radio-intent"
          name={'pipeline.type'}
          onChange={(val: string) => onChangePipelineType(val as PipelineType)}
          options={[
            {
              value: PipelineType.PAC,
              label: (
                <>
                  {t('pipelines-plugin~Build, deploy and configure a Pipeline Repository')}
                  {'  '}
                  <Tooltip
                    position="right"
                    content={
                      <p>
                        {t(
                          'pipelines-plugin~Automatically configure a new Pipeline Repository for your Git repository. This will automatically trigger new PipelineRuns on new commits or Pull Requests based on your configuration in your source code.',
                        )}
                      </p>
                    }
                  >
                    <BlueInfoCircleIcon />
                  </Tooltip>
                </>
              ),
              activeChildren: <PacSection />,
            },
            {
              value: PipelineType.PIPELINE,
              label: (
                <>
                  {t('pipelines-plugin~Use Pipeline from this cluster')}
                  {'  '}
                  <Tooltip
                    position="right"
                    content={
                      <p>
                        {t(
                          'pipelines-plugin~Use an installed Pipeline from your cluster to build and deploy your component. Pipelines are from "openshift" namespace that support the relevant runtime are shown below.',
                        )}
                      </p>
                    }
                  >
                    <BlueInfoCircleIcon />
                  </Tooltip>
                </>
              ),
              activeChildren: (
                <>
                  <DropdownField
                    name="pipeline.templateSelected"
                    title={pipelineTemplateItems[pipeline.templateSelected]}
                    items={pipelineTemplateItems}
                    disabled={isPipelineAttached}
                    fullWidth
                  />
                  <br />
                  <ExpandableSection
                    toggleText={`${
                      isExpanded ? t('pipelines-plugin~Hide') : t('pipelines-plugin~Show')
                    } ${t('pipelines-plugin~pipeline visualization')}`}
                    isExpanded={isExpanded}
                    onToggle={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded && <PipelineVisualization pipeline={pipeline.template} />}
                  </ExpandableSection>
                </>
              ),
            },
          ]}
        />
      )}
      {pipeline.enabled && !isPacRepo && (
        <>
          <DropdownField
            name="pipeline.templateSelected"
            title={pipelineTemplateItems[pipeline.templateSelected]}
            items={pipelineTemplateItems}
            disabled={isPipelineAttached}
            fullWidth
          />
          <ExpandableSection
            toggleText={`${
              isExpanded ? t('pipelines-plugin~Hide') : t('pipelines-plugin~Show')
            } ${t('pipelines-plugin~pipeline visualization')}`}
            isExpanded={isExpanded}
            onToggle={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded && <PipelineVisualization pipeline={pipeline.template} />}
          </ExpandableSection>
        </>
      )}
    </>
  ) : (
    <LoadingInline />
  );
};

export default PipelineTemplate;
