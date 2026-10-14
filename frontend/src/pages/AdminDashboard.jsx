import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const StatCard = ({ label, value, color }) => (
  <div className="col-6 col-md-4 col-lg-2">
    <div className="card border-0 shadow-sm p-3 text-center">
      <div className={`fs-3 fw-bold text-${color}`}>{value}</div>
      <div className="small text-muted">{label}</div>
    </div>
  </div>
);

const AdminDashboard = () => {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get('/dashboard/admin')
      .then((res) => setStats(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;
  if (error) return <div className="container py-5"><AlertMessage message={error} /></div>;

  return (
    <div className="container py-4">
      <div className="mb-4">
        <h3 className="mb-1">Admin Dashboard</h3>
        <p className="text-muted mb-0">Platform-wide statistics and moderation tools. Not visible to regular users.</p>
      </div>

      <div className="row g-3 mb-4">
        <StatCard label="Total Users" value={stats.totalUsers} color="success" />
        <StatCard label="Total Resources" value={stats.totalResources} color="primary" />
        <StatCard label="Available Now" value={stats.availableResources} color="info" />
        <StatCard label="Active Borrowings" value={stats.activeBorrowings} color="warning" />
        <StatCard label="Completed Giveaways" value={stats.completedGiveaways} color="secondary" />
        <StatCard label="Pending Reports" value={stats.pendingReports} color="danger" />
      </div>

      <h5 className="mb-3">Management</h5>
      <div className="row g-3">
        <div className="col-md-4">
          <Link to="/admin/users" className="card border-0 shadow-sm p-4 text-decoration-none text-dark h-100">
            <i className="bi bi-people fs-2 text-success mb-2"></i>
            <h6>User Management</h6>
            <p className="small text-muted mb-0">View all users, suspend or reactivate accounts, delete users.</p>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/admin/resources" className="card border-0 shadow-sm p-4 text-decoration-none text-dark h-100">
            <i className="bi bi-box-seam fs-2 text-primary mb-2"></i>
            <h6>Resource Management</h6>
            <p className="small text-muted mb-0">Browse every listing, search by title/mode, remove fake or duplicate resources.</p>
          </Link>
        </div>
        <div className="col-md-4">
          <Link to="/admin/reports" className="card border-0 shadow-sm p-4 text-decoration-none text-dark h-100">
            <i className="bi bi-flag fs-2 text-danger mb-2"></i>
            <h6>
              Reported Listings
              {stats.pendingReports > 0 && <span className="badge bg-danger ms-2">{stats.pendingReports}</span>}
            </h6>
            <p className="small text-muted mb-0">Review user reports of fake, damaged, or inappropriate listings.</p>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
