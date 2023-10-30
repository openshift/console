package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"io/fs"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"

	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
)

type VerifierLog struct {
	Name    string      `json:"name" yaml:"name"`
	Time    string      `json:"time" yaml:"time"`
	Entries []*LogEntry `json:"log" yaml:"log"`
}

type LogEntry struct {
	Entry string `json:"Entry" yaml:"Entry"`
}

var (
	CmdStdout io.Writer = os.Stdout
	CmdStderr io.Writer = os.Stderr
)

var (
	verifierlog    VerifierLog
	cmd            *cobra.Command
	stdoutFileName string
	stderrFileName string
)

const outputDirectory string = "chartverifier"

func InitLog(cobraCmd *cobra.Command, stdFilename string, suppressErrorLog bool) {
	cmd = cobraCmd
	stdoutFileName = stdFilename
	cmd.SetErr(CmdStderr)
	now := time.Now()
	verifierlog = VerifierLog{Name: "Chart Verifier Log", Time: now.Format("01-02-2006-15-04-05")}
	if suppressErrorLog {
		stderrFileName = ""
	} else {
		stderrFileName = fmt.Sprintf("verifier-%s.log", verifierlog.Time)
	}
}

func LogWarning(message string) {
	if cmd != nil {
		cmd.PrintErrln(message)
	}
	warningLogEntry := LogEntry{Entry: fmt.Sprintf("[WARNING] %s : %s", getTimeStamp(), message)}
	verifierlog.Entries = append(verifierlog.Entries, &warningLogEntry)
}

func LogInfo(message string) {
	infoLogEntry := LogEntry{Entry: fmt.Sprintf("[INFO] %s : %s", getTimeStamp(), message)}
	verifierlog.Entries = append(verifierlog.Entries, &infoLogEntry)
}

func LogError(message string) {
	if cmd != nil {
		cmd.PrintErrln(message)
	}
	errorLogEntry := LogEntry{Entry: fmt.Sprintf("[ERROR] %s : %s", getTimeStamp(), message)}
	verifierlog.Entries = append(verifierlog.Entries, &errorLogEntry)
}

func WriteLogs(logFormat string) {
	pruneLogFiles()

	if len(verifierlog.Entries) > 0 && len(stderrFileName) > 0 {
		logOut := ""
		if logFormat == "json" {
			b, err := json.Marshal(&verifierlog)
			if err != nil {
				LogError(err.Error())
				return
			}
			logOut = string(b)
		} else {
			b, err := yaml.Marshal(&verifierlog)
			if err != nil {
				LogError(err.Error())
				return
			}
			logOut = string(b)
		}
		writeToFile(logOut, stderrFileName)
	}
}

func WriteStdOut(output string) {
	fileWriteSuccess := false
	if len(stdoutFileName) > 0 {
		fileWriteSuccess = writeToFile(output, stdoutFileName)
	}
	if !fileWriteSuccess {
		writeToStdOut(output)
	}
}

func writeToStdOut(output string) {
	savedOut := cmd.OutOrStdout()
	cmd.SetOut(CmdStdout)
	cmd.Println(output)
	cmd.SetOut(savedOut)
}

// writeToFile writes output to fileName and returns true if successful.
func writeToFile(output string, fileName string) bool {
	currentDir, err := os.Getwd()
	if err != nil {
		LogError(fmt.Sprintf("error getting current working directory : %s", err))
		return false
	}
	outputDir := path.Join(currentDir, outputDirectory)
	outputFile := path.Join(outputDir, fileName)
	if _, err := os.Stat(outputDir); err != nil {
		// #nosec G301
		if err = os.MkdirAll(outputDir, 0o777); err != nil {
			LogError(fmt.Sprintf("error creating directory : %s : %s", outputDir, err))
			return false
		}
	}

	if _, err := os.Stat(outputFile); err == nil {
		// TODO(komish) this block needs refactoring.
		//
		// The general idea here is "try to delete an existing file and if you can't
		// fail", but the handling of the value err here doesn't quite do what is
		// expected. Adding this comment at linting/styling application instead of refactoring,
		// but this should be done soon after.
		//
		//nolint:ineffassign,staticcheck
		err = os.Remove(outputFile)
	} else if errors.Is(err, os.ErrNotExist) {
		//nolint:ineffassign
		err = nil
	} else {
		LogError(fmt.Sprintf("Error removing existing file %s: %s", fileName, err))
	}
	outfile, openErr := os.OpenFile(outputFile, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0o600)
	if openErr == nil {
		// #nosec G304
		defer outfile.Close()
		if _, writeErr := outfile.WriteString(output); writeErr != nil {
			LogError(fmt.Sprintf("Error writing file %s: %s", fileName, writeErr))
			return false
		}
		return true
	} else {
		LogError(fmt.Sprintf("Error creating/opening file %s: %s", fileName, openErr))
	}
	return false
}

type By func(p1, p2 fs.FileInfo) bool

type fileSorter struct {
	files []fs.FileInfo
	by    func(p1, p2 fs.FileInfo) bool // Closure used in the Less method.
}

func (by By) sort(files []fs.FileInfo) {
	fs := &fileSorter{
		files: files,
		by:    by, // The Sort method's receiver is the function (closure) that defines the sort order.
	}
	sort.Sort(fs)
}

// Len is part of sort.Interface.
func (fs *fileSorter) Len() int {
	return len(fs.files)
}

// Swap is part of sort.Interface.
func (fs *fileSorter) Swap(i, j int) {
	fs.files[i], fs.files[j] = fs.files[j], fs.files[i]
}

// Less is part of sort.Interface. It is implemented by calling the "by" closure in the sorter.
func (fs *fileSorter) Less(i, j int) bool {
	return fs.by(fs.files[i], fs.files[j])
}

func pruneLogFiles() {
	currentDir, err := os.Getwd()
	if err != nil {
		LogError(fmt.Sprintf("error getting current working directory : %s", err))
		return
	}
	logFilesPath := path.Join(currentDir, outputDirectory)

	if _, err := os.Stat(logFilesPath); err != nil {
		return
	}

	files, err := os.ReadDir(logFilesPath)
	if err != nil {
		LogError(fmt.Sprintf("error reading log directory : %s : %s", logFilesPath, err))
		return
	}

	logFiles := make([]fs.FileInfo, 0)
	for _, file := range files {
		if strings.HasPrefix(file.Name(), "verifier") && strings.HasSuffix(file.Name(), ".log") {
			fileInfo, err := file.Info()
			if err != nil {
				LogError(fmt.Sprintf("error getting file info : %s : %s", logFiles, err))
				return
			}

			logFiles = append(logFiles, fileInfo)
		}
	}

	if len(logFiles) >= 10 {
		sortByName := func(f1, f2 fs.FileInfo) bool {
			return f1.Name() < f2.Name()
		}
		By(sortByName).sort(logFiles)

		for i := 0; i <= len(logFiles)-10; i++ {
			LogInfo(fmt.Sprintf("Deleting old log file : %s", logFiles[i].Name()))
			err = os.Remove(filepath.Join(logFilesPath, logFiles[i].Name()))
			if err != nil {
				LogError(fmt.Sprintf("error deleting logfile : %s : %s", logFiles[i].Name(), err))
			}
		}
	}
}

func getTimeStamp() string {
	t := time.Now()
	year, month, day := t.Date()
	return fmt.Sprintf("[%d-%s-%d %d:%d:%d.%d]", year, month, day, t.Hour(), t.Minute(), t.Second(), t.Nanosecond())
}
