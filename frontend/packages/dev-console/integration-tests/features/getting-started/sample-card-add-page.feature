Feature: Create Sample Application
              As a user I want to create the Sample Application from +Add page

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-addflow-catalog"


        @regression
        Scenario: Sample Card in Add flow: GS-03-TC01
            Given user is at +Add page of Developer perspective
             When user will check for Samples card
              And user clicks on Samples card
             Then user is taken to Samples Page
              And user can see different sample applications
              And sample applications are based on the builder images

        @regression
        Scenario: Create node Sample Appliation: GS-03-TC02
            Given user is in Add flow of dev perspective
             When user clicks on Sample card
              And samples page opens
              And user selects a sample card
              And sample Application Creation form opens
             Then form is filled with default values
              And user will see the name section
              And user will see builder image version dropdown
              And user will see builder image below builder image version dropdown
              And user will see git url is ineditable field
              And user will see create and cancel button

        @regression
        Scenario: Create node Sample Appliation: GS-03-TC03
            Given user is in Add flow of dev perspective
             When user clicks on Sample card
              And samples page opens
              And user selects node card
              And sample Application Creation form opens
              And user can assign a name in the name section
              And user can change builder image version from dropdown if required
              And user clicks on create
             Then user is taken to topology with a node deployment workload created inside sample application


        @odc-22 @regression @to-do
        Scenario: Create Basic NodeJS Devfile Sample Appliation: GS-03-TC04
            Given user is at Samples page
             When user clicks on Basic NodeJS card
              And user assigns a name "node-js-basic-sample1" in the Name section of Import from Devfile form
              And user clicks on Create
             Then user is taken to Topology page with deployment workload "node-js-basic-sample1" created
