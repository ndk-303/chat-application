import { BrowserRouter, Routes, Route, Navigate } from 'react-router';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import ChatPage from './pages/app/ChatPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />

        {/* App routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <ChatPage />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
