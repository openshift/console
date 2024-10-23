const fs = require('fs');
const path = require('path');
const Mocha = require('mocha');

class CustomReporter extends Mocha.reporters.Base {
  constructor(runner) {
    super(runner);

    let suiteStarted = false;

    // Get the thread identifier
    const threadId = process.env.CYPRESS_THREAD || 'default';

    const packageName = 'dev-console';

    // Set up a log file for this thread
    this.logFile = path.join(
      __dirname,
      `../../../../gui_test_screenshots/${packageName}-thread-${threadId}.txt`,
    );

    const logDir = path.dirname(this.logFile);

    // Create the logs directory if it doesn't exist
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }

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
      this.log(`\n\t\t \u2716 ${test.title} - \n\t\t Error: ${err.message} \n`);
    });
  }

  log(message) {
    fs.appendFileSync(this.logFile, message, 'utf8');
  }
}

module.exports = CustomReporter;
