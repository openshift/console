package profileconfig

import (
	"embed"
	"path/filepath"
)

//go:embed profiles/*
var content embed.FS

type ProfileInfo struct {
	Name string
	Data []byte
}

// Get all profiles in the profiles directory, and any subdirectories, and add each to the profile map
func GetProfiles() ([]ProfileInfo, error) {

	var profiles []ProfileInfo
	profileFiles, err := content.ReadDir("profiles")
	if err != nil {
		return nil, err
	}

	for _, profileFile := range profileFiles {
		newProfile := ProfileInfo{}
		newProfile.Name = profileFile.Name()
		fileContent, err := content.ReadFile(filepath.Join("profiles", newProfile.Name))
		if err == nil {
			newProfile.Data = fileContent
			profiles = append(profiles, newProfile)
		}
	}
	return profiles, nil
}
