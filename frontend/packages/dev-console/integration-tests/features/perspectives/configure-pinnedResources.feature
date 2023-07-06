@perspective @dev-console
Feature: Configure pinned resources
              As a administrator, I want to configure the default pre-pinned resources for new users and users who have not customized their navigation items.


        Background:
            Given user is at developer perspective

        @regression @smoke @odc-5012
        Scenario: User has not configured the pre-pinned resources: CPR-01-TC01
             Then user will see "Secrets" and "ConfigMaps" pinned on the Developer Perspective navigation
 
        @regression @manual @odc-5012
        Scenario: Configuring pre-pinned resources: CPR-01-TC02
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user adds the "Add user perspectives" code snippet under spec.customization.perspectives
              And user removes the snippet for "id: admin"
              And user adds "pinnedResources" property for "id: dev"
              And user adds the "Add pinned resources" code snippet under spec.customization.perspectives
              And user clicks on Save button and refreshes the browser
             Then user will see "Deployments", "Secrets", "ConfigMaps", and "Pods" pinned on the Developer Perspective navigation

        @regression @manual @odc-5012
        Scenario: User customizing the pinned resources on the Developer perspective navigation: CPR-01-TC03
            Given user is at Developer perspective
             When user clicks on Search and selects "DeploymentConfigs" from the resources dropdown
              And user clicks on "Add to navigation"
             Then user will see "DeploymentConfigs", "Deployments", "Secrets", "ConfigMaps", and "Pods" on the Developer Perspective navigation

        @regression @manual @odc-5012
        Scenario: User removing the pinnedResources customization from the console config: CPR-01-TC04
            Given user is at cluster YAML of "operator.openshift.io/v1" console
             When user removes the pinnedResources customization for "id: dev"
              And user clicks on Save button and refreshes the browser
             Then user will see "DeploymentConfigs", "Deployments", "Secrets", "ConfigMaps", and "Pods" on the Developer Perspective navigation
