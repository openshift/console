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
             When user clicks on Create Repository button
              And user creates repository using YAML editor from "<repository_yaml>"
             Then user will be redirected to Repository details page with header name "<repository_name>"

        Examples:
                  | repository_yaml                                 | repository_name |
                  | testData/repository-crd-testdata/test-repo.yaml | test-repo       |


        @smoke
        Scenario Outline: Reporsitory details display in repository page: P-11-TC02
            Given repository "<repository_name>" is present in Repositories tab of Pipelines page
             When user clicks on the repository "<repository_name>" on Repositories page
             Then user will be redirected to Repository details page with header "<repository_name>"
              And user is able to see Details, YAML, Pipeline Runs tabs
              And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created at, Owner, Repository, Branch and Event type
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
        @regression @to-do
        Scenario Outline: Pipeline Run Details page for the repository: P-11-TC09
            Given pipeline run is displayed for "<repository_name>"
              And user is at the repositories page
             When user clicks Last Run value of repository "<repository_name>"
             Then user will be redirected to Pipeline Run Details page
              And user is able to see Details, YAML, TaskRuns, Logs and Events tabs
              And Details tab is displayed with fields Repository, Branch, Commit id and Event type
              And Actions dropdown display on the top right corner of the page

        Examples:
                  | repository_name |
                  | test-repo       |


        @regression @to-do
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
