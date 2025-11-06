import React, { useState } from 'react';
import { Search, Filter, X } from 'lucide-react';
import '../styles/SearchFilter.css';

const SearchFilter = ({ onSearchChange, onFilterChange, totalResults }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterAsistencia, setFilterAsistencia] = useState('todos');
  const [showFilters, setShowFilters] = useState(false);

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearchChange(value);
  };

  const handleFilterChange = (value) => {
    setFilterAsistencia(value);
    onFilterChange('asistencia', value);
  };

  const clearSearch = () => {
    setSearchTerm('');
    onSearchChange('');
  };

  const clearFilters = () => {
    setFilterAsistencia('todos');
    onFilterChange('asistencia', 'todos');
  };

  const hasActiveFilters = filterAsistencia !== 'todos';

  return (
    <div className="search-filter-container">
      <div className="search-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="search-input"
          />
          {searchTerm && (
            <button 
              className="clear-search-btn"
              onClick={clearSearch}
              title="Limpiar búsqueda"
            >
              <X size={16} />
            </button>
          )}
        </div>

        <button 
          className={`filter-toggle-btn ${showFilters ? 'active' : ''}`}
          onClick={() => setShowFilters(!showFilters)}
          title="Filtros"
        >
          <Filter size={18} />
          {hasActiveFilters && <span className="filter-badge"></span>}
        </button>
      </div>

      {showFilters && (
        <div className="filters-panel">
          <div className="filter-group">
            <label className="filter-label">Estado de Asistencia</label>
            <div className="filter-options">
              <button
                className={`filter-option ${filterAsistencia === 'todos' ? 'active' : ''}`}
                onClick={() => handleFilterChange('todos')}
              >
                Todos
              </button>
              <button
                className={`filter-option ${filterAsistencia === 'asistio' ? 'active' : ''}`}
                onClick={() => handleFilterChange('asistio')}
              >
                Asistió
              </button>
              <button
                className={`filter-option ${filterAsistencia === 'no_asistio' ? 'active' : ''}`}
                onClick={() => handleFilterChange('no_asistio')}
              >
                No Asistió
              </button>
            </div>
          </div>

          {hasActiveFilters && (
            <button 
              className="clear-filters-btn"
              onClick={clearFilters}
            >
              <X size={16} />
              Limpiar filtros
            </button>
          )}
        </div>
      )}

      {totalResults !== null && (
        <div className="results-count">
          <span>{totalResults} resultado{totalResults !== 1 ? 's' : ''}</span>
        </div>
      )}
    </div>
  );
};

export default SearchFilter;