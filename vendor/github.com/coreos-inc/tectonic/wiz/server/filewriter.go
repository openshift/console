package server

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"

	"github.com/Sirupsen/logrus"
	v1 "k8s.io/kubernetes/pkg/api/v1"
)

type FileWriter struct {
	logger *logrus.Entry
}

func NewFileWriter(logger *logrus.Entry) *FileWriter {
	return &FileWriter{logger}
}

func (f *FileWriter) WriteNamespaces(namespaces []v1.Namespace) error {
	for _, ns := range namespaces {
		if err := f.write(ns.Name, ns); err != nil {
			return err
		}
	}

	return nil
}

func (f *FileWriter) WriteConfigMaps(cMaps []v1.ConfigMap) error {
	for _, cm := range cMaps {
		if err := f.write(cm.Name, cm); err != nil {
			return err
		}
	}
	return nil
}

func (f *FileWriter) WriteSecrets(secrets []v1.Secret) error {
	for _, sc := range secrets {
		if err := f.write(sc.Name, sc); err != nil {
			return err
		}
	}
	return nil
}

func (f *FileWriter) write(name string, obj interface{}) error {
	b, err := json.MarshalIndent(obj, "", "  ")
	if err != nil {
		return err
	}

	_, filename := filepath.Split(name)
	filepath := fmt.Sprintf("./output/%s.json", filename)
	file, err := os.Create(filepath)
	if err != nil {
		return err
	}
	defer file.Close()

	_, err = file.Write(b)
	if err != nil {
		return err
	}

	f.logger.WithField("filepath", filepath).Info("Wrote file")
	return nil
}
