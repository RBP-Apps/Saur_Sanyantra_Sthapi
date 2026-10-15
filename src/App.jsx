import React, { Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';

import Loading from './components/Loading';

const KusumYojanaForm = lazy(() => import('./pages/KusumYojanaForm/KusumYojanaForm'));

const page = (Page) => (
  <Suspense fallback={<Loading />}>
    <Page />
  </Suspense>
);

function App() {
  return (
    <div className="bg-white min-h-screen">
      <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster position="top-center" toastOptions={{ duration: 3000 }} />
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={page(KusumYojanaForm)} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Router>
    </div>
  );
}

export default App;