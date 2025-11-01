import React from 'react';

const EventSelector = ({ actividades, selectedEvent, onEventChange, loading }) => {
  return (
    <div className="event-selector">
      <label htmlFor="eventSelector">🎯 Seleccionar Evento:</label>
      <select 
        id="eventSelector" 
        value={selectedEvent} 
        onChange={(e) => onEventChange(e.target.value)}
        disabled={loading}
      >
        {loading ? (
          <option value="">Cargando eventos...</option>
        ) : actividades.length === 0 ? (
          <option value="">No hay actividades disponibles</option>
        ) : (
          <>
            <option value="">Selecciona un evento</option>
            {actividades.map(act => (
              <option key={act.coleccion} value={act.coleccion}>
                {act.nombre}
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  );
};

export default EventSelector;

