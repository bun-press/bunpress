import { cn } from '../../../src/lib/utils';

interface FooterLink {
  text: string;
  link: string;
}

interface FooterProps {
  editLink?: string;
  lastUpdated?: string | Date;
  prev?: FooterLink;
  next?: FooterLink;
  className?: string;
  footerLinks?: Array<{
    title: string;
    items: Array<{ text: string; link: string }>;
  }>;
  isFullWidth?: boolean;
}

export function Footer({
  editLink,
  lastUpdated,
  prev,
  next,
  className,
  footerLinks = [],
  isFullWidth = false
}: FooterProps) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString(undefined, {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    : null;

  return (
    <footer className={cn('doc-footer', className)}>
      {/* Previous and Next navigation */}
      {(prev || next) && (
        <nav className="doc-prev-next-nav">
          <div className={cn('doc-prev-next-container', isFullWidth && 'full-width')}>
            {prev && (
              <a href={prev.link} className="doc-prev-link">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="doc-nav-icon"
                >
                  <path
                    fillRule="evenodd"
                    d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="doc-nav-text">
                  <span className="doc-nav-label">Previous</span>
                  <span className="doc-nav-title">{prev.text}</span>
                </span>
              </a>
            )}
            {next && (
              <a href={next.link} className="doc-next-link">
                <span className="doc-nav-text">
                  <span className="doc-nav-label">Next</span>
                  <span className="doc-nav-title">{next.text}</span>
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                  className="doc-nav-icon"
                >
                  <path
                    fillRule="evenodd"
                    d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                    clipRule="evenodd"
                  />
                </svg>
              </a>
            )}
          </div>
        </nav>
      )}

      {/* Edit link and last updated */}
      <div className="doc-meta">
        <div className={cn('doc-meta-container', isFullWidth && 'full-width')}>
          {editLink && (
            <a
              href={editLink}
              target="_blank"
              rel="noopener noreferrer"
              className="doc-edit-link"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 20 20"
                fill="currentColor"
                className="doc-edit-icon"
              >
                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
              </svg>
              Edit this page
            </a>
          )}
          {formattedDate && (
            <time className="doc-last-updated">
              Last updated on {formattedDate}
            </time>
          )}
        </div>
      </div>

      {/* Footer links */}
      {footerLinks.length > 0 && (
        <div className="doc-footer-links">
          <div className={cn('doc-footer-links-container', isFullWidth && 'full-width')}>
            {footerLinks.map((section, index) => (
              <div key={index} className="doc-footer-section">
                <h3 className="doc-footer-title">{section.title}</h3>
                <ul className="doc-footer-list">
                  {section.items.map((item, itemIndex) => (
                    <li key={itemIndex}>
                      <a href={item.link} className="doc-footer-link">
                        {item.text}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Copyright */}
      <div className="doc-copyright">
        <div className={cn('doc-copyright-container', isFullWidth && 'full-width')}>
          <p>&copy; {new Date().getFullYear()} - Powered by BunPress</p>
        </div>
      </div>
    </footer>
  );
} 