const _ = require('lodash');

module.exports = {
  write: (results, options, cb) => {
    let i = 1;
    console.log(`1..${results.tests}`);
    _.each(results.modules, m => {
      _.each(m.skipped, tests => {
        _.each(tests.assertions, a => {
          console.log(`ok ${i} - # SKIP ${a.message}`);
          i++;
        });
      });
      _.each(m.completed, tests => {
        _.each(tests.assertions, a => {
          console.log(`${a.failure ? 'not ' : ''}ok ${i} - ${a.message}`);
          i++;
        });
      });
    });
    cb();
  },
};
