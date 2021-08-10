import * as React from 'react';
import { render } from 'react-dom';
import { AppRoot } from './components/foundation';
import { PageLoader } from './components/loading';

import './vendor.scss';

const appContainer = document.getElementById('app');

render(<PageLoader />, appContainer);

setTimeout(() => {
  render(<AppRoot />, appContainer);
}, 1000); // fake loading timeout
