// src/components/layout/Footer.jsx
import React, { useState } from 'react';
import { FaTwitter, FaDiscord, FaYoutube, FaTelegram, FaInstagram, FaApple, FaGooglePlay, FaPaperPlane, FaPhoenixFramework } from 'react-icons/fa';
import Logo from '../ui/Logo';

const Footer = () => {
  const [email, setEmail] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log('Subscribed with:', email);
    setEmail('');
  };

  return (
    <footer className="main-footer">
      <div className="container">
        <div className="footer-grid">
          {/* Logo Column */}
          <div className="footer-col logo-col">
            <div className="footer-logo">
              <FaPhoenixFramework className="logo-icon" />
              <span>Alpha Phoenix</span>
            </div>
            <p className="footer-about">
              The next-gen trading ecosystem where education, tools, and community converge to create successful traders.
            </p>
            <div className="social-links">
              <a href="#" aria-label="Twitter"><FaTwitter /></a>
              <a href="#" aria-label="Discord"><FaDiscord /></a>
              <a href="#" aria-label="YouTube"><FaYoutube /></a>
              <a href="#" aria-label="Telegram"><FaTelegram /></a>
              <a href="#" aria-label="Instagram"><FaInstagram /></a>
            </div>
          </div>
          
          {/* Platform Links */}
          <div className="footer-col">
            <h4 className="footer-title">Platform</h4>
            <ul className="footer-links">
              <li><a href="#">Features</a></li>
              <li><a href="#">Pricing</a></li>
              <li><a href="#">Download</a></li>
              <li><a href="#">Status</a></li>
              <li><a href="#">Changelog</a></li>
              <li><a href="#">API</a></li>
            </ul>
          </div>
          
          {/* Resources Links */}
          <div className="footer-col">
            <h4 className="footer-title">Resources</h4>
            <ul className="footer-links">
              <li><a href="#">Trading Library</a></li>
              <li><a href="#">University</a></li>
              <li><a href="#">Blog</a></li>
              <li><a href="#">Help Center</a></li>
              <li><a href="#">API Docs</a></li>
              <li><a href="#">Research Papers</a></li>
            </ul>
          </div>
          
          {/* Company Links */}
          <div className="footer-col">
            <h4 className="footer-title">Company</h4>
            <ul className="footer-links">
              <li><a href="#">About Us</a></li>
              <li><a href="#">Careers</a></li>
              <li><a href="#">Legal</a></li>
              <li><a href="#">Contact</a></li>
              <li><a href="#">Press</a></li>
              <li><a href="#">Partners</a></li>
            </ul>
          </div>
          
          {/* Newsletter Column */}
          <div className="footer-col newsletter-col">
            <h4 className="footer-title">Stay Updated</h4>
            <p>Subscribe to our newsletter for market insights and platform updates</p>
            <form onSubmit={handleSubmit} className="newsletter-form">
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Your email address"
                required
              />
              <button type="submit" aria-label="Subscribe">
                <FaPaperPlane />
              </button>
            </form>
            <div className="app-download">
              <p>Get our mobile app:</p>
              <div className="app-buttons">
                <a href="#" className="app-btn" aria-label="Download on App Store">
                  <FaApple /> App Store
                </a>
                <a href="#" className="app-btn" aria-label="Download on Google Play">
                  <FaGooglePlay /> Google Play
                </a>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="copyright">
            &copy; {new Date().getFullYear()} Alpha Phoenix Trading Matrix. All rights reserved.
          </div>
          <div className="footer-legal">
            <a href="#">Terms of Service</a>
            <a href="#">Privacy Policy</a>
            <a href="#">Cookie Policy</a>
            <a href="#">Risk Disclosure</a>
            <a href="#">GDPR</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;