import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';

const CATEGORIES = ['Books', 'Electronics', 'Sports Equipment', 'Stationery', 'Clothing', 'Furniture', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const AddResource = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    title: '',
    description: '',
    category: 'Books',
    condition: 'Good',
    location: '',
    sharingMode: 'LEND',
  });
  const [images, setImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      images.forEach((img) => fd.append('images', img));

      const res = await api.post('/resources', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      navigate(`/resources/${res.data.data._id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container py-4" style={{ maxWidth: 700 }}>
      <h3 className="mb-4">Share a Resource</h3>
      <AlertMessage message={error} onClose={() => setError('')} />
      <form className="card border-0 shadow-sm p-4" onSubmit={handleSubmit}>
        <div className="mb-3">
          <label className="form-label">Sharing Mode</label>
          <div className="d-flex gap-3">
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="sharingMode"
                id="mode-lend"
                value="LEND"
                checked={form.sharingMode === 'LEND'}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="mode-lend">
                Lend / Borrow (temporary)
              </label>
            </div>
            <div className="form-check">
              <input
                className="form-check-input"
                type="radio"
                name="sharingMode"
                id="mode-give"
                value="GIVEAWAY"
                checked={form.sharingMode === 'GIVEAWAY'}
                onChange={handleChange}
              />
              <label className="form-check-label" htmlFor="mode-give">
                Give Away for Free (permanent)
              </label>
            </div>
          </div>
          {form.sharingMode === 'GIVEAWAY' && (
            <div className="alert alert-warning small mt-2 mb-0">
              This item will be listed with a FREE badge and no price. Ownership transfers permanently
              once you confirm handover to the requester you accept.
            </div>
          )}
        </div>

        <div className="mb-3">
          <label className="form-label">Title</label>
          <input name="title" className="form-control" required value={form.title} onChange={handleChange} />
        </div>

        <div className="mb-3">
          <label className="form-label">Description</label>
          <textarea name="description" className="form-control" rows={4} required value={form.description} onChange={handleChange} />
        </div>

        <div className="row">
          <div className="col-md-6 mb-3">
            <label className="form-label">Category</label>
            <select name="category" className="form-select" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Condition</label>
            <select name="condition" className="form-select" value={form.condition} onChange={handleChange}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="mb-3">
          <label className="form-label">Location</label>
          <input name="location" className="form-control" required value={form.location} onChange={handleChange} placeholder="e.g. Chennai" />
        </div>

        <div className="mb-4">
          <label className="form-label">Images (up to 5)</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            onChange={(e) => setImages(Array.from(e.target.files).slice(0, 5))}
          />
        </div>

        <button className="btn btn-crsp" disabled={loading}>
          {loading ? 'Publishing...' : 'Publish Resource'}
        </button>
      </form>
    </div>
  );
};

export default AddResource;
