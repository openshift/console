import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    realm: window.SERVER_FLAGS.KeycloakRealm,
    url: window.SERVER_FLAGS.KeycloakAuthURL,
    clientId: window.SERVER_FLAGS.KeycloakClientId,
});

keycloak.logout = keycloak.logout.bind(keycloak, { redirectUri: document.location.origin });

export default keycloak;
