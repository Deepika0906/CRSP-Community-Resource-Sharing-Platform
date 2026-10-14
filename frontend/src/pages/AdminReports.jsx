import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import Loader from '../components/Loader';
import EmptyState from '../components/EmptyState';
import AlertMessage from '../components/AlertMessage';
import { getErrorMessage } from '../utils/getErrorMessage';

const AdminReports = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const load = () => {
    setLoading(true);
    api
      .get('/reports')
      .then((res) => setReports(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const resolve = async (id, status, removeResource) => {
    setError('');
    setSuccess('');
    try {
      await api.put(`/reports/${id}`, { status, removeResource, resolutionNote: `Marked ${status} by admin` });
      setSuccess('Report updated.');
      load();
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  if (loading) return <Loader />;

  return (
    <div className="container py-4">
      <h3 className="mb-4">Reported Listings</h3>
      <AlertMessage message={error} onClose={() => setError('')} />
      <AlertMessage type="success" message={success} onClose={() => setSuccess('')} />

      {reports.length === 0 ? (
        <EmptyState icon="bi-flag" title="No reports" />
      ) : (
        <div className="table-responsive">
          <table className="table align-middle bg-white shadow-sm rounded">
            <thead>
              <tr>
                <th>Resource</th>
                <th>Reported By</th>
                <th>Reason</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((r) => (
                <tr key={r._id}>
                  <td>
                    <Link to={`/resources/${r.resource?._id}`}>{r.resource?.title || '(deleted)'}</Link>
                  </td>
                  <td>{r.reportedBy?.name}</td>
                  <td className="text-capitalize">{r.reason.replace(/_/g, ' ').toLowerCase()}</td>
                  <td className="text-capitalize">{r.status.replace(/_/g, ' ').toLowerCase()}</td>
                  <td>
                    {r.status === 'PENDING' && (
                      <div className="d-flex gap-1 flex-wrap">
                        <button className="btn btn-sm btn-outline-secondary" onClick={() => resolve(r._id, 'DISMISSED', false)}>
                          Dismiss
                        </button>
                        <button className="btn btn-sm btn-outline-danger" onClick={() => resolve(r._id, 'ACTION_TAKEN', true)}>
                          Remove Listing
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminReports;
