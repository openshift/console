import * as React from 'react';
import { k8sListResourceItems } from '@console/dynamic-plugin-sdk/src/utils/k8s';
import { RouteModel } from '@console/internal/models';
import { RouteKind } from '@console/internal/module/k8s';
import { PIPELINE_NAMESPACE } from '../../pipelines/const';
import { EVENT_LISTNER_NAME, PAC_GH_APP_NAME } from '../const';

type GHManifestData = {
  name: string;
  url: string;
  redirect_url: string;
  callback_urls: string[];
  hook_attributes: { url: string };
  public: boolean;
  default_permissions: { [key: string]: string };
  default_events: string[];
};

export const usePacGHManifest = (): { loaded: boolean; manifestData: GHManifestData } => {
  const [elRoute, setElRoute] = React.useState<string>();
  const [loaded, setLoded] = React.useState<boolean>(false);
  const locURL = window.location.href;

  React.useEffect(() => {
    const getELRoute = async () => {
      try {
        const [elRouteData] = await k8sListResourceItems<RouteKind>({
          model: RouteModel,
          queryParams: {
            ns: PIPELINE_NAMESPACE,
            labelSelector: {
              matchLabels: {
                eventlistener: EVENT_LISTNER_NAME,
              },
            },
          },
        });
        setElRoute(elRouteData?.spec?.host && `https://${elRouteData.spec.host}`);
        setLoded(true);
      } catch (err) {
        setLoded(true);
        // eslint-disable-next-line no-console
        console.log(err.message);
      }
    };
    getELRoute();
  }, []);

  const manifestData: GHManifestData = {
    name: PAC_GH_APP_NAME,
    url: locURL,
    // eslint-disable-next-line @typescript-eslint/camelcase
    hook_attributes: {
      url: elRoute || '',
    },
    // eslint-disable-next-line @typescript-eslint/camelcase
    redirect_url: locURL,
    // eslint-disable-next-line @typescript-eslint/camelcase
    callback_urls: [locURL],
    public: true,
    // eslint-disable-next-line @typescript-eslint/camelcase
    default_permissions: {
      issues: 'write',
      checks: 'write',
    },
    // eslint-disable-next-line @typescript-eslint/camelcase
    default_events: ['issues', 'issue_comment', 'check_suite', 'check_run'],
  };

  return { loaded, manifestData };
};
