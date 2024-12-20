import * as _ from 'lodash';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME out-of-sync @types/react-redux version as new types cause many build errors
import { useSelector } from 'react-redux';
import { userStateToProps } from '@console/internal/reducers/ui';

const useDefaultSecret = () => {
  const { user } = useSelector(userStateToProps);
  const userName = _.replace(user?.metadata?.name ?? '', /[^a-zA-Z0-9-]/g, '');
  const defaultSecret = userName
    ? [`pipelines-${userName}-github`, `${userName}-github-token`]
    : [];
  return defaultSecret;
};

export default useDefaultSecret;
