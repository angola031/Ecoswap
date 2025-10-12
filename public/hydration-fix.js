// Script para suprimir errores de hidratación y ActionQueueContext
(function() {
  'use strict';
  
  // Suprimir errores específicos de React
  const originalConsoleError = console.error;
  const originalConsoleWarn = console.warn;
  
  const suppressedErrors = [
    'Missing ActionQueueContext',
    'Invariant: Missing ActionQueueContext',
    'useReducerWithReduxDevtoolsImpl',
    'An error occurred during hydration',
    'server HTML was replaced',
    'There was an error while hydrating',
    'Because the error happened outside of a Suspense boundary',
    'entire root will switch to client rendering',
    'Extra attributes from the server',
    'data-darkreader',
    'Warning: Extra attributes from the server: style,data-darkreader-inline-fill'
  ];
  
  console.error = function(...args) {
    const message = args.join(' ');
    const shouldSuppress = suppressedErrors.some(error => message.includes(error));
    
    if (!shouldSuppress) {
      originalConsoleError.apply(console, args);
    }
  };
  
  console.warn = function(...args) {
    const message = args.join(' ');
    const shouldSuppress = suppressedErrors.some(error => message.includes(error));
    
    if (!shouldSuppress) {
      originalConsoleWarn.apply(console, args);
    }
  };
  
  // Suprimir errores globales
  window.addEventListener('error', function(event) {
    const message = event.message || '';
    const shouldSuppress = suppressedErrors.some(error => message.includes(error));
    
    if (shouldSuppress) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
  // Suprimir errores de promesas no manejadas
  window.addEventListener('unhandledrejection', function(event) {
    const message = event.reason?.message || event.reason || '';
    const shouldSuppress = suppressedErrors.some(error => message.includes(error));
    
    if (shouldSuppress) {
      event.preventDefault();
      event.stopPropagation();
      return false;
    }
  });
  
})();
