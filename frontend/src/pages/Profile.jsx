import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import api, { resolveImageUrl } from '../services/api';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name: user.name, phone: user.phone, address: user.address });
  const [avatar, setAvatar] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [pwForm, setPwForm] = useState({ currentPassword: '', newPassword: '' });
  const [pwError, setPwError] = useState('');
  const [pwSuccess, setPwSuccess] = useState('');
  const [pwLoading, setPwLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      if (avatar) fd.append('avatar', avatar);
      const res = await api.put('/users/profile', fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      updateUser(res.data.data);
      setSuccess('Profile updated successfully.');
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setPwError('');
    setPwSuccess('');
    setPwLoading(true);
    try {
      await api.put('/users/change-password', pwForm);
      setPwSuccess('Password changed successfully.');
      setPwForm({ currentPassword: '', newPassword: '' });
    } catch (err) {
      setPwError(getErrorMessage(err));
    } finally {
      setPwLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 640 }}>
      <h3 className="mb-4">My Profile</h3>

      <div className="card border-0 shadow-sm p-4 mb-4">
        <AlertMessage message={error} onClose={() => setError('')} />
        <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
        <div className="d-flex align-items-center gap-3 mb-3">
          <img
            src={user.avatar ? resolveImageUrl(user.avatar) : 'https://via.placeholder.com/72?text=%20'}
            alt=""
            style={{ width: 72, height: 72, borderRadius: '50%', objectFit: 'cover' }}
          />
          <div>
            <div className="fw-bold">{user.email}</div>
            <div className="small text-muted text-capitalize">{user.role} account</div>
          </div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="mb-3">
            <label className="form-label">Name</label>
            <input className="form-control" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label">Phone Number</label>
            <input className="form-control" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label">Address / Location</label>
            <input className="form-control" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />
          </div>
          <div className="mb-3">
            <label className="form-label">Profile Photo</label>
            <input type="file" accept="image/*" className="form-control" onChange={(e) => setAvatar(e.target.files[0])} />
          </div>
          <button className="btn btn-crsp" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </form>
      </div>

      <div className="card border-0 shadow-sm p-4">
        <h6 className="mb-3">Change Password</h6>
        <AlertMessage message={pwError} onClose={() => setPwError('')} />
        <AlertMessage type="success" message={pwSuccess} onClose={() => setPwSuccess('')} />
        <form onSubmit={handlePasswordChange}>
          <div className="mb-3">
            <label className="form-label">Current Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={pwForm.currentPassword}
              onChange={(e) => setPwForm({ ...pwForm, currentPassword: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="form-label">New Password</label>
            <input
              type="password"
              className="form-control"
              required
              value={pwForm.newPassword}
              onChange={(e) => setPwForm({ ...pwForm, newPassword: e.target.value })}
            />
          </div>
          <button className="btn btn-outline-secondary" disabled={pwLoading}>
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Profile;
