import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import Home from './pages/Home';
import ManualEntry from './pages/ManualEntry';
import Split from './pages/Split';
import HostDashboard from './pages/HostDashboard';
import GuestSplit from './pages/GuestSplit';      // Make sure this is imported
import GuestSettlement from './pages/GuestSettlement'; // Make sure this is imported

const AnimatedRoutes = () => {
  const location = useLocation();

  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<Home />} />
        <Route path="/manual" element={<ManualEntry />} />
        <Route path="/split" element={<Split />} />
        <Route path="/host/:id" element={<HostDashboard />} />
        <Route path="/bill/:id" element={<GuestSplit />} />       
        <Route path="/pay/:id" element={<GuestSettlement />} /> 
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