package validation

import (
	"github.com/devfile/api/v2/pkg/apis/workspaces/v1alpha2"
	"github.com/hashicorp/go-multierror"
)

// ValidateStarterProjects checks if starter project has only one remote configured
// and if the checkout remote matches the remote configured
func ValidateStarterProjects(starterProjects []v1alpha2.StarterProject) (returnedErr error) {

	for _, starterProject := range starterProjects {
		var gitSource v1alpha2.GitLikeProjectSource
		if starterProject.Git != nil {
			gitSource = starterProject.Git.GitLikeProjectSource
		} else {
			continue
		}

		switch len(gitSource.Remotes) {
		case 0:

			newErr := resolveErrorMessageWithImportAttributes(&MissingStarterProjectRemoteError{projectName: starterProject.Name}, starterProject.Attributes)
			returnedErr = multierror.Append(returnedErr, newErr)
		case 1:
			if gitSource.CheckoutFrom != nil && gitSource.CheckoutFrom.Remote != "" {
				err := validateRemoteMap(gitSource.Remotes, gitSource.CheckoutFrom.Remote, starterProject.Name)
				if err != nil {
					newErr := resolveErrorMessageWithImportAttributes(err, starterProject.Attributes)
					returnedErr = multierror.Append(returnedErr, newErr)
				}
			}
		default: // len(gitSource.Remotes) >= 2

			newErr := resolveErrorMessageWithImportAttributes(&MultipleStarterProjectRemoteError{projectName: starterProject.Name}, starterProject.Attributes)
			returnedErr = multierror.Append(returnedErr, newErr)
		}
	}

	return returnedErr
}

// ValidateProjects checks if the project has more than one remote configured then a checkout
// remote is mandatory and if the checkout remote matches the renote configured
func ValidateProjects(projects []v1alpha2.Project) (returnedErr error) {

	for _, project := range projects {
		var gitSource v1alpha2.GitLikeProjectSource
		if project.Git != nil {
			gitSource = project.Git.GitLikeProjectSource
		} else {
			continue
		}
		switch len(gitSource.Remotes) {
		case 0:

			newErr := resolveErrorMessageWithImportAttributes(&MissingProjectRemoteError{projectName: project.Name}, project.Attributes)
			returnedErr = multierror.Append(returnedErr, newErr)
		case 1:
			if gitSource.CheckoutFrom != nil && gitSource.CheckoutFrom.Remote != "" {
				if err := validateRemoteMap(gitSource.Remotes, gitSource.CheckoutFrom.Remote, project.Name); err != nil {
					newErr := resolveErrorMessageWithImportAttributes(err, project.Attributes)
					returnedErr = multierror.Append(returnedErr, newErr)
				}
			}
		default: // len(gitSource.Remotes) >= 2
			if gitSource.CheckoutFrom == nil || gitSource.CheckoutFrom.Remote == "" {

				newErr := resolveErrorMessageWithImportAttributes(&MissingProjectCheckoutFromRemoteError{projectName: project.Name}, project.Attributes)
				returnedErr = multierror.Append(returnedErr, newErr)
				continue
			}
			if err := validateRemoteMap(gitSource.Remotes, gitSource.CheckoutFrom.Remote, project.Name); err != nil {
				newErr := resolveErrorMessageWithImportAttributes(err, project.Attributes)
				returnedErr = multierror.Append(returnedErr, newErr)
			}
		}
	}

	return returnedErr
}

// validateRemoteMap checks if the checkout remote is present in the project remote map
func validateRemoteMap(remotes map[string]string, checkoutRemote, projectName string) error {

	if _, ok := remotes[checkoutRemote]; !ok {

		return &InvalidProjectCheckoutRemoteError{projectName: projectName, checkoutRemote: checkoutRemote}
	}

	return nil
}
