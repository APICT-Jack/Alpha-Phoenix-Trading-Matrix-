import { Link } from 'react-router-dom';

const NotFound = () => (
  <div style={{ 
    textAlign: 'center', 
    padding: '2rem',
    minHeight: '50vh',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center'
  }}>
    <h1>404 - Page Not Found</h1>
    <p>The page you're looking for doesn't exist.</p>
    <Link to="/" style={{ color: '#3498db', textDecoration: 'none' }}>
      Go back to homepage
    </Link>
  </div>
);

export default NotFound;