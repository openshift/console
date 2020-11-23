import Keycloak from 'keycloak-js';

const keycloak = new Keycloak({
    // TODO: 변수 처리
    realm: "tmax",
    url: "https://172.22.6.11/auth/",
    clientId: "hypercloud4",
});

keycloak.logout = keycloak.logout.bind(keycloak, { redirectUri: document.location.origin });

export default keycloak;
