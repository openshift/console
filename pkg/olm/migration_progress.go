package olm

import (
	"github.com/operator-framework/library-olm/migration/pkg/migration"
)

// operatorMigrationProgress preserves the library's progress fields for client
// translation. Errors remain diagnostics rather than translation keys.
type operatorMigrationProgress struct {
	Step    migration.ProgressStep   `json:"step"`
	Status  migration.ProgressStatus `json:"status"`
	Target  string                   `json:"target,omitempty"`
	Message string                   `json:"message,omitempty"`
	Error   string                   `json:"error,omitempty"`
}

func (o *OLMHandler) migrationProgressCallback(jobID string) migration.ProgressFunc {
	return func(event migration.ProgressEvent) {
		progress := operatorMigrationProgress{Step: event.Step, Status: event.Status, Target: event.Target, Message: event.Message}
		if event.Err != nil {
			progress.Error = event.Err.Error()
		}
		message := progress.Message
		if progress.Error != "" && progress.Error != message {
			if message != "" {
				message += ": "
			}
			message += progress.Error
		}
		o.migrationJobs.update(jobID, func(job *operatorMigrationJob) {
			if job.currentItem >= 0 && job.currentItem < len(job.Items) {
				item := &job.Items[job.currentItem]
				if progress.Target == "" {
					progress.Target = item.SubscriptionNamespace + "/" + item.SubscriptionName
				}
				item.Progress = message
				item.ProgressEvent = &progress
			}
			job.Message = message
			job.ProgressEvent = &progress
		})
	}
}

func reportMigrationPhase(m *migration.Migrator, options migration.Options, step migration.ProgressStep, status migration.ProgressStatus) {
	if m.Progress != nil {
		m.Progress(migration.ProgressEvent{Step: step, Status: status, Target: options.SubscriptionNamespace + "/" + options.SubscriptionName})
	}
}

func migrationJournalStep(phase string) migration.ProgressStep {
	switch phase {
	case "checkpoint":
		return migration.ProgressStepBackup
	case "prepare", "scale":
		return migration.ProgressStepPrepare
	case "cos", "ce":
		return migration.ProgressStepCreate
	case "cleanup":
		return migration.ProgressStepCleanup
	case "recovery":
		return migration.ProgressStepRollback
	default:
		return migration.ProgressStepProfile
	}
}
