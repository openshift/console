package migration

// CheckResult represents the outcome of a single pre-migration check.
type CheckResult struct {
	Name    string // short name of the check
	Passed  bool
	Message string // detail — pass reason or failure reason
}

// PreMigrationReport contains the results of all readiness and compatibility checks.
type PreMigrationReport struct {
	Checks []CheckResult
}

// Passed returns true if all checks passed.
func (r *PreMigrationReport) Passed() bool {
	for _, c := range r.Checks {
		if !c.Passed {
			return false
		}
	}
	return true
}

// FailedChecks returns only the checks that failed.
func (r *PreMigrationReport) FailedChecks() []CheckResult {
	var failed []CheckResult
	for _, c := range r.Checks {
		if !c.Passed {
			failed = append(failed, c)
		}
	}
	return failed
}
