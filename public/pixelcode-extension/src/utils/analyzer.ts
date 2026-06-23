export function analyzeWebsite() {
  const data = {
    title: document.title,
    url: window.location.href,
    metaTags: Array.from(document.querySelectorAll('meta')).map(m => ({
      name: m.getAttribute('name') || m.getAttribute('property'),
      content: m.getAttribute('content')
    })).filter(m => m.name),
    headings: {
      h1: Array.from(document.querySelectorAll('h1')).map(h => h.innerText),
      h2: Array.from(document.querySelectorAll('h2')).map(h => h.innerText),
    },
    technologies: detectTechnologies(),
    visibleText: document.body.innerText.substring(0, 5000), // First 5000 chars
  };
  return data;
}

function detectTechnologies() {
  const tech = [];
  
  // Very basic detection
  if (document.querySelector('[data-reactroot], [data-reactid]')) tech.push('React');
  else if (window.React) tech.push('React');
  
  if (document.querySelector('#__next')) tech.push('Next.js');
  if (document.querySelector('#__nuxt')) tech.push('Nuxt.js');
  if (window.Vue || document.querySelector('[data-v-app]')) tech.push('Vue');
  if (document.querySelector('[class*="tw-"]')) tech.push('Tailwind CSS (Prefix)');
  
  // Check scripts for common libraries
  const scripts = Array.from(document.querySelectorAll('script'));
  if (scripts.some(s => s.src.includes('tailwindcss'))) tech.push('Tailwind CSS');
  if (scripts.some(s => s.src.includes('jquery'))) tech.push('jQuery');
  
  return tech;
}
