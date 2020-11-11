interface Scripts {
  name: string;
  src: string;
  innerText?: string;
}
export const ScriptStore: Scripts[] = [
  // Zendesk chat widget
  { name: 'zendesk', src: '../../assets/js/zendesk.js' },
  // Ethnio, current survey on: image groups, asset page
  { name: 'ethnio-survey', src: '//ethn.io/49301.js' },
  // Google API (Auth, Slides)
  { name: 'gapi', src: 'https://apis.google.com/js/api.js' }
];
