import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api, { resolveImageUrl } from '../services/api';
import { getErrorMessage } from '../utils/getErrorMessage';
import AlertMessage from '../components/AlertMessage';
import Loader from '../components/Loader';

const CATEGORIES = ['Books', 'Electronics', 'Sports Equipment', 'Stationery', 'Clothing', 'Furniture', 'Others'];
const CONDITIONS = ['New', 'Like New', 'Good', 'Fair', 'Poor'];

const EditResource = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [newImages, setNewImages] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    api
      .get(`/resources/${id}`)
      .then((res) => {
        const r = res.data.data;
        setForm({
          title: r.title,
          description: r.description,
          category: r.category,
          condition: r.condition,
          location: r.location,
          images: r.images,
        });
      })
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setFetching(false));
  }, [id]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const removeImage = async (imagePath) => {
    try {
      await api.delete(`/resources/${id}/images`, { data: { imagePath } });
      setForm({ ...form, images: form.images.filter((i) => i !== imagePath) });
    } catch (err) {
      setError(getErrorMessage(err));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const fd = new FormData();
      ['title', 'description', 'category', 'condition', 'location'].forEach((k) => fd.append(k, form[k]));
      newImages.forEach((img) => fd.append('images', img));

      await api.put(`/resources/${id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
      navigate(`/resources/${id}`);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  if (fetching) return <Loader />;
  if (!form) return <div className="container py-5"><AlertMessage message={error} /></div>;

  return (
    <div className="container py-4" style={{ maxWidth: 700 }}>
      <h3 className="mb-4">Edit Resource</h3>
      <AlertMessage message={error} onClose={() => setError('')} />
      <form className="card border-0 shadow-sm p-4" onSubmit={handleSubmit}>
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
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="col-md-6 mb-3">
            <label className="form-label">Condition</label>
            <select name="condition" className="form-select" value={form.condition} onChange={handleChange}>
              {CONDITIONS.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mb-3">
          <label className="form-label">Location</label>
          <input name="location" className="form-control" required value={form.location} onChange={handleChange} />
        </div>

        {form.images && form.images.length > 0 && (
          <div className="mb-3">
            <label className="form-label">Current Images</label>
            <div className="d-flex gap-2 flex-wrap">
              {form.images.map((img) => (
                <div key={img} className="position-relative">
                  <img src={resolveImageUrl(img)} alt="" style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 6 }} />
                  <button
                    type="button"
                    className="btn btn-sm btn-danger position-absolute top-0 end-0 p-0"
                    style={{ width: 20, height: 20, lineHeight: '10px' }}
                    onClick={() => removeImage(img)}
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-4">
          <label className="form-label">Add More Images</label>
          <input
            type="file"
            className="form-control"
            accept="image/*"
            multiple
            onChange={(e) => setNewImages(Array.from(e.target.files).slice(0, 5))}
          />
        </div>

        <button className="btn btn-crsp" disabled={loading}>
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
};

export default EditResource;
