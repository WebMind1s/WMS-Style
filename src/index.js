// Import the createRoot function from react-dom/client module
import { createRoot } from 'react-dom/client';
// Import the Suspense component from React
import { Suspense } from 'react';
// Import the Loader component from @react-three/drei
import { Loader } from '@react-three/drei';
// Import the styles from the 'styles.css' file
import './styles.css';
// Import the App component from './App' module
import { App } from './App';
     
// Use the createRoot function to render content in the 'root' element
createRoot(document.getElementById('root')).render(
  <>
    {/* Wrap the App component with Suspense and provide a fallback */}
    <Suspense fallback={null}>
      <App />
    </Suspense>
    {/* Render the Loader component */}
    <Loader />
  </>,
);
