@pipelines
Feature: Perform Actions on repository
              As a developer, I want to create, edit, delete and view the repositories

        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user is at pipelines page


        @pre-condition
        Scenario Outline: Repositories page: P-11-TC01
            Given user has installed pipelines as code
              And user is at repositories page
             When user creates repository using YAML editor from "<repository_yaml>"
             Then user will be redirected to Repository details page with header name "<repository_name>"

        Examples:
                  | repository_yaml                                  | repository_name |
                  | testData/repository-crd-testdata/repository.yaml | test-repo       |


        @smoke
        Scenario Outline: Reporsitory details display in repository page: P-11-TC02
            Given repository "<repository_name>" is present in Repositories tab of Pipelines page
             When user clicks on the repository "<repository_name>" on Repositories page
             Then user will be redirected to Repository details page with header "<repository_name>"
              And user is able to see Details, YAML, Pipeline Runs tabs
              And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created at, Owner, Repository, Username, Git access token, Webhook URL, Webhook Secret
              And Actions menu display with options Edit labels, Edit annotations, Edit repository, Delete repository

        Examples:
                  | repository_name |
                  | test-repo       |


        @smoke
        Scenario Outline: Repositories page display on newly created repository: P-11-TC03
            Given repository "<repository_name>" is present on the Repositories page
             When user searches repository "<repository_name>" in repositories page
             Then repositories table displayed with column names Name, Event type, Last run, Task status, Last run status, Last run time, Last run duration
              And column Name display with value "<repository_name>"
              And columns Last run, Task status, Last run status, Last run time, Last run duration with values display "-"
              And kebab menu button is displayed
        Examples:
                  | repository_name |
                  | test-repo       |


        @smoke
        Scenario: Kebab menu options of newly created repository in Repositories page: P-11-TC04
            Given repository "test-repo" is present on the Repositories page
             When user searches repository "test-repo" in repositories page
              And user clicks on kebab menu of the repository "test-repo"
             Then kebab menu displays with options Edit labels, Edit annotations, Edit repository, Delete repository


        @regression
        Scenario Outline: Edit repository from Repository details page: P-11-TC05
            Given repository "<repository_name>" is present on the Repositories page
             When user searches repository "<repository_name>" in repositories page
              And user clicks repository "<repository_name>" from searched results on Repositories page
              And user selects option "Edit Repository" from Actions menu drop down
             Then user modifies the yaml code in the yaml view of the repository
              And user clicks on the save button
             Then user is able to see a success alert message on same page

        Examples:
                  | repository_name |
                  | test-repo       |


        @regression
        Scenario: Edit label of repository: P-11-TC07
            Given repository "test-repo" is present on the Repositories page
             When user searches repository "test-repo" in repositories page
              And user clicks repository "test-repo" from searched results on Repositories page
              And user selects option "Edit labels" from Actions menu drop down
              And adds the label "check=label"
              And user clicks on the Save button
             Then label "check=label" should be present in the labels section


        @regression
        Scenario: Edit annotations of repository: P-11-TC08
            Given repository "test-repo" is present on the Repositories page
             When user searches repository "test-repo" in repositories page
              And user clicks repository "test-repo" from searched results on Repositories page
              And user selects option "Edit annotations" from Actions menu drop down
              And user adds key "check" and value "annotations"
              And user clicks on the Save button
             Then annotation section contains the value "1 annotation"


    # test data needs to be created using before execuitng below 2 scenarios : https://docs.google.com/document/d/1nUFtwtuZooDhOGg1YrjXn0zrOhZDrJ4h1oE6h35Noao/edit#
        @regression
        Scenario Outline: Pipeline Run Details page for the repository: P-11-TC09
            Given pipeline run is displayed for "<repository_name>"
              And user is at repositories page
             When user clicks Last Run value of repository "<repository_name>"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see Details, YAML, TaskRuns, Parameters, Logs and Events tabs
              And Details tab is displayed with fields Repository, Branch, Commit id and Event type
              And Actions dropdown display on the top right corner of the page

        Examples:
                  | repository_name |
                  | test-repo       |


        @regression
        Scenario: Pipeline Runs tab of the Repository details page: P-11-TC10
            Given repository "test-repo" is present on the Repositories page
             When user searches repository "test-repo" in repositories page
              And user clicks repository "test-repo" from searched results on Repositories page
              And user clicks on Pipeline Runs tab
             Then user is able to see Name, Commit id, Status, Task status, Started, Duration and Branch fields
              And user hovers over the commit id
             Then user should see commit message in tooltip


        @regression
        Scenario Outline: Delete the repository from the Repository details page: P-11-TC11
            Given repository "<repository_name>" is present on the Repositories page
             When user searches repository "<repository_name>" in repositories page
              And user clicks repository "<repository_name>" from searched results on Repositories page
              And user selects option "Delete Repository" from Actions menu drop down
              And user clicks Delete button on Delete Repository modal
             Then user will be redirected to Repositories page
              And "<repository_name>" is not displayed on Repositories page

        Examples:
                  | repository_name |
                  | test-repo       |


        @regression @odc-6460
        Scenario: Setup GitHub page: P-11-TC12
            Given user is at Pipelines tab in admin page
             When user clicks on Setup GitHub App button
             Then user can see "GitHub application name", "See GitHub permissions" and "View all steps in documentation"


    @regression @manual @odc-6460
    #This test case is manual as it navigates to github in between the process
        Scenario: Create and configure the GitHub Application to work with Pipelines as code: P-11-TC13
            Given user is at Pipelines tab in admin page
             When user clicks on Setup GitHub App button
              And user enters GitHub application name as "pac-app123"
              And user clicks on Setup button
              And user confirms access in github
              And user clicks Create GitHub App button in Create GitHub App page
             Then user will be redirected to GitHub App details
              And user will see App Name as "pac-app123", App Link as "https://github.com/apps/pac-app123" and Secret as "pipelines-as-code-secret" in "openshift-pipelines" namespace


    @regression @odc-6461 @manual
    # Manual test case as pipeline 1.8 is not yet available
        Scenario Outline: Add a Git repository to pipeline as code using webhook url: P-11-TC14
            Given user has installed OpenShift Pipelines Operator version 1.8 with catalog source "<catalog_yaml>" and image content policy "<image_content_policy_yaml>"
              And user is at repositories page
             When user clicks on Create Repository button
              And user enters Git Repo URL of repository as "<repository_url>"
              And user enters Name of repository as "<repository_name>"
              And user enters personal access token in the git access token field
              And user clicks on Generate button under Webhook secret
              And user clicks on Add button
             Then user will be redirected to steps to configure Git repository page

        Examples:
                  | catalog_yaml                             | image_content_policy_yaml           | repository_url              | repository_name |
                  | testData/installPipelineOperator1.8.yaml | testData/imageContentPolicy1.8.yaml | https://github.com/testing/ | git-testing     |


        @regression @odc-6461 @manual
        Scenario Outline: Triggering a pipeline run in added Git repository to pipeline as code using webhook url: P-11-TC15
            Given user has installed OpenShift Pipelines Operator version 1.8 with catalog source "<catalog_yaml>" and image content policy "<image_content_policy_yaml>"
              And user has copied webhook url and webhook secret
              And user is on steps to configure Git repository page with its github repo
        # Follow scenario P-11-TC14 to be redirected to configure git repository steps
             When user clicks on Add webhook in repository Settings
              And user pastes the webhook url to Payload URL
              And user pastes webhook secret to Secret
        # Skip the next step if the testing cluster has SSL enabled
              And user disables SSL verification
              And user selects "Send me everything" option
              And user clicks on Add webhook button
              And user creates the ".tekton" directory in git repo to store you pipeline
              And user creates a new file called "push.yaml" in .tekton directory
              And user adds the code from step 2 of configure git repo page in "push.yaml"
              And user commits the changes
              And user pushes them to your Git repository
              And user clicks on close button configure Git repository page in console
              And user clicks on PipelineRuns tab in Repository details page
              And user commits a change in github repo
             Then user will see pipeline run created on the repository details page


        @regression @odc-6461 @manual
        Scenario Outline: Add a Git repository to pipeline as code using GitHub App: P-11-TC16
            Given user has installed OpenShift Pipelines Operator version 1.8 with catalog source "<catalog_yaml>" and image content policy "<image_content_policy_yaml>"
              And user has setted up GitHub App "pipelines-ci-clustername1"
        # Follow scenario P-11-TC13 to setup GitHub App
              And user is at repositories page
             When user clicks on Create Repository button
              And user enters Git Repo URL of repository as "<repository_url>"
              And user enters Name of repository as "<repository_name>"
              And user clicks "Use GitHub App"
              And user clicks on "https://github.com/apps/pipelines-ci-clustername1"
              And user clicks on Install button in github page
              And user selects location to install pipelines-ci-clustername1
              And user selects "Only select repositories" option
              And user selects repositories
              And user clicks on Install button
             Then user will see "pipelines-ci-clustername1" in the selected location
