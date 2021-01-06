/* eslint-env node */

import { configure } from 'enzyme';
import * as Adapter from '@wojtekmaj/enzyme-adapter-react-17';

import 'url-search-params-polyfill';

// http://airbnb.io/enzyme/docs/installation/index.html#working-with-react-16
configure({ adapter: new Adapter() });
