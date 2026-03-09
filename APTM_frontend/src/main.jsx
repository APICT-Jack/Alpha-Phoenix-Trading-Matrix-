import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import './styles/Button.css'
import './styles/Hero.css'
import './styles/Card.css'
import './styles/Footer.css'
import './styles/PremiumBanner.css'
import './styles/FloatingAssistant.css'
import './styles/DetailsCardStyle.css'
import './styles/Features.css'
import './styles/ThemeToggle.css'
import './styles/Library.css'
import './styles/Tabs.css'
import './styles/Notifications.css'
import './styles/MarketTicker.css'

import './styles/Community.css'
import './styles/Logo.css'
// Add this to your main.jsx or at the top of App.jsx
import './styles/education/index.css';
import './styles/education/EducationPage.css';
import './styles/education/AcademyCard.css';
import './styles/education/SearchFilters.css';
import './styles/education/AcademyModal.css';
import './styles/education/TabContent.css';
import './styles/education/CommentSection.css';
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
