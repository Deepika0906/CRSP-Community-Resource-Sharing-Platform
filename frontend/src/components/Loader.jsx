const Loader = ({ label = 'Loading...' }) => (
  <div className="d-flex flex-column align-items-center justify-content-center py-5 text-muted">
    <div className="spinner-border text-success mb-2" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
    <div>{label}</div>
  </div>
);

export default Loader;
