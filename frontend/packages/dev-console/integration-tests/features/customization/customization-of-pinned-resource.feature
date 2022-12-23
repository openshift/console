@customize-pre-pinned-resources @odc-5012
Feature: Customization of pre-pinned resources
                Allows cluster admins to define pre-pinned resources for new users and users who have not customized their navigation items.

        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-pinned-resources"


        @regression
        Scenario: When navigates to cluster configuration page: DC-02-TC01
            Given user is at Consoles page
             When user navigates to Cluster configuration page
              And user clicks on Developer tab
             Then user should see Pre-pinned navigation items section
 
        @regression @manual
        Scenario: When pre-pinned resources customization is not added: DC-02-TC02
            Given user is at "operator.openshift.io/v1" console details page
              And user selects "Customize" in the Actions menu
              And user selects "Developer" tab in "Cluster configuration" page
             Then user should see default pins from extension under "Pinned Resources" in "Pre-pinned navigation items"

        @regression @manual
        Scenario: When resource is selected for pre-pinned navigation: DC-02-TC03
            Given user is at "operator.openshift.io/v1" console details page
              And user selects "Customize" in the Actions menu
              And user selects "Developer" tab in "Cluster configuration" page
             When user selects "Deployment" under "Resources" and added to "Pinned Resources"
             Then user should see "Deployment" resource details in "operator.openshift.io/v1" console YAML under spec.customization.perspectives.id.pinnedResources for id 'dev'
 
        @regression @manual
        Scenario: When resource is removed from pre-pinned navigation: DC-02-TC04
            Given user is at "operator.openshift.io/v1" console details page
              And user selects "Customize" in the Actions menu
              And user selects "Developer" tab in "Cluster configuration" page
             When user selects "Deployment" under "Pinned Resources" and moved back "Resources"
             Then user should not see "Deployment" resource details in "operator.openshift.io/v1" console YAML under spec.customization.perspectives.id.pinnedResources for id 'dev'
