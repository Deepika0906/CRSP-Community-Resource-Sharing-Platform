import { useEffect, useState } from 'react';
import api from '../services/api';
import Loader from '../components/Loader';
import AlertMessage from '../components/AlertMessage';
import { getErrorMessage } from '../utils/getErrorMessage';
import { useAuth } from '../context/AuthContext';

const AdminUsers = () => {
  const { user: me } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/users')
      .then((res) => setUsers(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const toggleStatus = async (u) => {
    setError('');
    setSuccess('');
    try {
      const newStatus = u.status === 'active' ? 'suspended' : 'active';
      await api.put(`/users/${u._id}/status`, { status: newStatus });
      setSuccess(`${u.name} is now ${newStatus}.`);
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const remove = async (u) => {
    if (!window.confirm(`Delete user ${u.name}? This cannot be undone.`)) return;
    setError('');
    setSuccess('');
    try {
      await api.delete(`/users/${u._id}`);
      setSuccess('User deleted.');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Manage Users</h3>
      <AlertMessage message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />
      <div className="table-responsive">
        <table className="table align-middle bg-white shadow-sm rounded">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Status</th>
              <th>Joined</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((u) => (
              <tr key={u._id}>
                <td>{u.name}</td>
                <td>{u.email}</td>
                <td className="text-capitalize">{u.role}</td>
                <td>
                  <span className={`badge ${u.status === 'active' ? 'bg-success' : 'bg-secondary'}`}>{u.status}</span>
                </td>
                <td className="small text-muted">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td>
                  {String(u._id) !== String(me._id) && (
                    <div className="d-flex gap-1">
                      <button className="btn btn-sm btn-outline-warning" onClick={() => toggleStatus(u)}>
                        {u.status === 'active' ? 'Suspend' : 'Reactivate'}
                      </button>
                      <button className="btn btn-sm btn-outline-danger" onClick={() => remove(u)}>
                        Delete
                      </button>
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AdminUsers;
