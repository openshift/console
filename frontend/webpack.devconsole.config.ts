/* eslint-env node */
/* eslint-disable no-unused-vars, no-undef */

import * as webpack from 'webpack';
import * as _ from 'lodash';
import baseconfig from './webpack.config';

module.exports = env => {
  return _.merge({}, baseconfig, {
    name: 'devconsole',
    plugins: [
      new webpack.DefinePlugin({
        'process.env.DEVCONSOLE_ENABLED': env.devconsole,
      }),
    ],
  });
};
