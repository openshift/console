package utils

import (
	"encoding/json"
	"errors"
	"fmt"
	"github.com/spf13/cobra"
	"gopkg.in/yaml.v3"
	"io"
	"io/fs"
	"io/ioutil"
	"os"
	"path"
	"path/filepath"
	"sort"
	"strings"
	"time"
)

type VerifierLog struct {
	Name    string      `json:"name" yaml:"name"`
	Time    string      `json:"time" yaml: time"`
	Entries []*LogEntry `json:"log" yaml:"log"`
}

type LogEntry struct {
	Entry string `json:"Entry" yaml:"Entry"`
}

var CmdStdout io.Writer = os.Stdout
var CmdStderr io.Writer = os.Stderr

var verifierlog VerifierLog
var cmd *cobra.Command
var stdoutFileName string
var stderrFileName string

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
	warning_log_entry := LogEntry{Entry: fmt.Sprintf("[WARNING] %s", message)}
	verifierlog.Entries = append(verifierlog.Entries, &warning_log_entry)
}

func LogInfo(message string) {
	info_log_entry := LogEntry{Entry: fmt.Sprintf("[INFO] %s", message)}
	verifierlog.Entries = append(verifierlog.Entries, &info_log_entry)
}

func LogError(message string) {
	if cmd != nil {
		cmd.PrintErrln(message)
	}
	error_log_entry := LogEntry{Entry: fmt.Sprintf("[ERROR] %s", message)}
	verifierlog.Entries = append(verifierlog.Entries, &error_log_entry)
}

func WriteLogs(log_format string) {

	pruneLogFiles()

	if len(verifierlog.Entries) > 0 && len(stderrFileName) > 0 {
		logOut := ""
		if log_format == "json" {
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
	return

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

func writeToFile(output string, fileName string) bool {

	currentDir, err := os.Getwd()
	if err != nil {
		LogError(fmt.Sprintf("error getting current working directory : %s", err))
		return false
	}
	outputDir := path.Join(currentDir, outputDirectory)
	outputFile := path.Join(outputDir, fileName)
	if _, err := os.Stat(outputDir); err != nil {
		if err = os.MkdirAll(outputDir, 0777); err != nil {
			LogError(fmt.Sprintf("error creating directory : %s : %s", outputDir, err))
			return false
		}
	}

	if _, err := os.Stat(outputFile); err == nil {
		err = os.Remove(outputFile)
	} else if errors.Is(err, os.ErrNotExist) {
		err = nil
	} else {
		LogError(fmt.Sprintf("Error removing existing file %s: %s", fileName, err))
	}

	if outfile, open_err := os.OpenFile(outputFile, os.O_APPEND|os.O_WRONLY|os.O_CREATE, 0600); open_err == nil {
		outfile.WriteString(output)
		outfile.Close()
		return true
	} else {
		LogError(fmt.Sprintf("Error creating/opening file %s: %s", fileName, open_err))
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

	files, err := ioutil.ReadDir(logFilesPath)
	if err != nil {
		LogError(fmt.Sprintf("error reading log directory : %s : %s", logFilesPath, err))
		return
	}

	logFiles := make([]fs.FileInfo, 0)
	for _, file := range files {
		if strings.HasPrefix(file.Name(), "verifier") && strings.HasSuffix(file.Name(), ".log") {
			logFiles = append(logFiles, file)
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
