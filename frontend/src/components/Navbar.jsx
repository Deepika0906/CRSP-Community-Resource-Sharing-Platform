import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [unread, setUnread] = useState(0);

  useEffect(() => {
    if (!user) return;
    let mounted = true;
    const load = () => {
      api
        .get('/notifications')
        .then((res) => {
          if (mounted) setUnread(res.data.unreadCount || 0);
        })
        .catch(() => {});
    };
    load();
    const interval = setInterval(load, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [user]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar navbar-expand-lg navbar-crsp sticky-top py-3">
      <div className="container">
        <Link className="navbar-brand text-success" to="/">
          <i className="bi bi-people-fill me-2"></i>CRSP
        </Link>
        <button
          className="navbar-toggler"
          type="button"
          data-bs-toggle="collapse"
          data-bs-target="#navMain"
        >
          <span className="navbar-toggler-icon"></span>
        </button>
        <div className="collapse navbar-collapse" id="navMain">
          <ul className="navbar-nav me-auto mb-2 mb-lg-0 ms-lg-4">
            <li className="nav-item">
              <Link className="nav-link" to="/resources">
                Browse
              </Link>
            </li>
            <li className="nav-item">
              <Link className="nav-link" to="/resources?sharingMode=GIVEAWAY">
                Free Giveaways
              </Link>
            </li>
            {user && (
              <li className="nav-item">
                <Link className="nav-link" to="/dashboard">
                  Dashboard
                </Link>
              </li>
            )}
            {user && user.role === 'admin' && (
              <li className="nav-item">
                <Link className="nav-link" to="/admin">
                  Admin
                </Link>
              </li>
            )}
          </ul>

          {user ? (
            <div className="d-flex align-items-center gap-2">
              <Link to="/add-resource" className="btn btn-crsp btn-sm">
                <i className="bi bi-plus-lg me-1"></i>Share a Resource
              </Link>
              <Link to="/notifications" className="btn btn-outline-secondary btn-sm position-relative">
                <i className="bi bi-bell"></i>
                {unread > 0 && (
                  <span className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger">
                    {unread}
                  </span>
                )}
              </Link>
              <div className="dropdown">
                <button
                  className="btn btn-light btn-sm dropdown-toggle d-flex align-items-center gap-1"
                  data-bs-toggle="dropdown"
                >
                  <i className="bi bi-person-circle"></i> {user.name?.split(' ')[0]}
                </button>
                <ul className="dropdown-menu dropdown-menu-end">
                  <li>
                    <Link className="dropdown-item" to="/profile">
                      Profile
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/wishlist">
                      Wishlist
                    </Link>
                  </li>
                  <li>
                    <Link className="dropdown-item" to="/messages">
                      Messages
                    </Link>
                  </li>
                  <li>
                    <hr className="dropdown-divider" />
                  </li>
                  <li>
                    <button className="dropdown-item text-danger" onClick={handleLogout}>
                      Logout
                    </button>
                  </li>
                </ul>
              </div>
            </div>
          ) : (
            <div className="d-flex gap-2">
              <Link to="/login" className="btn btn-outline-success btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-crsp btn-sm">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
