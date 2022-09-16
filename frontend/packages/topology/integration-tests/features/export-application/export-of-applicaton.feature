@broken-test
# Gitops Primer Operator not installing correctly.
Feature: Export of application
              As a user, I have an unmanaged application which I want to export. I'd like to be able to later add that code to git or some shared location so that I can share with others, or import into a new cluster or same cluster but different project, or be able to apply updates to an existing application.



        Background:
            Given user has installed Gitops primer Operator
              And user is at developer perspective
              And user has created or selected namespace "aut-export-application"

        @regression @odc-6684
        Scenario: Export application button in topology: EA-02-TC01
            Given user has created "nodejs-ex-git-1" workload in "nodejs-ex-git-app" application
             When user clicks on Export Application button
              And user clicks on Ok button on Export Application modal to start the export
             Then user can see a toast message saying "Export of resources in aut-export-application has started."
              And user can see a toast message saying "All the resources are exported successfully from aut-export-application. Click below to download it." with download option and close button
              And user can see primer deployment created in topology


        @regression @odc-6296
        Scenario: Export Application modal when export application is in progress: EA-02-TC02
            Given user has created "nodejs-ex-git-2" workload in "nodejs-ex-git-app" application
             When user clicks on Export Application button
              And user clicks on Ok button on Export Application modal to start the export
              And user clicks on Export Application button again
             Then user can see "View logs" link, "Cancel Export", "Restart Export", and "Ok" button



        @regression @odc-6684
        Scenario: Restart Export when export application is in progress: EA-02-TC03
            Given user is at Topology page
             When user clicks on Export Application button
              And user clicks on Ok button on Export Application modal to start the export
              And user clicks on Export Application button again
              And user clicks on Restart button
             Then user can see a toast message saying "Export of resources in aut-export-application has started."
              And user can see a toast message saying "All the resources are exported successfully from aut-export-application. Click below to download it." with download option and close button


        @regression @odc-6684
        Scenario: Cancel Export when export application is in progress: EA-02-TC04
            Given user is at Topology page
             When user clicks on Export Application button
              And user clicks on Ok button on Export Application modal to start the export
              And user clicks on Export Application button again
              And user clicks on Cancel button
             Then user can see primer job gets deleted in topology


        @regression @odc-6296
        Scenario: Export application button in empty topology view: EA-02-TC05
            Given user has created or selected namespace "aut-export-application-temp"
             When user navigates to Topology page
             Then user can see Export Application button disabled


        @regression @manual @odc-6296
        Scenario: View logs when export application is in progress: EA-02-TC06
            Given user is at Topology page
             When user clicks on Export Application button
              And user clicks on Ok button on Export Application modal to start the export
              And user clicks on Export Application button
              And user clicks on View logs button on Export Application modal
             Then user can see page showing the Pod log tab

        @regression @manual @odc-6296
        Scenario: Download the exported application: EA-02-TC07
            Given user is at Topology page
              And Export Application is completed
              And user clicks on download button from the toast message
              And user clicks on "Log in with openshift" on the primer linked
              And user clicks on "Allow selected permissions" on Authorize page
             Then user can see a zip file is downloaded having the required file
