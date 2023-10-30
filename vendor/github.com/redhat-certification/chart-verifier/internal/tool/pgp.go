package tool

import (
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"fmt"
	"os"
	"os/exec"
	"path"
)

func GetKeyRing(targetDir string, publicKeys []string) (string, error) {
	if _, err := os.Stat(targetDir); err != nil {
		// #nosec G301
		if err = os.MkdirAll(targetDir, 0o777); err != nil {
			return "", err
		}
	} else {
		//nolint //TODO(komish): The intention may have been to return if
		// this RemoveAll fails, but we need to be certain. In some cases, RemoveAll
		// returns an error that might be ignored. Need to validate. Ignoring for now.
		err = os.RemoveAll(targetDir)
	}

	ringFile := path.Join(targetDir, "keyring.pgp")

	keyFileDir := path.Join(targetDir, "key")
	if err := os.MkdirAll(keyFileDir, 0o750); err != nil {
		return "", err
	}

	publicKeyFiles, createKeyErr := createKeyFiles(keyFileDir, publicKeys)
	if createKeyErr != nil {
		return "", createKeyErr
	}

	for numKeyFile, keyFile := range publicKeyFiles {
		if numKeyFile > 0 {
			// #nosec G204
			cmd := exec.Command("gpg", "--no-default-keyring", "--keyring", ringFile, "--import", keyFile)
			err := cmd.Run()
			if err != nil {
				return "", err
			}
			if _, err = os.Stat(ringFile); err != nil {
				return "", err
			}
		} else {
			// #nosec G204
			cmd := exec.Command("gpg", "-o", ringFile, "--dearmor", keyFile)
			err := cmd.Run()
			if err != nil {
				return "", err
			}
			if _, err = os.Stat(ringFile); err != nil {
				return "", err
			}
		}
	}
	return ringFile, nil
}

func GetDecodedKey(publicKey string) ([]byte, error) {
	dec, err := base64.StdEncoding.DecodeString(publicKey)
	if err != nil {
		return nil, err
	}
	return dec, nil
}

func GetEncodedKey(publicKeyFileName string) (string, error) {
	if len(publicKeyFileName) == 0 {
		return "", nil
	}
	// #nosec G304
	keyBytes, err := os.ReadFile(publicKeyFileName)
	if err != nil {
		return "", err
	}
	encodedKey := base64.StdEncoding.EncodeToString(keyBytes)
	return encodedKey, nil
}

func GetPublicKeyDigest(publicKey string) (string, error) {
	if len(publicKey) == 0 {
		return "", nil
	}
	h := sha256.New()
	if _, err := h.Write([]byte(publicKey + "\n")); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}

func createKeyFiles(targetDir string, publicKeys []string) ([]string, error) {
	var keyFiles []string
	for keyNum, publicKey := range publicKeys {
		keyFile := fmt.Sprintf("Pubkey_%d.asc", keyNum)
		keyFileName := path.Join(targetDir, keyFile)

		decodedKey, err := GetDecodedKey(publicKey)
		if err != nil {
			return nil, err
		}
		// #nosec G306
		err = os.WriteFile(keyFileName, decodedKey, 0o644)
		if err != nil {
			return nil, err
		}
		keyFiles = append(keyFiles, keyFileName)
	}
	return keyFiles, nil
}
