package migration

import (
	"encoding/json"
	"fmt"
)

// withStagingBackup copies recovery specs into the migration plan before any
// target is created. The caller's plan and backup remain unchanged.
func withStagingBackup(info *MigrationInfo, backup *Backup) (*MigrationInfo, error) {
	if info == nil {
		return nil, fmt.Errorf("migration information is required")
	}
	copy := *info
	if backup == nil {
		return &copy, nil
	}
	if backup.Subscription != nil {
		data, err := json.Marshal(backup.Subscription.Spec)
		if err != nil {
			return nil, fmt.Errorf("encode Subscription recovery backup: %w", err)
		}
		copy.SubscriptionBackupJSON = string(data)
	}
	if backup.OperatorGroup != nil {
		data, err := json.Marshal(backup.OperatorGroup.Spec)
		if err != nil {
			return nil, fmt.Errorf("encode OperatorGroup recovery backup: %w", err)
		}
		copy.OperatorGroupBackupJSON = string(data)
	}
	return &copy, nil
}

// addStagingBackup persists the same recovery specs used by CE rollback on the
// retained staging resource, so a failure before CE creation cannot lose them.
func addStagingBackup(annotations map[string]string, info *MigrationInfo) {
	if info.SubscriptionBackupJSON != "" {
		annotations[MigrationSubscriptionBackupAnnotation] = info.SubscriptionBackupJSON
	}
	if info.OperatorGroupBackupJSON != "" {
		annotations[MigrationOperatorGroupBackupAnnotation] = info.OperatorGroupBackupJSON
	}
}
