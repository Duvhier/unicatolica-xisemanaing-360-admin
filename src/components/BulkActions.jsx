import React from 'react';
import { CheckCircle, XCircle, Mail, Trash2, X } from 'lucide-react';
import '../styles/BulkActions.css';

const BulkActions = ({ 
  selectedCount, 
  onMarkAttendance, 
  onUnmarkAttendance, 
  onSendEmail, 
  onDelete,
  onClearSelection 
}) => {
  if (selectedCount === 0) return null;

  return (
    <div className="bulk-actions-bar">
      <div className="bulk-actions-info">
        <span className="selected-count">{selectedCount}</span>
        <span className="selected-text">
          {selectedCount === 1 ? 'persona seleccionada' : 'personas seleccionadas'}
        </span>
      </div>

      <div className="bulk-actions-buttons">
        <button 
          className="bulk-action-btn success"
          onClick={onMarkAttendance}
          title="Marcar asistencia"
        >
          <CheckCircle size={18} />
          <span>Marcar Asistencia</span>
        </button>

        <button 
          className="bulk-action-btn danger"
          onClick={onUnmarkAttendance}
          title="Desmarcar asistencia"
        >
          <XCircle size={18} />
          <span>Desmarcar</span>
        </button>

        <button 
          className="bulk-action-btn primary"
          onClick={onSendEmail}
          title="Enviar email"
        >
          <Mail size={18} />
          <span>Enviar Email</span>
        </button>

        <button 
          className="bulk-action-btn warning"
          onClick={onDelete}
          title="Eliminar"
        >
          <Trash2 size={18} />
          <span>Eliminar</span>
        </button>

        <button 
          className="bulk-action-clear"
          onClick={onClearSelection}
          title="Limpiar selección"
        >
          <X size={18} />
        </button>
      </div>
    </div>
  );
};

export default BulkActions;