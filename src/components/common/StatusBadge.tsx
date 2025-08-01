// src/components/common/StatusBadge.tsx
import React from 'react';

interface StatusBadgeProps {
  status: string;
  variant?: 'kurs' | 'trainer' | 'teilnehmer';
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, variant = 'kurs' }) => {
  const getStatusColor = () => {
    if (variant === 'kurs') {
      switch (status) {
        case 'geplant':
          return 'bg-blue-100 text-blue-800';
        case 'laufend':
          return 'bg-green-100 text-green-800';
        case 'abgeschlossen':
          return 'bg-gray-100 text-gray-800';
        case 'abgebrochen':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } else if (variant === 'trainer') {
      switch (status) {
        case 'verfuegbar':
          return 'bg-green-100 text-green-800';
        case 'im_einsatz':
          return 'bg-yellow-100 text-yellow-800';
        case 'abwesend':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    } else if (variant === 'teilnehmer') {
      switch (status) {
        case 'angemeldet':
          return 'bg-blue-100 text-blue-800';
        case 'aktiv':
          return 'bg-green-100 text-green-800';
        case 'abgeschlossen':
          return 'bg-gray-100 text-gray-800';
        case 'abgebrochen':
          return 'bg-red-100 text-red-800';
        default:
          return 'bg-gray-100 text-gray-800';
      }
    }
    return 'bg-gray-100 text-gray-800';
  };

  const getStatusText = () => {
    if (variant === 'kurs') {
      switch (status) {
        case 'geplant': return 'Geplant';
        case 'laufend': return 'Laufend';
        case 'abgeschlossen': return 'Abgeschlossen';
        case 'abgebrochen': return 'Abgebrochen';
        default: return status;
      }
    } else if (variant === 'trainer') {
      switch (status) {
        case 'verfuegbar': return 'Verfügbar';
        case 'im_einsatz': return 'Im Einsatz';
        case 'abwesend': return 'Abwesend';
        default: return status;
      }
    } else if (variant === 'teilnehmer') {
      switch (status) {
        case 'angemeldet': return 'Angemeldet';
        case 'aktiv': return 'Aktiv';
        case 'abgeschlossen': return 'Abgeschlossen';
        case 'abgebrochen': return 'Abgebrochen';
        default: return status;
      }
    }
    return status;
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor()}`}>
      {getStatusText()}
    </span>
  );
};

export default StatusBadge;