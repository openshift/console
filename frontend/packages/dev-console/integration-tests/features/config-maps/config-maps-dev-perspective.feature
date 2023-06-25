@config-maps @dev-console
Feature: Config maps form view
              As a user, I need the ability to create and edit config-maps in dev perspective.


        Background:
            Given user is at developer perspective
              And user has created or selected namespace "aut-config-map"


        @smoke
        Scenario: Create config-maps using form view: CFM-01-TC01
            Given user is at ConfigMaps page
             When user clicks on Create ConfigMap
              And user enters name of config map as "test-config-map"
              And user enters key as "test-key"
              And user enters value as "test-value"
              And user clicks on Create button
             Then user can see "test-config-map" in ConfigMap details page


        @regression
        Scenario: Edit config-maps using form view: CFM-01-TC02
            Given user has created ConfigMap "test-config-map1"
              And user is at ConfigMaps page
             When user clicks on kebab menu of ConfigMap "test-config-map1"
              And user clicks on Edit ConfigMap
              And user clicks on add key-value
              And user enters new key as "key-test1"
              And user clicks on Save button
             Then user can see "test-config-map1" in ConfigMap details page
              And user can see "key-test1" under Data section
