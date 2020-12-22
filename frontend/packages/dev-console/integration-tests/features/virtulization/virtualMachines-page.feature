Feature: Virtual Machines page
    As a user, I should be able visit Vitual Machines page


    Background:
        Given user has installed OpenShift Virtualization Operator
        And user has created the OpenShift Virtualization Deployment
        And user has created the HostPathProvisioner Deployment
        And user is at developer perspective
        And user has selected namespace "aut-virtualization"
        

    @regression, @smoke, @cnv
    Scenario: Virtual Machines Card on +Add page: VM-01-TC03
        Given user is at Add page
        Then user will see Virtual Machines Card on Add page

    
    @smoke, @cnv
    Scenario: Virtual Machines on Developer Catalog page
        Given user is at Developer Catalog page
        Then user will see Virtual Machines type
    

    @smoke, @cnv
    Scenario: Virtual Machines page - Empty View
        Given user is at Developer Catalog page
        When user clicks on Virtual Machines type
        Then user will see "No Catalog items found"

    
    @smoke, @cnv
    Scenario: Virtual Machines page - with Template view
        Given user is at Add page
        And user has created Virtual Machine Template
        When user clicks on Virtual Machines Card
        Then user will see Virtual Machine Template
        And And user will see Filter by Keyword field
        And user will see A-Z, Z-A sort by dropdown
