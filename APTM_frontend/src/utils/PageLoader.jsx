import './PageLoader.css';

const PageLoader = () => {
  return (
    <div className="page-loader">
      <div className="loader-spinner">
        <div className="loader-square"></div>
        <div className="loader-square"></div>
        <div className="loader-square"></div>
      </div>
      <div className="loader-text">Alpha Phoenix</div>
    </div>
  );
};

export default PageLoader;