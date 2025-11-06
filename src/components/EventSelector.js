import React from 'react';
import { Calendar, Loader2 } from 'lucide-react';

const EventSelector = ({ actividades, selectedEvent, onEventChange, loading }) => {
  return (
    <div className="event-selector-container">
      <label htmlFor="eventSelector" className="event-selector-label">
        <Calendar size={18} />
        Seleccionar Evento
      </label>
      <select 
        id="eventSelector" 
        className="event-selector"
        value={selectedEvent} 
        onChange={(e) => onEventChange(e.target.value)}
        disabled={loading}
      >
        {loading ? (
          <option value="">
            <Loader2 size={16} className="loading-spinner-icon" />
            Cargando eventos...
          </option>
        ) : actividades.length === 0 ? (
          <option value="">📭 No hay actividades disponibles</option>
        ) : (
          <>
            <option value="">🎯 Selecciona un evento</option>
            {actividades.map(act => (
              <option key={act.coleccion} value={act.coleccion}>
                📅 {act.nombre}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
};

export default EventSelector;