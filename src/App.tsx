import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import ManualEntry from './pages/ManualEntry';
import Split from './pages/Split';
import Settlement from './pages/Settlement';

// We need a separate component for the Routes so we can use the 'useLocation' hook
const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/manual" element={<ManualEntry />} />
        <Route path="/split" element={<Split />} />
        <Route path="/settle" element={<Settlement />} />
      </Routes>
    </AnimatePresence>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AnimatedRoutes />
    </BrowserRouter>
  )
}

export default App;