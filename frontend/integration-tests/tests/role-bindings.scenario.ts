import { browser, ExpectedConditions as until, Key} from 'protractor';

import { appHost, testName, checkLogs, checkErrors } from '../protractor.conf';
import * as _ from 'lodash';
import { safeLoad, safeDump } from 'js-yaml';
import * as crudView from '../views/crud.view';
import * as roleBindingsView from '../views/role-bindings.view';
import * as yamlView from '../views/yaml.view';


describe('Role Bindings', () => {
  const BROWSER_TIMEOUT = 20000;
  const bindingName = `rb-${testName}`;
  const roleName = `role-${testName}`;
  const roleBindingsToDelete = [];
  const leakedResources = new Set<string>();
  const Subect = {
    user: 'User',
    group: 'Group',
    serviceAccount: 'Service Account',
  };
  const RoleType = {
    role: 'R',
    clusterRole: 'CR'
  };

  const createRole = async function (){
    await browser.get(`${appHost}/k8s/ns/${testName}/roles`);
    await crudView.isLoaded();
    await crudView.createYAMLButton.click();
    await yamlView.isLoaded();

    const content = await yamlView.editorContent.getText();
    const newContent = _.defaultsDeep({},
      { metadata: {name: roleName, labels: {['rb-test']: testName}}},
      safeLoad(content)
    );
    await yamlView.setContent(safeDump(newContent));
    expect(yamlView.editorContent.getText()).toContain(roleName);

    leakedResources.add(JSON.stringify({
      name: roleName,
      plural: 'role',
      namespace: testName})
    );
    await yamlView.saveButton.click();

    await browser.wait(until.presenceOf(crudView.actionsDropdown));
    expect(browser.getCurrentUrl()).toContain(`/${roleName}`);
    expect(crudView.resourceTitle.getText()).toEqual(roleName);
  };

  beforeAll( async() => {
    await createRole();
  });

  afterEach(() => {
    checkLogs();
    checkErrors();
  });

  const deleteRoleBinding = async function (roleBindingName: string){
    await browser.get(`${appHost}/k8s/cluster/rolebindings`);
    await crudView.isLoaded();
    await crudView.nameFilter.clear();
    await crudView.nameFilter.sendKeys(roleBindingName);
    await browser.wait(until.presenceOf(crudView.resourceRowNamesAndNs.first()), BROWSER_TIMEOUT);
    await crudView.selectOptionFromGear(roleBindingName, crudView.gearOptions.delete);
  };

  const createRoleBindingAndValidate = async function ( roleBindingName: string,
    namespace: string,
    role: string,
    roleType: string,
    subject: string,
    subjectName: string
  ) {
    let subjectYaml = 'kind: ';
    await browser.get(`${appHost}/k8s/cluster/rolebindings/new`);
    await browser.wait(until.textToBePresentInElement(roleBindingsView.crbTitleLbl, 'Create Role Binding'), BROWSER_TIMEOUT);
    await roleBindingsView.crbNameInp.sendKeys(roleBindingName);

    await roleBindingsView.crbNamespaceBtn.click().then(() => browser.actions().sendKeys(namespace, Key.ARROW_DOWN, Key.ENTER).perform());

    await roleBindingsView.crbRoleBtn.click();
    await browser.wait(until.presenceOf(roleBindingsView.crbRoleList.get(0)));
    const rbItem = await roleBindingsView.crbRoleList.filter(function(elem){
      return elem.getText().then( function(text){
        return text === `${roleType} ${role}`;
      });
    }).first();
    await rbItem.click();

    switch (subject) {
      case Subect.user: {
        await roleBindingsView.crbUserRad.click();
        subjectYaml = `${subjectYaml}User`;
        break;
      }
      case Subect.group: {
        await roleBindingsView.crbGroupRad.click();
        subjectYaml = `${subjectYaml}Group`;
        break;
      }
      case Subect.serviceAccount: {
        await roleBindingsView.crbServiceAccountRad.click();
        await browser.wait(until.presenceOf(roleBindingsView.crbSubjectNsBtn));
        await roleBindingsView.crbSubjectNsBtn.click().then(() => browser.actions().sendKeys(namespace, Key.ARROW_DOWN, Key.ENTER).perform());
        subjectYaml = `${subjectYaml}ServiceAccount`;
        break;
      }
      default: {
        throw new Error(`Invalid subject [${subject}]`);
      }
    }

    await roleBindingsView.crbSubjectNameInp.sendKeys(subjectName);
    await roleBindingsView.createBtn.click();

    await browser.wait(until.urlContains(`/k8s/ns/${testName}/rolebindings`));
    await crudView.isLoaded();
    expect(crudView.rowForName(roleBindingName).isPresent()).toBe(true);

    await browser.get(`${appHost}/k8s/ns/${testName}/rolebindings/${roleBindingName}/yaml`);
    await yamlView.isLoaded();
    expect(yamlView.editorContent.getText()).toContain(subjectYaml);
    expect(yamlView.editorContent.getText()).toContain(`name: ${role}`);
  };

  // Scenario: Add Role Binding for User to View role
  // Given I log in into the console if it's required
  //   And a namespace is created
  //  When I create a Role Binding for this namespace
  //   And I set the View role
  //   And I set the User subject
  //  Then I expect that role binding displayed on the list
  //   And I expect to see "kind: User" in it's YAML
  //   And I expect to see "name: view" in it's YAML
  it('Add Role Binding for User to View role', async() => {
    const roleBindingName = `${bindingName}-usr`;
    await createRoleBindingAndValidate(roleBindingName, testName, roleName, RoleType.role, Subect.user, 'user view');
    roleBindingsToDelete.push(roleBindingName);
  });

  // Scenario: Add Role Binding for Group to Edit role
  // Given I log in into the console if it's required
  //   And a namespace is created
  //  When I create a Role Binding for this namespace
  //   And I set the Edit role
  //   And I set the Group subject
  //  Then I expect that role binding displayed on the list
  //   And I expect to see "kind: Group" in it's YAML
  //   And I expect to see "name: view" in it's YAML
  it('Add Role Binding for Group to Edit role', async() => {
    const roleBindingName = `${bindingName}-group-edit`;
    await createRoleBindingAndValidate(roleBindingName, testName, 'edit', RoleType.clusterRole, Subect.user, 'group edit');
    roleBindingsToDelete.push(roleBindingName);
  });

  // Scenario: Add Role Binding for Service Account to View pod
  // Given I log in into the console if it's required
  //   And a namespace is created
  //  When I create a Role Binding for this namespace
  //   And I set the pod-viewer role
  //   And I set the Service Acconut subject
  //  Then I expect that role binding displayed on the list
  //   And I expect to see "kind: ServiceAccount" in it's YAML
  //   And I expect to see "name: pod-viewer" in it's YAML
  it('Add Role Binding for Service Account to View pod', async() => {
    const roleBindingName = `${bindingName}-sa-pw`;
    await createRoleBindingAndValidate(roleBindingName, testName, roleName, RoleType.role, Subect.serviceAccount, 'sa-pw');
    roleBindingsToDelete.push(roleBindingName);
  });

  it('Delete Role Bindings', async() => {
    for (let roleBinding of roleBindingsToDelete) {
      await deleteRoleBinding(roleBinding);
    }
  });
});
