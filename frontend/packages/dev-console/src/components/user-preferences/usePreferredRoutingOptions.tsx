import { Dispatch, SetStateAction } from 'react';
import { useUserSettings } from '@console/shared';

const PREFERRED_SECURE_ROUTING_OPTIONS_USER_SETTING_KEY = 'devconsole.import.secureRoutingOptions';

type RoutingOptions = {
  secure: boolean;
  tlsTermination?: string;
  insecureTraffic?: string;
};

export const usePreferredRoutingOptions = (): [
  RoutingOptions,
  Dispatch<SetStateAction<RoutingOptions>>,
  boolean,
] => {
  const [
    preferredRoutingOptions,
    setPreferredRoutingOptions,
    preferredRoutingOptionsLoaded,
  ] = useUserSettings<RoutingOptions>(PREFERRED_SECURE_ROUTING_OPTIONS_USER_SETTING_KEY, {
    secure: true,
    tlsTermination: 'edge',
    insecureTraffic: 'Redirect',
  });
  return [preferredRoutingOptions, setPreferredRoutingOptions, preferredRoutingOptionsLoaded];
};
