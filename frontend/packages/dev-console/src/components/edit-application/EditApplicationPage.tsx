import * as React from 'react';
import { useTranslation } from 'react-i18next';
import { Firehose, FirehoseResource, LoadingBox } from '@console/internal/components/utils';
import { ImageStreamModel } from '@console/internal/models';
import { RouteComponentProps } from 'react-router-dom';
import { Helmet } from 'react-helmet';
import { ServiceModel } from '@console/knative-plugin';
import { referenceForModel } from '@console/internal/module/k8s';
import { PipelineModel } from '@console/pipelines-plugin/src/models';
import NamespacedPage, { NamespacedPageVariants } from '../NamespacedPage';
import EditApplication from './EditApplication';
import { EditApplicationProps } from './edit-application-types';

const INSTANCE_LABEL = 'app.kubernetes.io/instance';
const EditApplicationComponentLoader: React.FunctionComponent<EditApplicationProps> = (
  props: EditApplicationProps,
) => {
  const { loaded } = props;
  return loaded ? <EditApplication {...props} /> : <LoadingBox />;
};

export type ImportPageProps = RouteComponentProps<{ ns?: string }>;

const EditApplicationPage: React.FunctionComponent<ImportPageProps> = ({ match, location }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const queryParams = new URLSearchParams(location.search);
  const editAppResourceKind = queryParams.get('kind');
  const appName = queryParams.get('name');
  const appResources: FirehoseResource[] = [
    {
      kind: 'Service',
      prop: 'service',
      name: appName,
      namespace,
      optional: true,
    },
    {
      kind: 'BuildConfig',
      prop: 'buildConfig',
      name: appName,
      namespace,
      optional: true,
    },
    {
      kind: referenceForModel(PipelineModel),
      prop: PipelineModel.id,
      name: appName,
      namespace,
      optional: true,
    },
    {
      kind: 'Route',
      prop: 'route',
      name: appName,
      namespace,
      optional: true,
    },
    {
      kind: 'ImageStream',
      prop: 'imageStream',
      isList: true,
      namespace,
      selector: {
        matchLabels: { [INSTANCE_LABEL]: appName },
      },
      optional: true,
    },
    {
      kind: ImageStreamModel.kind,
      prop: 'imageStreams',
      isList: true,
      namespace: 'openshift',
      optional: true,
    },
  ];
  let kind = editAppResourceKind;
  if (kind === ServiceModel.kind) {
    kind = referenceForModel(ServiceModel);
  }
  appResources.push({
    kind,
    prop: 'editAppResource',
    name: appName,
    namespace,
    optional: true,
  });

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('devconsole~Edit')}</title>
      </Helmet>
      <Firehose resources={appResources}>
        <EditApplicationComponentLoader namespace={namespace} appName={appName} />
      </Firehose>
    </NamespacedPage>
  );
};

export default EditApplicationPage;
