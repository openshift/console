const chromedriver = require('chromedriver');
const _ = require('lodash');

module.exports = {
  before: done => {
    chromedriver.start();
    done();
  },

  after: done => {
    chromedriver.stop();
    done();
  },

  reporter: results => {
    const clean = (
      (_.isUndefined(results.failed) || results.failed === 0) &&
      (_.isUndefined(results.error) || results.error === 0)
    );

    chromedriver.stop();
    process.exit(clean ? 0 : 1);
  },
};
