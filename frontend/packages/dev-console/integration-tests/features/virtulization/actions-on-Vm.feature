Feature: Perform Actions on created VM
    As a user, I should be able to perform Actions on imported VM


Background:
    Given user is at developer perspecitve
    And user has selected namespace "aut-vm-actions"
    And user has created VM
    And user is at the Topolgy page


@regression
Scenario: Sidebar for VM: VM-03
    When user clicks on the VM to open the sidebar
    Then user can see the Details tab
    And user can see the Resources tab
    And user can see the Actions dropdown


@regression
Scenario: Edit Application Groupings action on VM: VM-04-TC02
    When user right clicks on the VM to open the context menu
    And user clicks on the Edit Application Groupings
    And user will click on the Application dropdown on the modal
    And user selects the Application
    And user clicks on Save button
    Then user will see the changed Application Groupings of VM


@regression
Scenario: Edit Application Groupings to no application group on VM: VM-04-TC02
    When user right clicks on the VM to open the context menu
    And user clicks on the Edit Application Groupings
    And user will click on the Application dropdown on the modal
    And user selects the no application group item
    And user clicks on Save button
    Then user will see that VM does not belong to an application group


@regression
Scenario: Start VM action on VM: VM-04-TC03
    When user right clicks on the VM to open the context menu
    And user clicks on the Start VM
    Then user will see Stop VM, Restart VM, Migrate VM items in context menu


@regression
Scenario: Clone VM action on VM: VM-04-TC04
    When user right clicks on the VM to open the context menu
    And user clicks on the Clone VM
    And user enters name of VM on modal
    And user selects the namespace
    And user clicks on the Clone Virtual Machine button
    Then user will be redirected to that namespace
    And user will see that the VM is cloned in the namespace


@regression
Scenario: Edit CD-ROMs action on VM: VM-04-TC05
    When user right clicks on the VM to open the context menu
    And user clicks on the Edit CD-ROMs
    Then user will see a modal to edit the CD-ROMs


@regression
Scenario: Edit Labels action on VM: VM-04-TC06
    When user right clicks on the VM to open the context menu
    And user clicks on the Edit Labels
    And user adds the label
    And user clicks on the Save button on the modal to save labels and close the modal
    And user right clicks on the VM to open the context menu
    And user clicks on the Edit Labels
    Then user will see the newly added label


@regression
Scenario: Edit Annotations action on VM: VM-04-TC07
    When user right clicks on the VM to open the context menu
    And user clicks on the Edit Annotations
    And user adds the annotations
    And user clicks on the Save button on the modal to save annotation and close the modal
    And user right clicks on the VM to open the context menu
    And user clicks on the Edit Annotations
    Then user will see the newly added annotation


@regression
Scenario: Delete VM action on VM: VM-04-TC08
    When user right clicks on the VM to open the context menu
    And user clicks on the Delete VM
    And user clicks on the Delete button on the modal
    Then VM will get deleted
