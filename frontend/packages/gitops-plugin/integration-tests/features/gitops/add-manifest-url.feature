@gitops
Feature: Applications managed by GitOps and Create secret
    User should be able to see list of applications managed by GitOps


        Background:
            Given user has installed gitOps operator
              And user is at developer perspective


        @smoke
        Scenario: No GitOps Manifest URLs found: GO-01-TC01
             When user navigates to Environments page
             Then user will see the message No GitOps manifest URLs found


        @regression @manual
        Scenario: Create Secret: GO-01-TC02
            Given user has imported gitops repo
             When user creates the namespace in pattern of "pipelines-{username}-github"
              And user creates the secret in pattern of "{username}-github-token"
              And user navigates to Environments page
             Then user will see the list GitOps application groupings on the page


        @regression @manual
        Scenario: Application Details page for Applications: GO-01-TC03
            Given user is on the Environments page
              And user can see the Applications on the page
             When user clicks on the application
             Then user can see the application Details page
              And user can see various environments for that application
              And user can see how many application or workloads are deployed in each environment
              And user can see status of the application or workloads


# scenario is commented, as we don't need to add Manifest URLs manually now
        # @regression @manual
        # Scenario: Add Manifest URL and No Application groups found message
        #      When user has created namespace "aut-addflow-catalog"
        #       And user navigates to Search page
        #       And user selects "Namespaces" on Resources dropdown
        #       And user selects Namespace "aut-addflow-catalog"
        #       And user clicks on YAML tab
        #       And user adds annotation "app.openshift.io/vcs-uri"
        #       And user adds the Manifest URL under annotation "app.openshift.io/vcs-uri"
        #       And user saves the YAML
        #       And user reloads the YAML to see the changes
        #       And user navigates to Environments page
        #      Then user will see No Application groups found message
