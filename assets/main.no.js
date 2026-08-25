import { Site, render } from './site.no.js';

class App extends Site {
  constructor(rootEl) {
    super();
    this.root = rootEl;
    this.vals = null;
    this.root.addEventListener('click', (e) => {
      const el = e.target.closest('[data-bind]');
      if (!el) return;
      const path = el.getAttribute('data-bind');
      if (!path) return;
      const fn = path.split('.').reduce((o, k) => (o && o[k] !== undefined ? o[k] : undefined), this.vals);
      if (typeof fn === 'function') fn();
    });
    this.mount();
  }
  setState(partial) {
    this.state = Object.assign({}, this.state, partial);
    this.mount();
  }
  mount() {
    this.vals = this.renderVals();
    this.root.innerHTML = render(this.vals);
  }
}

new App(document.getElementById('app'));
