(function() {
  'use strict';

  function initSwitcher(switcher) {
    const viewer = switcher.querySelector('model-viewer');
    if (!viewer || typeof viewer.getCameraOrbit !== 'function') {
      return;
    }

    let lastState = null;
    const threshold = 0.35;

    function updateState() {
      const orbit = viewer.getCameraOrbit();
      if (!orbit || typeof orbit.theta !== 'number') {
        return;
      }

      const theta = orbit.theta;
      let state = 'neutral';
      if (theta > threshold) {
        state = 'guardian';
      } else if (theta < -threshold) {
        state = 'lifesafer';
      }

      if (state !== lastState) {
        switcher.setAttribute('data-device-state', state);
        lastState = state;
      }
    }

    viewer.addEventListener('camera-change', updateState);
    viewer.addEventListener('load', updateState);
  }

  function initAll() {
    document.querySelectorAll('.device-switcher').forEach((switcher) => {
      if (!switcher.getAttribute('data-device-state')) {
        switcher.setAttribute('data-device-state', 'neutral');
      }
      initSwitcher(switcher);
    });
  }

  if (window.customElements && customElements.whenDefined) {
    customElements.whenDefined('model-viewer').then(initAll);
  } else {
    initAll();
  }
})();
