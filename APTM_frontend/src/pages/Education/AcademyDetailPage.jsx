import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { FaGraduationCap } from 'react-icons/fa';
import { useAcademies } from '../../hooks/useAcademies';
import AcademyFullPage from '../../components/education/AcademyFullPage';

const AcademyDetailPage = () => {
  const { academyId } = useParams();
  const navigate = useNavigate();
  const { getAcademyById } = useAcademies();
  
  const academy = getAcademyById(academyId);

  const handleClose = () => {
    navigate('/education');
  };

  if (!academy) {
    return (
      <div className="edu-page">
        <div className="edu-container">
          <div className="edu-error">
            <FaGraduationCap size={32} />
            <div>
              <div style={{ fontWeight: '800', fontSize: '1.25rem' }}>Academy Not Found</div>
              <div style={{ color: 'var(--color-text-secondary)' }}>
                The academy you're looking for doesn't exist or has been removed.
              </div>
              <button 
                onClick={() => navigate('/education')}
                className="edu-btn edu-btn--primary"
                style={{ marginTop: 'var(--space-md)' }}
              >
                Back to Academies
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Return ONLY the AcademyFullPage without any wrapping containers
  return <AcademyFullPage academy={academy} onClose={handleClose} />;
};

export default AcademyDetailPage;