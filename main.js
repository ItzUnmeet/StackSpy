(function () {
  function findInShadowRoots(selector, root = document) {
    const results = [];
    if (root.querySelectorAll) {
      results.push(...root.querySelectorAll(selector));
    }
    const shadowHosts = root.querySelectorAll('*');
    shadowHosts.forEach(el => {
      if (el.shadowRoot) {
        results.push(...findInShadowRoots(selector, el.shadowRoot));
      }
    });
    return results;
  }

  function detectPlatform() {
    const html = document.documentElement.innerHTML;
    const scripts = Array.from(document.scripts);
    
    const localScripts = scripts
      .filter(s => !s.src || s.src.startsWith(location.origin) || s.src.startsWith('/') || s.src.includes(location.hostname))
      .map(s => s.src || '')
      .join('\n');
    
    const externalScripts = scripts
      .filter(s => s.src && !s.src.includes(location.hostname))
      .map(s => s.src)
      .join('\n');

    const primary = new Set();
    const secondary = new Set();

    // CMS
    if (html.includes('wp-content') || html.includes('wp-includes') || localScripts.includes('wp-')) {
      primary.add('CMS: WordPress');
    }
    if (html.includes('index.php?option=com_')) {
      primary.add('CMS: Joomla');
    }
    if (html.includes('sites/default/files')) {
      primary.add('CMS: Drupal');
    }

    // React / Next.js
    const isNext = !!document.getElementById('__next') || html.includes('__NEXT_DATA__') || !!window.__NEXT_DATA__;
    const isReact = !!document.getElementById('root') || localScripts.includes('react') || html.includes('React');
    const reactViaExternal = externalScripts.includes('react');
    const reactInShadow = findInShadowRoots('#root, [id="root"], #__next, [id="__next"]').length > 0;

    if (isNext || reactInShadow) {
      primary.add('Framework: Next.js (React + SSR)');
    } else if (isReact) {
      primary.add('JS Framework: React');
    } else if (reactViaExternal) {
      secondary.add('Possible 3rd-party React library');
    }

    // Angular
    const isAngular = html.includes('ng-version') || html.includes('app-root') || localScripts.includes('angular') || document.querySelector('[ng-version]') || findInShadowRoots('[ng-version]').length > 0;
    if (isAngular) {
      primary.add('JS Framework: Angular');
    } else if (externalScripts.includes('angular')) {
      secondary.add('Possible 3rd-party Angular script');
    }

    // Vue / Nuxt
    const isVue = localScripts.includes('vue') || html.includes('data-v-') || document.querySelector('[data-v-app]') || findInShadowRoots('[data-v-app]').length > 0;
    const isNuxt = html.includes('__NUXT__') || localScripts.includes('nuxt');
    if (isNuxt) {
      primary.add('Framework: Nuxt.js (Vue + SSR)');
    } else if (isVue) {
      primary.add('JS Framework: Vue.js');
    } else if (externalScripts.includes('vue')) {
      secondary.add('Possible 3rd-party Vue component');
    }

    // Svelte
    const isSvelte = localScripts.includes('svelte') || html.includes('data-svelte-h') || findInShadowRoots('[data-svelte-h]').length > 0;
    if (isSvelte) {
      primary.add('JS Framework: Svelte');
    } else if (externalScripts.includes('svelte')) {
      secondary.add('Possible 3rd-party Svelte widget');
    }

    // React DevTools Hook detection
    if (window.__REACT_DEVTOOLS_GLOBAL_HOOK__) {
      primary.add('React detected via React DevTools hook');
    }

    const isSPA = !!document.querySelector('#root, #__next, #app, app-root') ||
      localScripts.includes('chunk') || localScripts.includes('bundle');

    if (primary.size === 0 && secondary.size === 0) {
      primary.add(isSPA ? 'Likely JavaScript SPA (unidentified)' : 'Likely CMS/static site (unidentified)');
    }

    const result = {
      primary: Array.from(primary),
      secondary: Array.from(secondary),
      note: isSPA
        ? 'This site dynamically renders content (SPA behavior).'
        : 'This site appears to be server-rendered or static.'
    };

    console.log('Primary Technology Detected:');
    result.primary.forEach(f => console.log('→ ' + f));
    if (result.secondary.length) {
      console.log('Secondary (3rd-party) Libraries:');
      result.secondary.forEach(f => console.log('→ ' + f));
    }
    console.log(result.note);

    return result;
  }

  // Optional: run after delay for dynamic sites (uncomment if needed)
  // setTimeout(() => detectPlatform(), 5000);

  return detectPlatform();
})();
