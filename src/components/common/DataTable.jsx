import { useState } from 'react';
import { FiSearch, FiChevronLeft, FiChevronRight, FiCopy, FiDownload, FiPrinter, FiColumns } from 'react-icons/fi';
import { toast } from 'react-toastify';

function DataTable({ columns, data, onRowClick, searchable = true, pageSize = 15, filterFn = null }) {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [sortColumn, setSortColumn] = useState(null);
  const [sortDirection, setSortDirection] = useState('asc');
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [visibleColumns, setVisibleColumns] = useState(
    columns.reduce((acc, col, idx) => ({ ...acc, [idx]: true }), {})
  );

  // Filtrar datos
  let filteredData = data;
  if (search && searchable) {
    const term = search.toLowerCase();
    if (filterFn) {
      // Función de filtrado personalizada pasada por el padre
      filteredData = data.filter(row => filterFn(row, term));
    } else {
      filteredData = data.filter(row =>
        columns.some(col => {
          const value = col.accessor ? row[col.accessor] : '';
          return String(value).toLowerCase().includes(term);
        })
      );
    }
  }

  // Ordenar datos
  if (sortColumn) {
    filteredData = [...filteredData].sort((a, b) => {
      const aVal = a[sortColumn] ?? '';
      const bVal = b[sortColumn] ?? '';
      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1;
      return 0;
    });
  }

  // Paginación
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIdx = (currentPage - 1) * pageSize;
  const endIdx = Math.min(startIdx + pageSize, filteredData.length);
  const pageData = filteredData.slice(startIdx, endIdx);

  const handleSort = (accessor) => {
    if (sortColumn === accessor) {
      setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(accessor);
      setSortDirection('asc');
    }
  };

  // Exportar funciones
  const copyToClipboard = () => {
    const visibleCols = columns.filter((_, idx) => visibleColumns[idx]);
    const headers = visibleCols.map(col => col.header).join('\t');
    const rows = filteredData.map(row => 
      visibleCols.map(col => {
        if (col.render && !col.accessor) return '';
        return col.accessor ? row[col.accessor] : '';
      }).join('\t')
    ).join('\n');
    navigator.clipboard.writeText(headers + '\n' + rows);
    toast.success('Datos copiados al portapapeles');
  };

  const exportToCSV = () => {
    const visibleCols = columns.filter((_, idx) => visibleColumns[idx]);
    const headers = visibleCols.map(col => col.header).join(',');
    const rows = filteredData.map(row =>
      visibleCols.map(col => {
        if (col.render && !col.accessor) return '';
        const value = col.accessor ? row[col.accessor] : '';
        return `"${String(value).replace(/"/g, '""')}"`;
      }).join(',')
    ).join('\n');
    const csv = headers + '\n' + rows;
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `datos_${new Date().getTime()}.csv`;
    link.click();
    toast.success('Archivo CSV descargado');
  };

  const exportToExcel = () => {
    toast.info('Exportación a Excel disponible próximamente');
  };

  const exportToPDF = () => {
    toast.info('Exportación a PDF disponible próximamente');
  };

  const handlePrint = () => {
    window.print();
  };

  const toggleColumnVisibility = (idx) => {
    setVisibleColumns(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  // Generar array de números de página
  const getPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 4; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1);
        pages.push('...');
        for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
      } else {
        pages.push(1);
        pages.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) pages.push(i);
        pages.push('...');
        pages.push(totalPages);
      }
    }
    return pages;
  };

  return (
    <div className="datatable-container">
      {/* Toolbar de acciones */}
      <div className="datatable-toolbar">
        <div className="datatable-actions">
          <button className="dt-btn" onClick={copyToClipboard} title="Copiar">
            <FiCopy size={14} /> Copy
          </button>
          <button className="dt-btn" onClick={exportToCSV} title="Exportar CSV">
            <FiDownload size={14} /> CSV
          </button>
          <button className="dt-btn" onClick={exportToExcel} title="Exportar Excel">
            <FiDownload size={14} /> Excel
          </button>
          <button className="dt-btn" onClick={exportToPDF} title="Exportar PDF">
            <FiDownload size={14} /> PDF
          </button>
          <button className="dt-btn" onClick={handlePrint} title="Imprimir">
            <FiPrinter size={14} /> Print
          </button>
          <div className="dt-column-toggle">
            <button 
              className="dt-btn" 
              onClick={() => setShowColumnMenu(!showColumnMenu)}
              title="Visibilidad de columnas"
            >
              <FiColumns size={14} /> Column visibility
            </button>
            {showColumnMenu && (
              <div className="dt-column-menu">
                {columns.map((col, idx) => (
                  <label key={idx} className="dt-column-item">
                    <input
                      type="checkbox"
                      checked={visibleColumns[idx]}
                      onChange={() => toggleColumnVisibility(idx)}
                    />
                    <span>{col.header}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
        </div>

        {searchable && (
          <div className="datatable-search">
            <label>Search:</label>
            <input
              type="search"
              placeholder=""
              value={search}
              onChange={e => { setSearch(e.target.value); setCurrentPage(1); }}
            />
          </div>
        )}
      </div>

      {/* Tabla */}
      <div className="datatable-wrapper">
        <table className="datatable">
          <thead>
            <tr>
              {columns.map((col, idx) => 
                visibleColumns[idx] && (
                  <th
                    key={idx}
                    onClick={() => col.accessor && handleSort(col.accessor)}
                    style={{ cursor: col.accessor ? 'pointer' : 'default', width: col.width }}
                  >
                    <div className="dt-th-content">
                      <span>{col.header}</span>
                      {sortColumn === col.accessor && (
                        <span className="dt-sort-icon">
                          {sortDirection === 'asc' ? '↑' : '↓'}
                        </span>
                      )}
                    </div>
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {pageData.length === 0 ? (
              <tr>
                <td colSpan={columns.filter((_, idx) => visibleColumns[idx]).length} className="dt-empty">
                  No se encontraron registros
                </td>
              </tr>
            ) : (
              pageData.map((row, rowIdx) => (
                <tr
                  key={row.id || rowIdx}
                  onClick={() => onRowClick && onRowClick(row)}
                  style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                >
                  {columns.map((col, colIdx) =>
                    visibleColumns[colIdx] && (
                      <td key={colIdx}>
                        {col.render ? col.render(row) : row[col.accessor]}
                      </td>
                    )
                  )}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Footer con información y paginación */}
      <div className="datatable-footer">
        <div className="datatable-info">
          Desde {startIdx + 1} hasta {endIdx} de {filteredData.length} registros
          {filteredData.length < data.length && (
            <span className="datatable-filtered"> (filtrados de {data.length} registros totales)</span>
          )}
        </div>

        {totalPages > 1 && (
          <div className="datatable-pagination">
            <button
              className="dt-page-btn"
              disabled={currentPage === 1}
              onClick={() => setCurrentPage(1)}
              title="Primera página"
            >
              Previous
            </button>
            
            {getPageNumbers().map((page, idx) => (
              page === '...' ? (
                <span key={idx} className="dt-page-ellipsis">...</span>
              ) : (
                <button
                  key={idx}
                  className={`dt-page-num ${currentPage === page ? 'active' : ''}`}
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </button>
              )
            ))}

            <button
              className="dt-page-btn"
              disabled={currentPage === totalPages}
              onClick={() => setCurrentPage(totalPages)}
              title="Última página"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default DataTable;
