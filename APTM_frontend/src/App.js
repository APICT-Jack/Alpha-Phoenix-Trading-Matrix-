import Hero from './components/sections/Hero';
import Features from './components/sections/Features';
import Library from './components/sections/Library';
import Education from './components/sections/Education';
import Community from './components/sections/Community';
import MarketTicker from './components/ui/MarketTicker';
import FloatingAssistant from './components/ui/FloatingAssistant';
import ThemeToggle from './components/ui/ThemeToggle';
//import Testimonials from './components/sections/Testimonials';
import Footer from './components/layout/Footer';
import PremiumBanner from './components/layout/PremiumBanner';
import { ThemeProvider } from './context/ThemeContext';
//import TradingCard from './components/ui/TradingCard';
import { AuthProvider } from './context/AuthContext';
import Header from './components/layout/Header';
import {BrowserRouter, Routes, Route} from 'react-router-dom';
import SignupForm from './components/auth/SignupForm';
import LoginForm from './components/auth/LoginForm';
function App() {
  return (
    <div className="app">
      <AuthProvider> {/* Wrap everything that needs auth context */}
        <PremiumBanner />
        <ThemeProvider>
          <Header /> {/* Header is now within AuthProvider */}
          <main className="main-content">
            <Hero />
            <Features />
            <Library />
            <Education />
            <Community />
            <MarketTicker />
            <div className="floating-buttons">
              <ThemeToggle />
              <FloatingAssistant />
            </div>
          </main>
          <Footer />
        </ThemeProvider>
      </AuthProvider>
       <BrowserRouter>
        <Routes>
          <Route path='/components/auth/SignupForm' element={<SignupForm/>}>

          </Route>
        </Routes>
    </BrowserRouter>
    </div>
   
  );
}

export default App;