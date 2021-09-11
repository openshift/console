@pipelines
Feature: Perform Actions on repository
              As a developer, I want to create, edit, delete and view the repositories

        Background:
            Given user has created or selected namespace "aut-pipelines"
              And user has installed pipelines as code


        @pre-condition @to-do
        Scenario Outline: Repositories page: P-11-TC01
            Given user is at repositories page
             When user clicks on Create Repository button
             Then user will be redirected to Repositories yaml view page
             Then user creates repository using YAML editor from "<repository_yaml>"
             Then user will be redirected to Reporsitory details page with header name "<repository_name>"

        Examples:
                  | repository_yaml                                 | repository_name |
                  | testData/repository-crd-testdata/test-repo.yaml | test-repo       |


        @smoke @to-do
        Scenario Outline: Reporsitory details display in repository page: P-11-TC02
            Given repository "<repository_name>" is present on Repositories page
             When user clicks on the repository "<repository_name>" on Repositories page
             Then user will be redirected to Repository details page with header "<repository_name>"
              And user is able to see Details, YAML, Pipeline Runs tabs
              And Details tab is displayed with field names Name, Namespace, Labels, Annotations, Created at, Owner, Repository, Branch and Event type
              And Actions dropdown display in the top right corner of the page

        Examples:
                  | repository_name |
                  | test-repo       |


        @smoke @to-do
        Scenario Outline: Repositories page display on newly created repository: P-11-TC03
            Given repository "<repository_name>" is present on Repositories page
             When user searches repositoy "<repository_name>" in repositories page
             Then repositories table displayed with column names Name, Event type, Last run, Task status, Last run status, Last run time, Last run duration
              And clolumn Name display with value "<repository_name>"
              And columnsLast run, Task status, Last run status, Last run time, Last run duration with values display "-"
              And Create button is enabled
              And kebab menu button is displayed
        Examples:
                  | repository_name |
                  | test-repo       |


        @smoke @to-do
        Scenario: Kebab menu options of newly created repository in Repositories page: P-11-TC04
            Given repository "test-repository" is present on Repositories page
             When user searches repository "test-repo" in repsitories page
              And user clicks on kebab menu of the repository "test-repo"
             Then kebab menu displays with options Edit labels, Edit annotations, Edit repository, Delete repository


        @smoke @to-do
        Scenario: Actions menu of newly created repository in Repository details page: P-11-TC05
            Given user is at repositories details page with newly created repository "test-repo"
             When user clicks Actions menu in the repository details page
             Then Actions menu display with options Edit labels, Edit annotations, Edit repository, Delete repository


        @regression @to-do
        Scenario Outline: Edit repository from Repository details page: P-11-TC06
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


        @regression @to-do
        Scenario: Edit label of repository: P-11-TC07
            Given repository "test-repo" is present on the Repositories page
             When user searches repository "test-repo" in repositories page
              And user clicks repository "test-repo" from searched results on Repositories page
              And user clicks on Edit button of the labels section
              And adds the label "check=label"
              And clicks on the Save button
             Then label "check=label" should be present in the labels section


        @regression @to-do
        Scenario: Edit annotations of repository: P-11-TC08
            Given repository "test-repo" is present on the Repositories page
             When user searches repository "test-repo" in repositories page
              And user clicks repository "test-repo" from searched results on Repositories page
              And user clicks on Edit button of the annotations section
              And user adds key "check" and value "annotations"
              And user clicks on the Save button
             Then annotation section contains the value "1 annotation"


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


        @regression @to-do
        Scenario Outline: Delete the repository from the Repository details page: P-11-TC11
            Given repository "<repository_name>" is present on Repositories page
             When user searches repository "<repository_name>" in repositories page
              And user clicks repository "<repository_name>" from searched results on Repositories page
              And user selects option "Delete Repository" from Actions menu drop down
              And user clicks Delete button on Delete Repository modal
             Then user will be redirected to Repositories page
              And "<repository_name>" is not displayed on Pipelines page

        Examples:
                  | repository_name |
                  | test-repo       |
