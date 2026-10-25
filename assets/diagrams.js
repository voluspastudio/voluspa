/* Mermaid diagrams, drawn in the VP Studio style */
(function () {
  if (!window.mermaid) return;
  var accent = getComputedStyle(document.body).getPropertyValue('--accent').trim() || '#E8601C';
  window.mermaid.initialize({
    startOnLoad: true,
    theme: 'base',
    securityLevel: 'strict',
    fontFamily: 'Archivo, Helvetica Neue, Arial, sans-serif',
    themeVariables: {
      background: '#F7F6F3', primaryColor: '#F7F6F3', primaryBorderColor: '#111111', primaryTextColor: '#111111',
      secondaryColor: '#E7E3DA', tertiaryColor: '#F7F6F3', lineColor: '#111111', textColor: '#111111',
      clusterBkg: '#F7F6F3', clusterBorder: '#111111', edgeLabelBackground: '#F7F6F3',
      fontSize: '15px', noteBkgColor: '#F7F6F3', noteBorderColor: accent, activationBorderColor: accent
    }
  });
})();
