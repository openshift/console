const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');
// const resultsPath = path.join(process.cwd(), 'runner-results');

class CustomReporter extends Mocha.reporters.Base {
  constructor(runner) {
    super(runner);

    let suiteStarted = false;

    // Get the thread identifier
    const threadId = process.env.CYPRESS_THREAD || 'default';

    // Set up a log file for this thread
    this.logFile = path.join(
      __dirname,
      `../../../gui_test_screenshots/integration-tests-cypress-test-results-thread-${threadId}.txt`,
    );

    runner.on('suite', (suite) => {
      if (!suiteStarted) {
        this.log(`\n\t Running: ${suite.title || suite.file || 'N/A'}\n`);
        suiteStarted = true;
      }
    });

    runner.on('pass', (test) => {
      this.log(`\n\t\t \u2713 ${test.title}  (${test.duration}s)`);
    });

    runner.on('fail', (test, err) => {
      this.log(`\n\t\t \u2716 ${test.title} - \n\t\t Error: ${err.message}`);
    });
  }

  log(message) {
    fs.appendFileSync(this.logFile, message, 'utf8');
  }
}

module.exports = CustomReporter;
