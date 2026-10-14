import { Link } from 'react-router-dom';

const Footer = () => (
  <footer className="footer-crsp">
    <div className="container text-center small">
      <div className="mb-1 fw-bold">CRSP &mdash; Community Resource Sharing Platform</div>
      <div className="mb-2">Borrow. Share. Build Community.</div>
      <Link to="/admin/login" className="text-decoration-none" style={{ color: '#8fae9a' }}>
        <i className="bi bi-shield-lock me-1"></i>Admin Portal
      </Link>
    </div>
  </footer>
);

export default Footer;