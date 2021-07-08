@helm
Feature: Actions on Helm release in topology page
        User will be able to open the context menu and side bar for the helm releases

        Background:
            Given user has created or selected namespace "aut-helm-topology"


        @smoke
        Scenario: Open Side Bar for the Helm release: HR-07-TC01
            Given helm release "nodejs-ex-k" is present in topology page
             When user clicks on the helm release "nodejs-ex-k"
             Then user will see the sidebar for the helm release
              And user will see the Details, Resources, Release notes tabs


        @regression
        Scenario: Deployment Configs link on the sidebar for the Helm Release: HR-07-TC02
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-ex-k"
             When user switches to the "Resources" tab
              And user clicks on the link for the "Deployment Configs" of helm release
             Then user is redirected to the "DeploymentConfig" Details page for the helm release


        @regression
        Scenario: Build Configs link on the sidebar for the Helm Release: HR-07-TC03
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-ex-k"
             When user switches to the "Resources" tab
              And user clicks on the link for the "Build Configs" of helm release
             Then user is redirected to the "BuildConfig" Details page for the helm release


        @regression
        Scenario: Services link on the sidebar for the Helm Release: HR-07-TC04
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-ex-k"
             When user switches to the "Resources" tab
              And user clicks on the link for the "Services" of helm release
             Then user is redirected to the "Service" Details page for the helm release


        @regression
        Scenario: Image Streams link on the sidebar for the Helm Release: HR-07-TC05
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-ex-k"
             When user switches to the "Resources" tab
              And user clicks on the link for the "Image Streams" of helm release
             Then user is redirected to the "ImageStream" Details page for the helm release


        @regression
        Scenario: Routes link on the sidebar for the Helm Release: HR-07-TC06
            Given user is at the Topology page
              And user is on the topology sidebar of the helm release "nodejs-ex-k"
             When user switches to the "Resources" tab
              And user clicks on the link for the "Routes" of helm release
             Then user is redirected to the "Route" Details page for the helm release
