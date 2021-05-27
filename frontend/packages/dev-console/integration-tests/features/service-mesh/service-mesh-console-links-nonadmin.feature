Feature: non-Admin user created Service Mesh Control Plane to get the Kiali dashboard link on the Topology filterbar
As an non-Admin user I want to launch Kiali from the Topology graph


  Background:
      Given user has logged in as consoledeveloper
      And user is at Developer perspective
      And user has created Service Mesh Control Plane in "istio-system" namespace
      And user has verified that Kiali has been deployed in Service Mesh Control Plane in "istio-system" namespace
      And user has created a user with self-provisioner and view roles

  @regression
  Scenario: Open on Kiali link Project Details Overview Page
      Given user is on the "istio-system" Projects page
      When user selects the "istio-system" project that recently created Open Shift Service Mesh Control Plane
      Then user will see the Service Mesh Enabled inside Details card
      And user will see Open on Kiali link inside Launcher card
      And user clicks on Kiali Link inside Launcher Card


  @regression
  Scenario: Open on Kiali link Project Details Page
      Given user is on the "istio-system" Projects page
      When user selects "istio-system" project that recently created Open Shift Service Mesh Control Plane
      And user clicks on the Details page
      Then user will see the Service Mesh Enabled
      And user will see the Launcher section
      And user will see Kiali link inside Launcher section
      And user clicks on Kiali Link inside Launcher section


  @regression
  Scenario: Kiali link in the Topology filterbar
      Given user is at Developer perspective
      When user clicks on the Topology page
      And user selects project that recently created Open Shift Service Mesh Control Plane
      Then user will see Kiali link in the Topology filterbar
      And user clicks on Kiali Link in the Topology filterbar

  @regression
  Scenario: Kiali link on the Kiali node in the Topology
      Given user is at Developer perspective
      When user clicks on the Topology page
      And user selects project that recently created Open Shift Service Mesh Control Plane
      Then user will see Kiali node in the Topology
      And user clicks on Kiali Open URL Link in the Kiali node
