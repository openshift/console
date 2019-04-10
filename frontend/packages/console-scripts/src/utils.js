function handleSpawnResult(result) {
  if (result.signal === 'SIGKILL') {
    console.error(
      'The build failed because the process exited too early. ' +
        'This probably means the system ran out of memory or someone called ' +
        '`kill -9` on the process.',
    );
  } else if (result.signal === 'SIGTERM') {
    console.error(
      'The build failed because the process exited too early. ' +
        'Someone might have called `kill` or `killall`, or the system could ' +
        'be shutting down.',
    );
  }
  process.exitCode = result.signal ? 1 : result.status;
}

module.exports = {
  handleSpawnResult,
};
