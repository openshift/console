@manual @topology @smoke
Feature: Perform actions on topology
    User will be able to create workloads and perform actions on topology page


        @pre-condition
        Scenario: Background steps
            Given user is at developer perspective
              And user has created or selected namespace "aut-topology-ci"


        Scenario: Empty state of topology: T-06-TC01
             When user navigates to Topology page
             Then user sees Topology page with message "No resources found"
              And user is able to see Start building your application, Add page links
              And Display options dropdown, Filter by resource and Find by name fields are disabled
              And switch view is disabled


        Scenario: Build the application from topology page
            Given user is at Topology Graph view
             When user clicks Start building your application
              And user enters ".NET" builder image in Quick Search bar
              And user clicks Create application on Quick Search Dialog
              And user enters Git Repo URL as "https://github.com/redhat-developer/s2i-dotnetcore-ex" in Create Source-to-Image Application
              And user enters Application Name as "dotnet-app"
              And user enters Name as "dotnet"
              And user selects "Deployment" in Resource type section
              And user clicks Create button on Create Source-to-Image Application page
             Then user is able to see workload "dotnet" in topology page


        Scenario Outline: Editing a workload: T-09-TC01
            Given user is at Topology Graph view
             When user right clicks on the workload "<workload_name>" to open the Context Menu
              And user clicks on "Edit <workload_name>" from context action menu
              And user edits application groupings to "<application_groupings>"
              And user saves the changes
             Then user can see application groupings updated to "<application_groupings>"

        Examples:
                  | workload_name | application_groupings |
                  | dotnet        | app                   |


        Scenario: Default state of Display dropdown: T-16-TC01
            Given user is at Topology Graph view
             When user clicks on the Display dropdown
             Then user will see the Expand is checked
              And user will see the Pod count is unchecked
              And user will see the Labels is checked


        Scenario: Deleting a workload through Action menu: T-15-TC01
            Given user is at Topology Graph view
             When user clicks on workload "dotnet"
              And user clicks on Action menu
              And user clicks "Delete Deployment" from action menu
              And user clicks on Delete button from modal
             Then user will see workload disappeared from topology