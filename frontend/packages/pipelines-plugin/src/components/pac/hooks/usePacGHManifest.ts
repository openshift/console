import * as React from 'react';
import { PAC_GH_APP_NAME } from '../const';
import { getControllerUrl } from '../pac-utils';

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
        const controllerUrl = await getControllerUrl();
        setElRoute(controllerUrl);
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
