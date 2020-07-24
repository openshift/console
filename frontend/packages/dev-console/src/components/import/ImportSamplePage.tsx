import * as React from 'react';
import Helmet from 'react-helmet';
import { RouteComponentProps } from 'react-router';
import { Formik } from 'formik';
import { K8sResourceKind } from '@console/internal/module/k8s';
import {
  FirehoseResource,
  LoadingBox,
  history,
  PageHeading,
} from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import { useK8sWatchResource } from '@console/internal/components/utils/k8s-watch-hook';
import {
  normalizeBuilderImages,
  NormalizedBuilderImages,
  getSampleRepo,
  getSampleRef,
  getSampleContextDir,
} from '../../utils/imagestream-utils';
import { healthChecksProbeInitialData } from '../health-checks/health-checks-probe-utils';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import { detectGitType, validationSchema } from './import-validation-utils';
import { createOrUpdateResources } from './import-submit-utils';
import { GitImportFormData, Resources } from './import-types';
import ImportSampleForm from './ImportSampleForm';

type ImportSamplePageProps = RouteComponentProps<{ ns?: string; is?: string; isNs?: string }>;

const ImportSamplePage: React.FC<ImportSamplePageProps> = ({ match }) => {
  const { ns: namespace, is: imageStreamName, isNs: imageStreamNamespace } = match.params;
  const defaultApplicationGroup = 'sample-app';

  const imageStreamResource: FirehoseResource = React.useMemo(
    () => ({
      kind: ImageStreamModel.kind,
      prop: 'imageStreams',
      isList: false,
      name: imageStreamName,
      namespace: imageStreamNamespace,
    }),
    [imageStreamName, imageStreamNamespace],
  );

  const [imageStream, imageStreamloaded] = useK8sWatchResource(imageStreamResource);

  if (!imageStreamloaded) return <LoadingBox />;

  const { [imageStreamName]: builderImage }: NormalizedBuilderImages = normalizeBuilderImages(
    imageStream,
  );

  const { name: imageName, recentTag: tag } = builderImage;

  const gitUrl = getSampleRepo(tag);
  const gitRef = getSampleRef(tag);
  const gitDir = getSampleContextDir(tag);
  const gitType = detectGitType(gitUrl);

  const initialValues: GitImportFormData = {
    name: `${imageName}-sample`,
    project: {
      name: namespace || '',
      displayName: '',
      description: '',
    },
    application: {
      initial: defaultApplicationGroup,
      name: defaultApplicationGroup,
      selectedKey: defaultApplicationGroup,
    },
    git: {
      url: gitUrl,
      type: gitType,
      ref: gitRef,
      dir: gitDir,
      showGitType: false,
      secret: '',
      isUrlValidating: false,
    },
    docker: {
      dockerfilePath: 'Dockerfile',
      containerPort: 8080,
    },
    image: {
      selected: imageName,
      recommended: '',
      tag: tag.name,
      tagObj: tag,
      ports: [],
      isRecommending: false,
      couldNotRecommend: false,
    },
    route: {
      disable: false,
      create: true,
      targetPort: '',
      path: '',
      hostname: '',
      secure: false,
      tls: {
        termination: '',
        insecureEdgeTerminationPolicy: '',
        caCertificate: '',
        certificate: '',
        destinationCACertificate: '',
        privateKey: '',
      },
    },
    resources: Resources.Kubernetes,
    serverless: {
      scaling: {
        minpods: 0,
        maxpods: '',
        concurrencytarget: '',
        concurrencylimit: '',
      },
    },
    pipeline: {
      enabled: false,
    },
    build: {
      env: [],
      triggers: {
        webhook: true,
        image: true,
        config: true,
      },
      strategy: 'Source',
    },
    deployment: {
      env: [],
      triggers: {
        image: true,
        config: true,
      },
      replicas: 1,
    },
    labels: {},
    limits: {
      cpu: {
        request: '',
        requestUnit: 'm',
        defaultRequestUnit: 'm',
        limit: '',
        limitUnit: 'm',
        defaultLimitUnit: 'm',
      },
      memory: {
        request: '',
        requestUnit: 'Mi',
        defaultRequestUnit: 'Mi',
        limit: '',
        limitUnit: 'Mi',
        defaultLimitUnit: 'Mi',
      },
    },
    healthChecks: healthChecksProbeInitialData,
  };

  const handleSubmit = (values, actions) => {
    const resourceActions = createOrUpdateResources(
      values,
      imageStream as K8sResourceKind,
      false,
      true,
    ).then(() => createOrUpdateResources(values, imageStream as K8sResourceKind));

    resourceActions
      .then(() => {
        actions.setSubmitting(false);
        history.push(`/topology/ns/${namespace}`);
      })
      .catch((err) => {
        actions.setSubmitting(false);
        actions.setStatus({ submitError: err.message });
      });
  };

  return (
    <NamespacedPage variant={NamespacedPageVariants.light} disabled hideApplications>
      <Helmet>
        <title>Create Sample Application</title>
      </Helmet>
      <PageHeading title="Create Sample Application" />
      <div className="co-m-pane__body" style={{ marginTop: 0, paddingBottom: 0 }}>
        <Formik
          initialValues={initialValues}
          onSubmit={handleSubmit}
          onReset={history.goBack}
          validationSchema={validationSchema}
        >
          {(formikProps) => <ImportSampleForm {...formikProps} builderImage={builderImage} />}
        </Formik>
      </div>
    </NamespacedPage>
  );
};

export default ImportSamplePage;
