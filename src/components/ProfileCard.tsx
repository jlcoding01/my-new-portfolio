import React, { useCallback, useMemo } from 'react';
import './ProfileCard.css';

const DEFAULT_INNER_GRADIENT =
  'linear-gradient(180deg, rgba(9, 14, 24, 0.08) 0%, rgba(9, 14, 24, 0.34) 45%, rgba(9, 14, 24, 0.76) 100%)';

interface ProfileCardProps {
  avatarUrl?: string;
  iconUrl?: string;
  grainUrl?: string;
  innerGradient?: string;
  behindGlowEnabled?: boolean;
  behindGlowColor?: string;
  behindGlowSize?: string;
  className?: string;
  enableTilt?: boolean;
  enableMobileTilt?: boolean;
  mobileTiltSensitivity?: number;
  miniAvatarUrl?: string;
  name?: string;
  title?: string;
  handle?: string;
  status?: string;
  contactText?: string;
  showUserInfo?: boolean;
  onContactClick?: () => void;
}

const ProfileCardComponent: React.FC<ProfileCardProps> = ({
  avatarUrl = 'https://picsum.photos/seed/jerry/400/600',
  innerGradient,
  className = '',
  miniAvatarUrl,
  name = 'Jerry L.',
  title = 'Full Stack Engineer',
  handle = 'jerry_dev',
  status = 'Online',
  contactText = 'Contact',
  showUserInfo = true,
  onContactClick
}) => {
  const cardStyle = useMemo(
    () =>
      ({
        '--inner-gradient': innerGradient ?? DEFAULT_INNER_GRADIENT
      }) as React.CSSProperties,
    [innerGradient]
  );

  const handleContactClick = useCallback(() => {
    onContactClick?.();
  }, [onContactClick]);

  return (
    <article className={`pc-card ${className}`.trim()} style={cardStyle}>
      <div className="pc-media">
        <img
          className="pc-avatar-image"
          src={avatarUrl}
          alt={`${name || 'User'} avatar`}
          loading="lazy"
          onError={e => {
            const target = e.target as HTMLImageElement;
            target.style.display = 'none';
          }}
        />
        <div className="pc-media-overlay" />
      </div>

      <div className="pc-header">
        <h3>{name}</h3>
        <p>{title}</p>
      </div>

      {showUserInfo && (
        <div className="pc-user-info">
          <div className="pc-user-details">
            <div className="pc-mini-avatar">
              <img
                src={miniAvatarUrl || avatarUrl}
                alt={`${name || 'User'} mini avatar`}
                loading="lazy"
                onError={e => {
                  const target = e.target as HTMLImageElement;
                  target.style.opacity = '0.5';
                  target.src = avatarUrl;
                }}
              />
            </div>
            <div className="pc-user-text">
              <div className="pc-handle">@{handle}</div>
              <div className="pc-status">{status}</div>
            </div>
          </div>
          <button
            className="pc-contact-btn"
            onClick={handleContactClick}
            type="button"
            aria-label={`Contact ${name || 'user'}`}
          >
            {contactText}
          </button>
        </div>
      )}
    </article>
  );
};

const ProfileCard = React.memo(ProfileCardComponent);
export default ProfileCard;
