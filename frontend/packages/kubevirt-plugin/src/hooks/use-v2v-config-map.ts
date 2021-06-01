import * as React from 'react';
// eslint-disable-next-line @typescript-eslint/ban-ts-ignore
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useDispatch } from 'react-redux';

import { getVmwareConfigMap } from '../k8s/requests/v2v/v2vvmware-configmap';
import {
  v2vConfigMapActions,
  v2vConfigMapActionsNames,
} from '../redux/actions/v2v-config-map-actions';

const useV2VConfigMap = () => {
  const dispatch = useDispatch();
  const [data, setData] = React.useState<any>();
  const [loaded, setLoaded] = React.useState<boolean>(false);
  const [error, setError] = React.useState<any>();

  const getData = React.useCallback(async () => {
    try {
      const result = await getVmwareConfigMap();
      if (result?.data) {
        setData(result?.data);
        dispatch(v2vConfigMapActions[v2vConfigMapActionsNames.updateImages](result?.data));
      }
    } catch (e) {
      setError(e);
    }
    setLoaded(true);
  }, [dispatch]);

  React.useEffect(() => {
    !data && getData();
  }, [data, getData]);

  return [data, loaded, error];
};

export default useV2VConfigMap;
