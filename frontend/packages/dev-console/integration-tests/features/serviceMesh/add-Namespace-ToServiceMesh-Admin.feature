@serviceMesh
Feature: Associate Kiali Dashboard to Topology filterbar by adding a namespace to the Service Mesh by Admin user
    User should be able to add a namespace to Service Mesh to get the Kiali dashboard link for that namespace on the Topology filterbar


    Background:
        Given user has logged in as kubeadmin
        And user is at Administrator perspective
        And user has installed ElasticSearch Operator provided by Red Hat
        And user has installed Jaeger Operator provided by Red Hat
        And user has installed Kiali Operator provided by Red Hat
        And user has installed OpenShift Service Mesh Operator provided by Red Hat
        And user has created new project "istio-system"
        And user has created Service Mesh Control Plane instance in "istio-system" namespace


    @regression
    Scenario: Open on Kiali link Project Details Overview Page
        Given user is on the Projects page
        When user selects project that recently created Open Shift Service Mesh Control Plane
        Then user will see the Service Mesh Enabled inside Details card
        And user will see the Launcher card
        And user will see Open on Kiali link inside Launcher card


    @regression
    Scenario: Open on Kiali link Project Details Page
        Given user is on the Projects page
        When user selects project that recently created Open Shift Service Mesh Control Plane
        And user clicks on the Details page
        Then user will see the Service Mesh Enabled
        And user will see the Launcher section
        And user will see Kiali link inside Launcher section


    @regression
    Scenario: Kiali link in the Topology filterbar
        Given user is at Developer perspective
        And user selects project that recently created Open Shift Service Mesh Control Plane
        When user clicks on the Topology page
        Then user will see Kiali link in the Topology filterbar


    @regression
    Scenario: Click on Kiali link from Kubeadmin
        Given user is at Developer perspective
        And user selects project that recently created Open Shift Service Mesh Control Plane
        When user clicks on the Topology page
        And user click on Kiali Dashboard link
        And user proceeds to unsafe link
        And user clicks on Log In With OpenShift button
        And user enters the credentials for kubeadmin
        And user clicks on Log In button
        Then user will see the Kiali Dashboard for that namespace
