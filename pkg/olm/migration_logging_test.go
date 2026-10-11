package olm

import (
	"context"
	"errors"
	"fmt"
	"testing"

	"github.com/operator-framework/library-olm/migration/pkg/migration"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	apierrors "k8s.io/apimachinery/pkg/api/errors"
	"k8s.io/apimachinery/pkg/runtime/schema"
	"sigs.k8s.io/controller-runtime/pkg/client"
)

type migrationUnprintableError struct{}

func (migrationUnprintableError) Error() string {
	panic("raw error text must not be read for logging")
}

func TestMigrationErrorCategoryDoesNotExposeRequestData(t *testing.T) {
	resource := schema.GroupResource{Group: "olm.operatorframework.io", Resource: "clusterextensions"}
	for _, tt := range []struct {
		name string
		err  error
		want string
	}{
		{name: "cancellation", err: fmt.Errorf("secret request: %w", context.Canceled), want: "cancelled"},
		{name: "deadline", err: context.DeadlineExceeded, want: "timeout"},
		{name: "api timeout", err: apierrors.NewTimeoutError("private host", 0), want: "timeout"},
		{name: "unauthorized", err: apierrors.NewUnauthorized("Bearer credential"), want: "unauthorized"},
		{name: "forbidden", err: apierrors.NewForbidden(resource, "demo", errors.New("private image")), want: "forbidden"},
		{name: "missing", err: apierrors.NewNotFound(resource, "demo"), want: "not-found"},
		{name: "conflict", err: apierrors.NewConflict(resource, "demo", errors.New("private URL")), want: "conflict"},
		{name: "unknown", err: errors.New("https://user:password@private.example?token=secret"), want: "unexpected"},
		{name: "unprintable", err: migrationUnprintableError{}, want: "unexpected"},
	} {
		t.Run(tt.name, func(t *testing.T) { assert.Equal(t, tt.want, migrationErrorCategory(tt.err)) })
	}
}

type migrationPanicClient struct{ client.Client }

func (migrationPanicClient) List(context.Context, client.ObjectList, ...client.ListOption) error {
	panic(migrationUnprintableError{})
}

func TestMigrationPanicDoesNotExposeRecoveredValue(t *testing.T) {
	store := newMigrationJobStore()
	job, err := store.create("owner", operatorMigrationBulkRequest{AllEligible: true})
	require.NoError(t, err)
	handler := &OLMHandler{migrationJobs: store}
	migrator := migration.NewMigrator(migrationPanicClient{newMigrationTestClient(t)}, nil)

	handler.runMigrationJob(job.ID, migrator)

	snapshot, found := store.snapshot(job.ID, "owner")
	require.True(t, found)
	assert.Equal(t, "Failed", snapshot.Status)
	assert.Equal(t, "migration job failed unexpectedly", snapshot.Message)
}
