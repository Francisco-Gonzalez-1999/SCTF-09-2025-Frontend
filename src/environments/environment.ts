export const environment = {
  production: true,
  apiUrl: 'https://172.16.136.90:8211/api/',
  msal: {
    clientId: 'a23f820f-9edc-49ae-acd6-44c32aa407ab',
    authority: 'https://login.microsoftonline.com/9eaf4a76-636b-4097-95a1-35a97c469ea1',
    redirectUri: 'https://172.16.136.90:8210',
    scopes: ['api://a23f820f-9edc-49ae-acd6-44c32aa407ab/default']
  }
};
