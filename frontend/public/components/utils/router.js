import { useRouterHistory } from 'react-router';
import { createHistory } from 'history';

export const history = useRouterHistory(createHistory)({basename: window.SERVER_FLAGS.basePath});
