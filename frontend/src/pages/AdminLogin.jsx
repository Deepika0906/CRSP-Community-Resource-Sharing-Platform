import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

// A dedicated admin sign-in screen, deliberately separate from the regular
// user /login page. It still authenticates against the same /api/auth/login
// endpoint (there's only one set of credentials per account), but after a
// successful login it checks the account's role — if it isn't "admin", it
// refuses to proceed and shows an error instead of letting them in.
const AdminLogin = () => {
  const { updateUser } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/auth/login', form);
      const { user, token } = res.data.data;

      if (user.role !== 'admin') {
        setError('This account does not have admin access. Use the regular login page instead.');
        setLoading(false);
        return;
      }

      localStorage.setItem('crsp_token', token);
      localStorage.setItem('crsp_user', JSON.stringify(user));
      updateUser(user);
      navigate('/admin', { replace: true });
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 440 }}>
      <div className="card shadow-sm border-0 p-4" style={{ borderTop: '4px solid var(--crsp-green-dark)' }}>
        <div className="text-center mb-3">
          <i className="bi bi-shield-lock fs-1 text-success"></i>
        </div>
        <h3 className="mb-1 text-center">Admin Portal</h3>
        <p className="text-muted text-center mb-4">Sign in with an administrator account to manage CRSP.</p>
        <AlertMessage message={error} onClose={() => setError('')} />
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Admin Email</label>
            <input
              type="email"
              className="form-control"
              required
              autoFocus
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          </div>
          <button className="btn btn-crsp w-100" disabled={loading}>
            {loading ? 'Signing in...' : 'Sign In to Admin Portal'}
          </button>
        </form>
        <p className="text-center mt-3 mb-0 small">
          Not an admin? <Link to="/login">Go to regular login</Link>
        </p>
      </div>
    </div>
  );
};

export default AdminLogin;