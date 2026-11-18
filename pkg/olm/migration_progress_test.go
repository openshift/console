package olm

import (
	"encoding/json"
	"errors"
	"testing"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
)

func TestMigrationProgressPreservesStructuredFields(t *testing.T) {
	tests := []struct {
		name    string
		event   migration.ProgressEvent
		target  string
		message string
	}{
		{name: "started without English message", event: migration.ProgressEvent{Step: migration.ProgressStepBackup, Status: migration.ProgressStarted}, target: "operators/demo"},
		{name: "waiting with explicit target", event: migration.ProgressEvent{Step: migration.ProgressStepCreate, Status: migration.ProgressWaiting, Target: "operators/other", Message: "Waiting for CE other (not found yet)"}, target: "operators/other", message: "Waiting for CE other (not found yet)"},
		{name: "warning with separate error", event: migration.ProgressEvent{Step: migration.ProgressStepBackup, Status: migration.ProgressWarning, Message: "Backup warning", Err: errors.New("disk full")}, target: "operators/demo", message: "Backup warning: disk full"},
		{name: "failure does not duplicate error", event: migration.ProgressEvent{Step: migration.ProgressStepCreate, Status: migration.ProgressFailed, Message: "access denied", Err: errors.New("access denied")}, target: "operators/demo", message: "access denied"},
		{name: "completion with empty message", event: migration.ProgressEvent{Step: migration.ProgressStepCleanup, Status: migration.ProgressCompleted}, target: "operators/demo"},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			store := newMigrationJobStore()
			job, err := store.create("alice", operatorMigrationBulkRequest{Operators: []operatorMigrationOptionsRequest{{SubscriptionNamespace: "operators", SubscriptionName: "demo"}}})
			require.NoError(t, err)
			store.update(job.ID, func(job *operatorMigrationJob) { job.currentItem = 0 })
			var persisted []byte
			store.persist = func(snapshot operatorMigrationJobSnapshot) error {
				var err error
				persisted, err = encodeMigrationState(snapshot)
				return err
			}
			handler := &OLMHandler{migrationJobs: store}
			handler.migrationProgressCallback(job.ID)(tt.event)
			var snapshot operatorMigrationJobSnapshot
			require.NoError(t, decodeMigrationState(persisted, &snapshot))
			expected := &operatorMigrationProgress{Step: tt.event.Step, Status: tt.event.Status, Target: tt.target, Message: tt.event.Message}
			if tt.event.Err != nil {
				expected.Error = tt.event.Err.Error()
			}
			assert.Equal(t, expected, snapshot.ProgressEvent)
			assert.Equal(t, expected, snapshot.Items[0].ProgressEvent)
			assert.Equal(t, tt.message, snapshot.Message)
			assert.Equal(t, tt.message, snapshot.Items[0].Progress)
			// JSON exposes a diagnostic string, never an opaque Go error object.
			encoded, err := json.Marshal(snapshot.ProgressEvent)
			require.NoError(t, err)
			assert.Contains(t, string(encoded), `"step":`)
			assert.NotContains(t, string(encoded), `"Err":`)
			// Finishing must replace the active event with the terminal job state.
			handler.finishMigrationJob(job.ID, "Succeeded", "Migration job completed")
			snapshot = operatorMigrationJobSnapshot{}
			require.NoError(t, decodeMigrationState(persisted, &snapshot))
			assert.Nil(t, snapshot.ProgressEvent)
			assert.Equal(t, expected, snapshot.Items[0].ProgressEvent)
		})
	}
}
