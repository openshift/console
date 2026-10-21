package tool

import (
	"fmt"
	"strings"

	"github.com/helm/chart-testing/v3/pkg/exec"
)

type ProcessExecutorer interface {
	RunProcessAndCaptureOutput(executable string, execArgs ...interface{}) (string, error)
}

type ProcessExecutor struct {
	exec.ProcessExecutor
}

func NewProcessExecutor(debug bool) ProcessExecutor {
	return ProcessExecutor{
		exec.NewProcessExecutor(debug),
	}
}

func (p ProcessExecutor) RunProcessAndCaptureOutput(executable string, execArgs ...interface{}) (string, error) {
	return p.RunProcessInDirAndCaptureOutput("", executable, execArgs...)
}

// RunProcessInDirAndCaptureOutput overrides exec.ProcessExecutor's and inject the command line and any streamed content
// to either Stdout or Stderr into the returned error, if any.
func (p ProcessExecutor) RunProcessInDirAndCaptureOutput(
	workingDirectory string,
	executable string,
	execArgs ...interface{},
) (string, error) {
	cmd, err := p.CreateProcess(executable, execArgs...)
	if err != nil {
		return "", err
	}

	cmd.Dir = workingDirectory
	bytes, err := cmd.CombinedOutput()
	capturedOutput := strings.TrimSpace(string(bytes))

	execArgsCopy := toStringArray(execArgs)
	execArgsStr := strings.Join(execArgsCopy, " ")

	if err != nil {
		if len(capturedOutput) == 0 {
			return "", fmt.Errorf(
				"error running process: executing %s with args %q: %w",
				executable, execArgsStr, err)
		}
		return capturedOutput, fmt.Errorf(
			"error running process: executing %s with args %q: %w\n---\n%s",
			executable, execArgsStr, err, capturedOutput)
	}
	return capturedOutput, nil
}

func toStringArray(args []interface{}) []string {
	cpy := make([]string, len(args))
	for i, a := range args {
		cpy[i] = fmt.Sprint(a)
	}
	return cpy
}
