import type { FC } from 'react';
import { ValidatedOptions, AlertVariant } from '@patternfly/react-core';
import { Formik, FormikProps } from 'formik';
import * as _ from 'lodash';
import { useTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { useActivePerspective } from '@console/dynamic-plugin-sdk';
import { GitProvider, ImportStrategy } from '@console/git-service/src';
import { history, AsyncComponent, StatusBox } from '@console/internal/components/utils';
import { RouteModel } from '@console/internal/models';
import { RouteKind, K8sResourceKind } from '@console/internal/module/k8s';
import { getActiveApplication } from '@console/internal/reducers/ui';
import { RootState } from '@console/internal/redux';
import { ALL_APPLICATIONS_KEY, usePerspectives, useTelemetry } from '@console/shared';
import { useToast } from '@console/shared/src/components/toast';
import { useResourceConnectionHandler } from '@console/shared/src/hooks/useResourceConnectionHandler';
import { startBuild as startShipwrightBuild } from '@console/shipwright-plugin/src/api';
import { BuildModel as ShipwrightBuildModel } from '@console/shipwright-plugin/src/models';
import {
  Build as ShipwrightBuildKind,
  ClusterBuildStrategy as ShipwrightClusterBuildStrategy,
} from '@console/shipwright-plugin/src/types';
import { UNASSIGNED_KEY } from '@console/topology/src/const';
import { sanitizeApplicationValue } from '@console/topology/src/utils/application-utils';
import { NormalizedBuilderImages, normalizeBuilderImages } from '../../utils/imagestream-utils';
import { PipelineType } from '../pipeline-section/import-types';
import { usePacInfo } from '../pipeline-section/pipeline/pac-hook';
import {
  createRemoteWebhook,
  defaultRepositoryFormValues,
} from '../pipeline-section/pipeline/utils';
import { getBaseInitialValues } from './form-initial-values';
import {
  createOrUpdateResources,
  filterDeployedResources,
  getTelemetryImport,
  handleRedirect,
} from './import-submit-utils';
import {
  GitImportFormData,
  ImportData,
  Resources,
  BaseFormData,
  ImportTypes,
  BuildOptions,
} from './import-types';
import { validationSchema } from './import-validation-utils';
import { useDefaultBuildOption } from './section/useDefaultBuildOption';
import { useUpdateKnScalingDefaultValues } from './serverless/useUpdateKnScalingDefaultValues';
import ImportToastContent from './toast/ImportToastContent';
import WebhookToastContent from './toast/WebhookToastContent';

export interface ImportFormProps {
  namespace: string;
  importData: ImportData;
  contextualSource?: string;
  imageStreams?: {
    data: K8sResourceKind | K8sResourceKind[];
    loaded: boolean;
    loadError?: any;
  };
  projects?: {
    data: K8sResourceKind[];
    loaded: boolean;
    loadError?: any;
  };
}

export interface StateProps {
  activeApplication: string;
}

const ImportForm: FC<ImportFormProps & StateProps> = ({
  namespace,
  imageStreams,
  importData,
  contextualSource,
  activeApplication,
  projects,
}) => {
  const { t } = useTranslation();
  const fireTelemetryEvent = useTelemetry();
  const [perspective] = useActivePerspective();
  const perspectiveExtensions = usePerspectives();
  const postFormCallback = useResourceConnectionHandler();
  const toastContext = useToast();
  const [pac, loaded] = usePacInfo();
  const defaultBuildOption = useDefaultBuildOption();

  const initialBaseValues: BaseFormData = getBaseInitialValues(namespace, activeApplication);
  const initialValues: GitImportFormData = {
    ...initialBaseValues,
    application: {
      ...initialBaseValues.application,
      selectedKey:
        activeApplication === t('devconsole~No application group')
          ? UNASSIGNED_KEY
          : activeApplication,
      isInContext: !!sanitizeApplicationValue(activeApplication),
    },
    resourceTypesNotValid: contextualSource ? [Resources.KnativeService] : [],
    pipeline: {
      enabled: false,
      type: PipelineType.PIPELINE,
    },
    git: {
      url: '',
      type: GitProvider.INVALID,
      ref: '',
      dir: '/',
      showGitType: false,
      secret: '',
      isUrlValidating: false,
      validated: ValidatedOptions.default,
    },
    docker: {
      dockerfilePath: '',
      dockerfileHasError: true,
    },
    devfile: {
      devfilePath: '',
      devfileHasError: false,
    },
    pac: {
      pacHasError: false,
      repository: {
        ...defaultRepositoryFormValues,
      },
    },
    build: {
      ...initialBaseValues.build,
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
      strategy: importData.buildStrategy || 'Devfile',
      option: defaultBuildOption,
      clusterBuildStrategy: ShipwrightClusterBuildStrategy.UNKNOWN,
    },
    import: {
      loaded: false,
      knativeFuncLoaded: false,
      loadError: null,
      strategies: [],
      selectedStrategy: {
        name: 'Builder Image',
        type: ImportStrategy.S2I,
        priority: 0,
        detectedFiles: [],
      },
      recommendedStrategy: null,
      showEditImportStrategy: importData.type !== ImportTypes.git,
      strategyChanged: false,
    },
  };

  const initialVals = useUpdateKnScalingDefaultValues(initialValues);
  const builderImages: NormalizedBuilderImages =
    imageStreams &&
    imageStreams.loaded &&
    normalizeBuilderImages(
      Array.isArray(imageStreams.data) ? imageStreams.data : [imageStreams.data],
    );

  const handleSubmit = (values: GitImportFormData, actions) => {
    const imageStream = builderImages && builderImages[values.image.selected]?.obj;
    const createNewProject = projects.loaded && _.isEmpty(projects.data);
    const {
      build: { option: buildOption },
      project: { name: projectName },
      pipeline: { enabled: pipelineEnabled, type: pipelineType },
      pac: { repository },
    } = values;

    const resourceActions = createOrUpdateResources(
      t,
      values,
      imageStream,
      createNewProject,
      true,
    ).then(() => createOrUpdateResources(t, values, imageStream));

    resourceActions
      .then((resources) => {
        postFormCallback(resources);
      })
      .catch(() => {});

    return resourceActions
      .then(async (resources) => {
        if (pipelineEnabled && pipelineType === PipelineType.PAC) {
          const isWebHookAttached = await createRemoteWebhook(repository, pac, loaded);
          toastContext.addToast({
            variant: isWebHookAttached ? AlertVariant.success : AlertVariant.danger,
            title: isWebHookAttached
              ? t('devconsole~Webhook attached to the Git Repository')
              : t('devconsole~Could not attach webhook to the Git Repository'),
            content: !isWebHookAttached ? (
              <WebhookToastContent
                repositoryName={repository.name}
                git={values.git}
                projectName={projectName}
              />
            ) : null,
            timeout: true,
            dismissible: true,
          });
        }

        const deployedResources = filterDeployedResources(resources);

        const redirectSearchParams = new URLSearchParams();

        /* NOTE: This will be automated once Shipwright Triggers is GA */
        if (buildOption === BuildOptions.SHIPWRIGHT_BUILD) {
          const shipwrightBuild = resources?.find(
            (resource) => resource.kind === ShipwrightBuildModel.kind,
          ) as ShipwrightBuildKind;
          try {
            await startShipwrightBuild(shipwrightBuild);
          } catch (err) {
            toastContext.addToast({
              variant: AlertVariant.danger,
              title: t('devconsole~Build failed'),
              content: err.message,
              timeout: true,
              dismissible: true,
            });
          }
        }

        const route = resources.find((resource) => resource.kind === RouteModel.kind) as RouteKind;
        if (deployedResources.length > 0) {
          toastContext.addToast({
            variant: AlertVariant.info,
            title:
              deployedResources.length > 1
                ? t('devconsole~Resources added')
                : t('devconsole~Resource added'),
            content: <ImportToastContent deployedResources={deployedResources} route={route} />,
            timeout: true,
            dismissible: true,
          });

          if (typeof deployedResources[0].metadata.uid === 'string') {
            redirectSearchParams.set('selectId', deployedResources[0].metadata.uid);
          }
        }

        fireTelemetryEvent('Git Import', getTelemetryImport(values));

        handleRedirect(projectName, perspective, perspectiveExtensions, redirectSearchParams);
      })
      .catch((err) => {
        // eslint-disable-next-line no-console
        console.warn('Error while submitting import form:', err);
        actions.setStatus({ submitError: err.message });
      });
  };

  const renderForm = (formikProps: FormikProps<any>) => {
    return (
      <AsyncComponent
        {...formikProps}
        projects={projects}
        builderImages={builderImages}
        loader={importData.loader}
      />
    );
  };

  return (
    <StatusBox
      data={imageStreams?.data}
      loaded={imageStreams?.loaded}
      loadError={imageStreams?.loadError}
    >
      <Formik
        initialValues={initialVals}
        onSubmit={handleSubmit}
        onReset={history.goBack}
        validationSchema={validationSchema(t)}
      >
        {renderForm}
      </Formik>
    </StatusBox>
  );
};

type OwnProps = ImportFormProps & { forApplication?: string };
const mapStateToProps = (state: RootState, ownProps: OwnProps): StateProps => {
  const activeApplication = ownProps.forApplication || getActiveApplication(state);
  return {
    activeApplication: activeApplication !== ALL_APPLICATIONS_KEY ? activeApplication : '',
  };
};

export default connect(mapStateToProps)(ImportForm);
