const EmptyState = ({ icon = 'bi-inbox', title = 'Nothing here yet', subtitle = '' }) => (
  <div className="empty-state">
    <i className={`bi ${icon} fs-1 d-block mb-3`}></i>
    <h5>{title}</h5>
    {subtitle && <p className="mb-0">{subtitle}</p>}
  </div>
);

export default EmptyState;
