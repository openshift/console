@helm
Feature: Feature flag for Helm
              As a user, I want to disable helm specific navigation items from console if there are no helm repositories configured in the console.


        Background:
            Given user has created or selected namespace "aut-helm-feature-flag"


        @regression @manual
        Scenario: Disable helm features in console: HR-03-TC01
            Given user is at Helm Chart Repositories page
              And user can see only the default "redhat-helm-repo" CR is available
             When user opens "redhat-helm-repo" CR
              And user goes to YAML tab
              And user adds "disabled: true" flag under "spec"
              And user clicks on Save
             Then user is not able to see the Helm tab in the navigation menu
              And user can not see Helm Chart card in Add page
              And user can not see Helm Charts filter in the Developer Catalog page


        @regression @manual
        Scenario: Enable the disabled helm features in console: HR-03-TC02
            Given user has disabled helm features
              And the default "redhat-helm-repo" Helm Chart Repositories CR is available
             When user opens "redhat-helm-repo" CR
              And user goes to YAML tab
              And user removes "disabled: true" flag under "spec"
              And user clicks on Save
             Then user is able to see the Helm tab in the navigation menu
              And user can see Helm Chart card in Add page
              And user can see Helm Charts filter in the Developer Catalog page
