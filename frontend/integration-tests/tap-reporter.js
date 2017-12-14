const _ = require('lodash');
const fs = require('fs');

const logFile = process.env.TAP_LOG || 'tap.log';

module.exports = {
  write: (results, options, cb) => {
    let i = 1;
    const ws = fs.createWriteStream(logFile);
    ws.write(`1..${results.tests}\n`);
    _.each(results.modules, m => {
      _.each(m.skipped, tests => {
        _.each(tests.assertions, a => {
          ws.write(`ok ${i} - # SKIP ${a.message}\n`);
          i++;
        });
      });
      _.each(m.completed, tests => {
        _.each(tests.assertions, a => {
          ws.write(`${a.failure ? 'not ' : ''}ok ${i} - ${a.message}\n`);
          i++;
        });
      });
    });
    ws.on('finish', cb);
    ws.end();
  },
};
