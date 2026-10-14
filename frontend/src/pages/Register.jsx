import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
  phone: '',
  address: '',
};

const Register = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (form.password !== form.confirmPassword) {
      setError('Password and confirm password do not match');
      return;
    }
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    try {
      await register(form);
      navigate('/dashboard');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 520 }}>
      <div className="card shadow-sm border-0 p-4">
        <h3 className="mb-1 text-success">Create your account</h3>
        <p className="text-muted mb-4">Join your community and start sharing.</p>
        <AlertMessage message={error} onClose={() => setError('')} />
        <form onSubmit={handleSubmit}>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Full Name</label>
              <input name="name" className="form-control" required value={form.name} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Email</label>
              <input type="email" name="email" className="form-control" required value={form.email} onChange={handleChange} />
            </div>
          </div>
          <div className="row">
            <div className="col-md-6 mb-3">
              <label className="form-label">Password</label>
              <input type="password" name="password" className="form-control" required value={form.password} onChange={handleChange} />
            </div>
            <div className="col-md-6 mb-3">
              <label className="form-label">Confirm Password</label>
              <input
                type="password"
                name="confirmPassword"
                className="form-control"
                required
                value={form.confirmPassword}
                onChange={handleChange}
              />
            </div>
          </div>
          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input name="phone" className="form-control" required value={form.phone} onChange={handleChange} />
          </div>
          <div className="mb-4">
            <label className="form-label">Address / Location</label>
            <input name="address" className="form-control" required value={form.address} onChange={handleChange} placeholder="e.g. Anna Nagar, Chennai" />
          </div>
          <button className="btn btn-crsp w-100" disabled={loading}>
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
        <p className="text-center mt-3 mb-0">
          Already have an account? <Link to="/login">Log in</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
