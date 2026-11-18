import '@testing-library/jest-dom/vitest';

// jsdom no implementa estas APIs del navegador que usan los popovers, listas y animaciones de
// los componentes de la plantilla (filtros de la tabla, selectores, diálogos).
class ResizeObserverFalso {
  observe() {}
  unobserve() {}
  disconnect() {}
}
globalThis.ResizeObserver ??= ResizeObserverFalso;
Element.prototype.scrollIntoView ??= () => {};
Element.prototype.getAnimations ??= () => [];
