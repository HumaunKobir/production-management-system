import { Link } from 'react-router-dom';

export default function PageHeader({ title, description, backTo, backLabel = 'Back to list', actions }) {
  return (
    <div className="page-header-block">
      {backTo && (
        <Link to={backTo} className="back-link">← {backLabel}</Link>
      )}
      <div className="page-header">
        <div>
          <h2>{title}</h2>
          {description && <p className="page-description">{description}</p>}
        </div>
        {actions && <div className="page-actions">{actions}</div>}
      </div>
    </div>
  );
}
