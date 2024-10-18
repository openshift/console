const fs = require('fs');
const path = require('path');

const threadId = process.env.CYPRESS_THREAD || 'default';

const logFilePath = path.join(
  __dirname,
  `../../../../gui_test_screenshots/integration-tests-cypress-test-results-thread-${threadId}.txt`,
);
const logDir = path.dirname(logFilePath);

// Create the logs directory if it doesn't exist
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

const formatDuration = (duration) => {
  const seconds = Math.floor(duration / 1000);
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes} minutes, ${remainingSeconds} seconds`;
};

const formatBoxedStats = (data) => {
  const border = `\t┌${'─'.repeat(94)}┐\n`;
  const footer = `\t└${'─'.repeat(94)}┘\n`;
  const lines = Object.entries(data)
    .map(([key, value]) => {
      return `\t│ ${key.padEnd(14)}: ${String(value).padEnd(77)}│`;
    })
    .join('\n');

  return `${border + lines}\n${footer}`;
};

const log = (message) => {
  fs.appendFileSync(logFilePath, `${message}`, 'utf8');
};

const logVideoURL = (videoURL) => {
  // Append the log message to the log file
  log(`\n\n\t(Video)\n`);
  log(`\n\t - Video output: ${videoURL}`);
};

const logScreenshotURL = (screenshots) => {
  log(`\n\t(Screenshots)\n`);
  for (let i = 0; i < screenshots.length; i++) {
    log(`\n\t - Saved at path: ${screenshots[i].path}`);
  }
};

const logSpecResult = (result) => {
  // Prepare data for formatted output
  const statsData = {
    Tests: result.reporterStats.tests,
    Passing: result.reporterStats.passes,
    Failing: result.reporterStats.failures,
    Pending: result.reporterStats.pending || 0,
    Skipped: result.reporterStats.skipped || 0,
    Screenshots: result.screenshots.length,
    Video: !!result.video,
    Duration: formatDuration(result.reporterStats.duration),
    'Spec Ran': result.spec.relative || result.spec.name || 'N/A',
  };

  if (statsData.Passing) {
    log(`\n\n\t ${statsData.Passing} passing (${result.reporterStats.duration}s)`);
  } else {
    log(
      `\n\n\t ${statsData.Passing} passing ${statsData.Failing} failing  (${result.reporterStats.duration}s)`,
    );
  }
  const boxedStats = formatBoxedStats(statsData);
  log(`\n\n\t(Results)\n\n${boxedStats}`);
};

module.exports = { logVideoURL, logScreenshotURL, logSpecResult, log };
