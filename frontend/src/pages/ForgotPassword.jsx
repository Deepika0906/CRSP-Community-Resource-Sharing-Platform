import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setResult(null);
    setLoading(true);
    try {
      const res = await api.post('/auth/forgot-password', { email });
      setResult(res.data);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-5" style={{ maxWidth: 480 }}>
      <div className="card shadow-sm border-0 p-4">
        <h3 className="mb-1 text-success">Reset your password</h3>
        <p className="text-muted mb-4">Enter your account email and we'll generate a reset link.</p>
        <AlertMessage message={error} onClose={() => setError('')} />

        {result && (
          <div className="alert alert-info">
            <p className="mb-2">{result.message}</p>
            {result.devResetToken && (
              <>
                <p className="small mb-1 fw-bold">Development mode notice</p>
                <p className="small mb-2">{result.devNote}</p>
                <Link to={`/reset-password/${result.devResetToken}`} className="btn btn-sm btn-crsp">
                  Continue to reset password
                </Link>
              </>
            )}
          </div>
        )}

        {!result && (
          <form onSubmit={handleSubmit}>
            <div className="mb-3">
              <label className="form-label">Email</label>
              <input type="email" className="form-control" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <button className="btn btn-crsp w-100" disabled={loading}>
              {loading ? 'Sending...' : 'Send Reset Link'}
            </button>
          </form>
        )}

        <p className="text-center mt-3 mb-0">
          <Link to="/login">Back to login</Link>
        </p>
      </div>
    </div>
  );
};

export default ForgotPassword;
