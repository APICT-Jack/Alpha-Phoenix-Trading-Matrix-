// App.jsx - Complete Fixed Version
import React from 'react';
import { BrowserRouter as Router, Routes, Route, useLocation, Outlet } from 'react-router-dom';
import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Library from './components/sections/Library';
import Community from './components/sections/Community';
import MarketTicker from './components/ui/MarketTicker';
import FloatingAssistant from './components/ui/FloatingAssistant';
import ThemeToggle from './components/ui/ThemeToggle';
import Footer from './components/layout/Footer';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { EducationProvider } from './context/EducationContext';
import { ConnectionPanelProvider } from './context/ConnectionPanelContext';
import ConnectionPanelOverlay from './components/ConnectionPanelOverlay';
import Header from './components/layout/Header';
import SignupForm from './components/auth/SignupForm';
import LoginForm from './components/auth/LoginForm';
import Dashboard from './components/Dashboard';
import UserProfileSettings from './components/profile/UserProfileSettings';
import UserProfileView from './components/profile/UserProfileView';
import ProtectedRoute from './components/ProtectedRoute';
import EducationPage from './pages/Education/EducationPage';
import AcademyDetailPage from './pages/Education/AcademyDetailPage';
import Chat from './components/chat/Chat';
import AuthHomePage from './pages/AuthHomePage';

// ============================================
// PAGE NOT FOUND
// ============================================
const PageNotFound = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '2rem',
    textAlign: 'center',
    background: 'var(--bg-primary, #0a0a0a)',
  }}>
    <h1 style={{ fontSize: '6rem', margin: '0', opacity: 0.3 }}>404</h1>
    <h2 style={{ color: 'var(--color-text, #fff)' }}>Page Not Found</h2>
    <p style={{ color: 'var(--color-text-secondary, #999)', marginTop: '1rem' }}>
      The page you're looking for doesn't exist.
    </p>
    <button 
      onClick={() => window.location.href = '/'}
      style={{
        marginTop: '2rem',
        padding: '0.75rem 2rem',
        background: 'var(--color-primary, #007AFF)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
      }}
    >
      Go Back Home
    </button>
  </div>
);

// ============================================
// CONDITIONAL HEADER - Only shown on certain routes
// ============================================
const ConditionalHeader = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Routes where we HIDE the default Header
  const hideHeaderRoutes = [
    '/education',
    '/login',
    '/signup',
    '/profile',
    '/dashboard',
    '/chat',
  ];
  
  // Check if current path starts with any of the hide routes
  const shouldHideHeader = hideHeaderRoutes.some(route => path.startsWith(route));
  
  // Also hide on home page (both authenticated and unauthenticated handle their own headers)
  if (path === '/') return null;
  if (shouldHideHeader) return null;
  
  return <Header />;
};

// ============================================
// CONDITIONAL MARKET TICKER & FOOTER
// ============================================
const ConditionalExtras = () => {
  const location = useLocation();
  const path = location.pathname;
  
  // Routes where we HIDE MarketTicker and Footer
  const hideExtrasRoutes = [
    '/education',
    '/login',
    '/signup',
    '/profile',
    '/dashboard',
    '/chat',
  ];
  
  const shouldHideExtras = hideExtrasRoutes.some(route => path.startsWith(route));
  
  // Also hide on home page (AuthHomePage has its own layout)
  if (path === '/') return null;
  if (shouldHideExtras) return null;
  
  return (
    <>
      <MarketTicker />
      <Footer />
    </>
  );
};

// ============================================
// HOME PAGE WRAPPER - Conditionally renders based on auth
// ============================================
const HomePageWrapper = () => {
  const { isAuthenticated, user } = useAuth();
  
  // If authenticated, show AuthHomePage (has its own sticky header, bottom nav, etc.)
  if (isAuthenticated && user) {
    return <AuthHomePage />;
  }
  
  // Unauthenticated landing page
  return (
    <>
      <Header />
      <main className="main-content">
        <section id="hero">
          <Hero />
        </section>
        <Features />
        <Library />
        <section id="community">
          <Community />
        </section>
        <div className="floating-buttons">
          <ThemeToggle />
          <FloatingAssistant />
        </div>
      </main>
      <MarketTicker />
      <Footer />
    </>
  );
};

// ============================================
// LAYOUT COMPONENTS
// ============================================
const FullWidthLayout = ({ children }) => (
  <div className="full-width-layout" style={{ minHeight: '100vh' }}>
    {children}
  </div>
);

const ChatLayout = ({ children }) => (
  <div className="chat-layout" style={{ minHeight: '100vh', height: '100vh' }}>
    {children}
  </div>
);

// ============================================
// TOOLS PAGE (Coming Soon)
// ============================================
const ToolsPage = () => (
  <div style={{ 
    minHeight: '100vh', 
    display: 'flex', 
    alignItems: 'center', 
    justifyContent: 'center',
    flexDirection: 'column',
    padding: '2rem',
    textAlign: 'center',
    background: 'var(--bg-primary, #0a0a0a)',
  }}>
    <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>🔧</h1>
    <h2 style={{ color: 'var(--color-text, #fff)' }}>Advanced Tools Coming Soon</h2>
    <p style={{ color: 'var(--color-text-secondary, #999)', marginTop: '1rem' }}>
      We're building powerful tools to help you trade better. Stay tuned!
    </p>
    <button 
      onClick={() => window.history.back()}
      style={{
        marginTop: '2rem',
        padding: '0.75rem 2rem',
        background: 'var(--color-primary, #007AFF)',
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontWeight: '600',
        transition: 'all 0.3s ease'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)';
        e.target.style.boxShadow = '0 10px 25px rgba(41, 121, 255, 0.3)';
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)';
        e.target.style.boxShadow = 'none';
      }}
    >
      Go Back
    </button>
  </div>
);

// ============================================
// APP CONTENT (Inside Router so we can use useLocation)
// ============================================
const AppContent = () => {
  return (
    <>
      {/* Conditional Header - NOT shown on home, auth, profile, dashboard, chat, education */}
      <ConditionalHeader />
      
      <Routes>
        {/* =========== PUBLIC ROUTES =========== */}
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
        
        {/* =========== HOME ROUTE =========== */}
        <Route path="/" element={<HomePageWrapper />} />
        
        {/* =========== EDUCATION ROUTES =========== */}
        <Route path="/education" element={
          <FullWidthLayout>
            <EducationPage />
          </FullWidthLayout>
        } />
        
        <Route path="/education/academy/:academyId" element={
          <FullWidthLayout>
            <AcademyDetailPage />
          </FullWidthLayout>
        } />
        
        {/* =========== PROTECTED ROUTES =========== */}
        
        {/* Dashboard */}
        <Route path="/dashboard" element={
          <ProtectedRoute>
            <FullWidthLayout>
              <Dashboard />
            </FullWidthLayout>
          </ProtectedRoute>
        } />
        
        {/* Profile Settings */}
        <Route path="/profile/settings" element={
          <ProtectedRoute>
            <FullWidthLayout>
              <UserProfileSettings />
            </FullWidthLayout>
          </ProtectedRoute>
        } />
        
        {/* Profile View (own profile) */}
        <Route path="/profile" element={
          <ProtectedRoute>
            <FullWidthLayout>
              <UserProfileView />
            </FullWidthLayout>
          </ProtectedRoute>
        } />
        
        {/* Profile View (other user) */}
        <Route path="/profile/:userId" element={
          <FullWidthLayout>
            <UserProfileView />
          </FullWidthLayout>
        } />
        
        {/* Chat Main */}
        <Route path="/chat" element={
          <ProtectedRoute>
            <ChatLayout>
              <Chat />
            </ChatLayout>
          </ProtectedRoute>
        } />
        
        {/* Chat Direct Message */}
        <Route path="/chat/:chatId" element={
          <ProtectedRoute>
            <ChatLayout>
              <Chat />
            </ChatLayout>
          </ProtectedRoute>
        } />
        
        {/* Chat Room */}
        <Route path="/chat/room/:roomId" element={
          <ProtectedRoute>
            <ChatLayout>
              <Chat />
            </ChatLayout>
          </ProtectedRoute>
        } />
        
        {/* Create Post */}
        <Route path="/create-post" element={
          <ProtectedRoute>
            <FullWidthLayout>
              <div style={{ 
                minHeight: '100vh', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                padding: '2rem',
              }}>
                <p style={{ color: 'var(--text-secondary, #999)' }}>Create Post - Coming Soon</p>
              </div>
            </FullWidthLayout>
          </ProtectedRoute>
        } />
        
        {/* Single Post View */}
        <Route path="/post/:postId" element={
          <FullWidthLayout>
            <div style={{ 
              minHeight: '100vh', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              padding: '2rem',
            }}>
              <p style={{ color: 'var(--text-secondary, #999)' }}>Post View - Coming Soon</p>
            </div>
          </FullWidthLayout>
        } />
        
        {/* Tools Page */}
        <Route path="/tools" element={
          <ProtectedRoute>
            <ToolsPage />
          </ProtectedRoute>
        } />
        
        {/* Library Page */}
        <Route path="/library" element={
          <ProtectedRoute>
            <FullWidthLayout>
              <Library />
            </FullWidthLayout>
          </ProtectedRoute>
        } />
        
        {/* =========== 404 FALLBACK =========== */}
        <Route path="*" element={<PageNotFound />} />
      </Routes>
      
      {/* Conditional MarketTicker & Footer - NOT shown on home, auth, etc. */}
      <ConditionalExtras />
      
      {/* Connection Panel Overlay - Available everywhere */}
      <ConnectionPanelOverlay />
    </>
  );
};

// ============================================
// MAIN APP COMPONENT
// ============================================
function App() {
  return (
    <div className="app">
      <AuthProvider>
        <ThemeProvider>
          <EducationProvider>
            <ConnectionPanelProvider>
              <Router>
                <AppContent />
              </Router>
            </ConnectionPanelProvider>
          </EducationProvider>
        </ThemeProvider>
      </AuthProvider>
    </div>
  );
}

export default App;