// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore: FIXME missing exports due to out-of-sync @types/react-redux version
import { useSelector } from 'react-redux';
import { RootState } from '@console/internal/redux';

export const useLocation = (): string =>
  useSelector(({ UI }: RootState) => UI.get('location') ?? '');
