import * as React from 'react';
import Helmet from 'react-helmet';
import { useTranslation } from 'react-i18next';
import { RouteComponentProps } from 'react-router';
import NamespacedPage, { NamespacedPageVariants } from '../../NamespacedPage';
import {
  useK8sWatchResources,
  WatchK8sResults,
} from '@console/internal/components/utils/k8s-watch-hook';
import { K8sResourceKind } from '@console/internal/module/k8s';
import { ProjectModel } from '@console/internal/models';
import { LoadingBox, PageHeading } from '@console/internal/components/utils';

export type UploadJarPageProps = RouteComponentProps<{ ns?: string }>;

type watchResource = {
  [key: string]: K8sResourceKind[];
};

const UploadJarPage: React.FunctionComponent<UploadJarPageProps> = ({ match }) => {
  const { t } = useTranslation();
  const namespace = match.params.ns;
  const resources: WatchK8sResults<watchResource> = useK8sWatchResources<watchResource>({
    projects: {
      kind: ProjectModel.kind,
      isList: true,
    },
  });

  const isResourceLoaded = () => {
    const resKeys = Object.keys(resources);
    if (
      resKeys.length > 0 &&
      resKeys.every((key) => resources[key].loaded || !resources[key].loadError)
    ) {
      return true;
    }
    return false;
  };

  return (
    <NamespacedPage disabled variant={NamespacedPageVariants.light}>
      <Helmet>
        <title>{t('devconsole~Upload a JAR file')}</title>
      </Helmet>
      <PageHeading title={t('devconsole~Upload a JAR file')} />
      <div className="co-m-pane__body" style={{ paddingBottom: 0 }}>
        {isResourceLoaded() ? <h1>Am in form upload {namespace}</h1> : <LoadingBox />}
      </div>
    </NamespacedPage>
  );
};

export default UploadJarPage;
