@add-flow @dev-console @odc-6684
Feature: Export of application from the Add page
              As a user, I have an unmanaged application which I want to export. I'd like to be able to later add that code to git or some shared location so that I can share with others, or import into a new cluster or same cluster but different project, or be able to apply updates to an existing application.



        Background:
            Given user has installed Gitops primer Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-add-export-application"



        @regression
        Scenario: Export application option on the Add page: A-14-TC01
            Given user has created "nodejs-ex-git-1" workload in "nodejs-ex-git-app" application
             When user navigates to Add page
              And user clicks on Export Application option
              And user clicks on Ok button on Export Application modal to start the export
             Then user can see a toast message saying "Export of resources in aut-export-application has started."
              And user can see a toast message saying "All the resources are exported successfully from aut-export-application. Click below to download it." with download option and close button
              And user navigates to Topology page
              And user can see primer deployment created in topology
        
        
        @regression
        Scenario: Export Application modal when export application is in progress: A-14-TC02
            Given user is at Add page
             When user clicks on Export Application option
              And user clicks on Ok button on Export Application modal to start the export
              And user clicks on Export Application option again
             Then user can see "View logs" link, "Cancel Export", "Restart Export", and "Ok" button

