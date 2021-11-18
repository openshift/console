import * as React from 'react';
import { Alert, ExpandableSection } from '@patternfly/react-core';
import { useFormikContext, FormikValues } from 'formik';
import i18next from 'i18next';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { ReadableResourcesNames } from '@console/dev-console/src/components/import/import-types';
import { NormalizedBuilderImages } from '@console/dev-console/src/utils/imagestream-utils';
import { LoadingInline } from '@console/internal/components/utils';
import { k8sList } from '@console/internal/module/k8s';
import { CheckboxField, DropdownField } from '@console/shared';
import { CLUSTER_PIPELINE_NS, PIPELINE_RUNTIME_LABEL } from '../../../const';
import { PipelineModel } from '../../../models';
import { PipelineKind } from '../../../types';
import PipelineVisualization from '../../pipelines/detail-page-tabs/pipeline-details/PipelineVisualization';

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
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [pipelineTemplates, setPipelineTemplates] = React.useState([]);
  const pipelineStorageRef = React.useRef<{ [image: string]: PipelineKind[] }>({});

  const {
    values: { pipeline, image, build, resources },
    setFieldValue,
  } = useFormikContext<FormikValues>();

  const isDockerStrategy = build.strategy === 'Docker';
  const isPipelineAttached = !_.isEmpty(existingPipeline);

  const getPipelineNames = (pipelines: PipelineKind[]): string =>
    pipelines
      .map((pl) => pl.metadata?.name)
      .sort()
      .join(',');

  React.useEffect(() => {
    let ignore = false;

    const builderPipelineLabel = { [PIPELINE_RUNTIME_LABEL]: image.selected };
    const dockerPipelineLabel = { [labelDocker]: 'docker' };

    const labelSelector = isDockerStrategy ? dockerPipelineLabel : builderPipelineLabel;

    const fetchPipelineTemplate = async () => {
      let fetchedPipelines: PipelineKind[] = null;
      if (!pipelineStorageRef.current[image.selected]) {
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
        setNoTemplateForRuntime(true);
      }
    };

    fetchPipelineTemplate();

    return () => {
      ignore = true;
    };
  }, [
    resources,
    image.selected,
    isDockerStrategy,
    setFieldValue,
    pipeline.templateSelected,
    pipelineTemplates,
    isPipelineAttached,
    existingPipeline,
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

  return pipeline.template ? (
    <>
      <CheckboxField
        label={t('pipelines-plugin~Add pipeline')}
        name="pipeline.enabled"
        isDisabled={isPipelineAttached}
      />
      {pipeline.enabled && (
        <DropdownField
          name="pipeline.templateSelected"
          title={pipelineTemplateItems[pipeline.templateSelected]}
          items={pipelineTemplateItems}
          disabled={isPipelineAttached}
          fullWidth
        />
      )}
      <ExpandableSection
        toggleText={`${isExpanded ? t('pipelines-plugin~Hide') : t('pipelines-plugin~Show')} ${t(
          'pipelines-plugin~pipeline visualization',
        )}`}
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded && <PipelineVisualization pipeline={pipeline.template} />}
      </ExpandableSection>
    </>
  ) : (
    <LoadingInline />
  );
};

export default PipelineTemplate;
