import * as _ from 'lodash-es';
import * as React from 'react';

import {
  ModalBody,
  ModalComponentProps,
  ModalSubmitFooter,
  ModalTitle,
  createModalLauncher,
} from '../../factory/modal';
import { HandlePromiseProps, withHandlePromise, Loading } from '../../utils';
import { Section } from '../utils/section';
import { RadioGroup } from '@console/internal/components/radio';
import { Select, SelectOption, SelectVariant } from '@patternfly/react-core';
import { coFetchJSON } from '../../../co-fetch';
import { getId, getUserGroup } from '../../../hypercloud/auth';
import { UsersIcon, TimesIcon } from '@patternfly/react-icons';
import { useTranslation } from 'react-i18next';
import { TFunction } from 'i18next';

const radioItems = (t?: TFunction) => [
  {
    title: t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_RADIOBUTTON_1'),
    value: 'user'
  },
  {
    title: t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_RADIOBUTTON_2'),
    value: 'group'
  },
];

const roleItems = (t?: TFunction) => [
  {
    title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_RADIOBUTTON_1'),
    value: 'admin',
  },
  {
    title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_RADIOBUTTON_2'),
    value: 'developer',
  },
  {
    title: t('COMMON:MSG_DETAILS_TABACCESSPERMISSIONS_RADIOBUTTON_3'),
    value: 'guest'
  },
];

const getRowMemberData = (members) => (
  members.map(member => Array.isArray(member) ? { email: member[0], name: member[1] } : { name: member })
);

export const InviteMemberModal = withHandlePromise((props: InviteMemberModalProps) => {
  const [type, setType] = React.useState('user');
  const [role, setRole] = React.useState('admin');
  const [errorMsg, setError] = React.useState('');
  const [memberList, setMemberList] = React.useState(null);
  const [selectedMember, setMember] = React.useState({name:'', email:''});
  const [isExpanded, setExpanded] = React.useState(false);
  const [isDisabled, setDisabled] = React.useState(false);
  const [searchKey, setSearchKey] = React.useState('');

  const members = _.map(props.existMembers, (value, key) => key);
  const groups = _.map(props.existGroups, (value, key) => key);
  const membersUrl = members.reduce((acc, curr) => acc + `&except=${curr}`, `${window.SERVER_FLAGS.KeycloakAuthURL}realms/${window.SERVER_FLAGS.KeycloakRealm}/user/list?`)
  const groupsUrl = groups.reduce((acc, curr) => acc + `&except=${curr}`, `${window.SERVER_FLAGS.KeycloakAuthURL}realms/${window.SERVER_FLAGS.KeycloakRealm}/group/list?exceptDefault=true`)

  React.useEffect(() => {
    const url = type === 'user' ? membersUrl : groupsUrl
    coFetchJSON(url)
      .then((res) => {
        let formattedMembers = getRowMemberData(res);
        setMemberList(formattedMembers);
      })
      .catch((err) => {
        setError(`Fail to get member list. ` + err);
      });
  }, [type]);

  const onToggle = (isExpanded) => {
    if (!isDisabled) setExpanded(isExpanded);
  }

  const onSelect = (event, selection, isPlaceholder) => {
    if (isPlaceholder) clearSelection();
    else {
      setMember(JSON.parse(selection));
      setExpanded(false);
      setDisabled(true);
    }
  };

  const clearSelection = () => {
    setMember({name:'', email:''});
    setDisabled(false);
  };

  const customFilter = (e) => {
    const url = type === 'user' ? membersUrl : groupsUrl
    setMemberList(null);
    setSearchKey(e.target.value);
    coFetchJSON(`${url}&startsWith=${e.target.value}`)
      .then((res) => {
        setMemberList(getRowMemberData(res));
      })
      .catch((err) => {
        setError(`Fail to get member list. ` + err);
      });
    return [];
  };

  const submit: React.FormEventHandler<HTMLFormElement> = (e) => {
    e.preventDefault();
    // Append to an existing array, but handle the special case when the array is null.
    coFetchJSON(`/api/multi-hypercloud/cluster/${props.clusterName}/member_invitation/${type}/${type === 'user' ? selectedMember.email : selectedMember.name}?userId=${getId()}${getUserGroup()}&remoteRole=${role}&memberName=chosangwon`, 'POST')
      .then((res) => {
        props.close();
      })
      .catch((err) => {
        clearSelection();
        setError(err);
      });
  };

  const { t } = useTranslation();
  return (
    <form onSubmit={submit} name='form' className='modal-content '>
      <ModalTitle>{t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_TITLE_1')}</ModalTitle>
      <ModalBody unsetOverflow={true}>
        <Section id='user'>
          <div className='hc-invite-modal__input-members'>
            <RadioGroup
              id='type'
              currentValue={type}
              items={radioItems.bind(null, t)()}
              onChange={({ currentTarget }) => { setType(currentTarget.value); clearSelection() }}
              inline
            />
            <div className='hc-invite-modal__members'>
              {isDisabled ?
                <div className='hc-invite-modal__selectedMember'>
                  <span className='hc-invite-modal__selectedMember__name'>{type === 'group' && <UsersIcon className='hc-member__group-icon' />}{selectedMember.name}<TimesIcon onClick={clearSelection} className='hc-member__close-icon' /></span>
                  <span className='hc-invite-modal__selectedMember__email'>{selectedMember.email}</span>
                </div> :
                <Select
                  variant={SelectVariant.typeahead}
                  ariaLabelTypeAhead='Select a state'
                  onToggle={onToggle}
                  onSelect={onSelect}
                  onClear={clearSelection}
                  onFilter={customFilter}
                  selections={type === 'user' ? selectedMember.email : selectedMember.name}
                  isExpanded={isExpanded}
                  ariaLabelledBy='typeahead-select'
                  placeholderText='Select a state'
                  className='hc-invite-modal__search-list'
                  noResultsFoundText={t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_SEARCHBAR_2', { 0: '' })}
                >
                  {memberList ?
                    memberList.length > 0 ?
                      memberList.map((member, index) => {
                        const key = type === 'user' ? member.email : member.name
                        return <SelectOption id={key} value={JSON.stringify(member)}>
                          <div className='hc-invite-modal__member-item'>
                            <span>{type === 'group' && <UsersIcon className='hc-member__group-icon' />}{member.name}</span>
                            <span>{member.email}</span>
                          </div>
                        </SelectOption>
                      })
                      : <div>{t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_SEARCHBAR_2', { 0: searchKey })}</div>
                    : <Loading />}
                </Select>}
            </div>
            <div>
              {type === 'user' ? t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_SUBMESSAGE_1') : t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_SUBMESSAGE_2')}
            </div>
          </div>
        </Section>
        <Section label={t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_LABEL_1')} id='role' isRequired={true}>
          <RadioGroup
            id='role'
            currentValue={role}
            items={roleItems.bind(null, t)()}
            onChange={({ currentTarget }) => setRole(currentTarget.value)}
          />
        </Section>
      </ModalBody>
      <ModalSubmitFooter
        errorMessage={errorMsg}
        inProgress={props.inProgress}
        submitText={t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_BUTTON_3')}
        cancelText={t('MULTI:MSG_MULTI_CLUSTERS_INVITEPEOPLEPOPUP_BUTTON_2')}
        cancel={props.cancel}
      />
    </form>
  );
});

export const inviteMemberModal = createModalLauncher(InviteMemberModal);

export type InviteMemberModalProps = {
  clusterName: string;
  type: string;
  existMembers: string[];
  existGroups: string[];
} & ModalComponentProps &
  HandlePromiseProps;
