import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Library from './components/sections/Library';
import Community from './components/sections/Community';
import MarketTicker from './components/ui/MarketTicker';
import FloatingAssistant from './components/ui/FloatingAssistant';
import ThemeToggle from './components/ui/ThemeToggle';
import Footer from './components/layout/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider } from './context/AuthContext';
import { EducationProvider } from './context/EducationContext';
import Header from './components/layout/Header';
import SignupForm from './components/auth/SignupForm';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/Dashboard'; 
import UserProfileSettings from './components/profile/UserProfileSettings'; 
import UserProfileView from './components/profile/UserProfileView';
import ProtectedRoute from './components/ProtectedRoute'; 
import EducationPage from './pages/Education/EducationPage';
import AcademyDetailPage from './pages/Education/AcademyDetailPage';
import Chat from './components/chat/Chat'; // Import the Chat component

// Fallback component for missing pages
const PageNotFound = () => (
  <div style={{ padding: '2rem', textAlign: 'center' }}>
    <h2>Page Not Found</h2>
    <p>The page you're looking for doesn't exist.(solikhanda kungekudala)</p>
  </div>
);

// Separate component for conditional header that uses useLocation
const ConditionalHeader = () => {
  const location = useLocation();
  const isEducationRoute = location.pathname.startsWith('/education');
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/signup';
  const isProfileRoute = location.pathname.startsWith('/profile');
  const isDashboardRoute = location.pathname === '/dashboard';
  const isChatRoute = location.pathname.startsWith('/chat'); // Exclude chat routes from header
  
  // Show header on ALL routes except education, auth, profile, dashboard, and chat pages
  return !(isEducationRoute || isAuthRoute || isProfileRoute || isDashboardRoute || isChatRoute) ? <Header /> : null;
};

// Separate home page component
const HomePage = () => (
  <>
    <main className="main-content">
      <section id="hero">
        <Hero />
      </section>
      <Features />
     
      <section id="community">
        <Community />
      </section>
      <div className="floating-buttons">
        <ThemeToggle />
        
      </div>
    </main>
    <Footer />
  </>
);

// Layout component for pages that need full-width experience
const FullWidthLayout = ({ children }) => (
  <div className="full-width-layout">
    {children}
  </div>
);

// Chat Layout component (no header, full screen)
const ChatLayout = ({ children }) => (
  <div className="chat-layout">
    {children}
  </div>
);

function App() {
  return (
    <div className="app">
      <AuthProvider>
        <ThemeProvider>
          <EducationProvider>
            <Router>
              {/* Conditional Header - Now excludes profile, dashboard, and chat routes */}
              <ConditionalHeader />
              
              <Routes>
                {/* Public routes */}
                <Route path="/login" element={
                  <main className="main-content auth-page">
                    <LoginForm />
                  </main>
                } />
                <Route path="/signup" element={
                  <main className="main-content auth-page">
                    <SignupForm />
                  </main>
                } />
                
                {/* Main app route */}
                <Route path="/" element={<HomePage />} />
                
                {/* Education routes */}
                <Route path="/education" element={<EducationPage />} />
                <Route path="/education/academy/:academyId" element={<AcademyDetailPage />} />
                
                {/* Protected routes with full-width layout */}
                <Route path="/dashboard" element={
                  <ProtectedRoute>
                    <FullWidthLayout>
                      <Dashboard />
                    </FullWidthLayout>
                  </ProtectedRoute>
                } />
                
                {/* Profile Routes - Updated Structure with full-width layout */}
                <Route path="/profile/settings" element={
                  <ProtectedRoute>
                    <FullWidthLayout>
                      <UserProfileSettings />
                    </FullWidthLayout>
                  </ProtectedRoute>
                } />
                
                {/* Profile View Routes with full-width layout */}
                <Route path="/profile" element={
                  <ProtectedRoute>
                    <FullWidthLayout>
                      <UserProfileView />
                    </FullWidthLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/profile/:userId" element={
                  <ProtectedRoute>
                    <FullWidthLayout>
                      <UserProfileView />
                    </FullWidthLayout>
                  </ProtectedRoute>
                } />
                
                {/* Chat Routes - New chat functionality */}
                <Route path="/chat" element={
                  <ProtectedRoute>
                    <ChatLayout>
                      <Chat />
                    </ChatLayout>
                  </ProtectedRoute>
                } />
                
                <Route path="/chat/:chatId" element={
                  <ProtectedRoute>
                    <ChatLayout>
                      <Chat />
                    </ChatLayout>
                  </ProtectedRoute>
                } />
                
                {/* Chat room routes */}
                <Route path="/chat/room/:roomId" element={
                  <ProtectedRoute>
                    <ChatLayout>
                      <Chat />
                    </ChatLayout>
                  </ProtectedRoute>
                } />
                
                {/* 404 fallback */}
                <Route path="*" element={<PageNotFound />} />
              </Routes>
              
              
            </Router>
          </EducationProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;