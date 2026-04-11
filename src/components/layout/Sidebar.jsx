import { NavLink } from 'react-router-dom';
import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  FiHome, FiUsers, FiCalendar, FiDollarSign,
  FiFileText, FiSettings, FiUserCheck, FiBriefcase, FiChevronDown, FiAward, FiPercent, FiHash, FiTrendingUp, FiUserX, FiRefreshCw, FiLock, FiShield, FiActivity, FiServer, FiLayers, FiGlobe, FiClipboard, FiDatabase
} from 'react-icons/fi';

// Cada item tiene un 'permission' que se usa para filtrar acceso
const menuItems = [
  { path: '/', icon: FiHome, label: 'Dashboard', permission: 'dashboard.ver' },
  { 
    label: 'Personal', 
    icon: FiUsers, 
    isGroup: true,
    children: [
      { path: '/empleados', icon: FiUsers, label: 'Personal', permission: 'empleados.ver' },
      { path: '/ficha-personal', icon: FiUserCheck, label: 'Ficha Personal', permission: 'ficha_personal.ver' },
      { path: '/sueldos-periodo', icon: FiDollarSign, label: 'Sueldos por Periodo', permission: 'planilla.ver' },
      { path: '/cesados', icon: FiUserX, label: 'Cesados', permission: 'cesados.ver' },
      { path: '/amonestaciones', icon: FiClipboard, label: 'Amonestaciones', permission: 'empleados.ver' },
    ]
  },
  {
    label: 'Contratos',
    icon: FiFileText,
    isGroup: true,
    children: [
      { path: '/historial-contratos', icon: FiRefreshCw, label: 'Contratos', permission: 'contratos.ver' },
      { path: '/cambios-personal', icon: FiActivity, label: 'Cambios de Personal', permission: 'cambios_personal.ver' },
    ]
  },
  { 
    label: 'Empresa', 
    icon: FiBriefcase, 
    isGroup: true,
    children: [
      { path: '/areas', icon: FiBriefcase, label: 'Áreas', permission: 'areas.ver' },
      { path: '/cargos', icon: FiAward, label: 'Cargos', permission: 'cargos.ver' },
      { path: '/contratos-unidad', icon: FiFileText, label: 'Contratos de Unidad', permission: 'cargos.ver' },
      { path: '/sistemas-pensiones', icon: FiDollarSign, label: 'Sistemas de Pensiones', permission: 'pensiones.ver' },
      { path: '/uit', icon: FiHash, label: 'UIT', permission: 'uit.ver' },
     
    ]
  },
  { 
    label: 'Planilla', 
    icon: FiBriefcase, 
    isGroup: true,
    children: [
      { path: '/tareo', icon: FiBriefcase, label: 'Tareo / Asistencia', permission: 'tareo.ver' },
      { path: '/planilla', icon: FiAward, label: 'Planilla', permission: 'planilla.ver' },
      { path: '/boletas', icon: FiFileText, label: 'Boletas', permission: 'boletas.ver' },
    ]
  },
  { 
    label: 'Simulaciones', 
    icon: FiTrendingUp, 
    isGroup: true,
    children: [
      { path: '/calculo-renta', icon: FiBriefcase, label: 'Cálculo de Renta', permission: 'simulaciones.ver' },
      { path: '/simulador-5ta', icon: FiAward, label: 'Simulador 5ta Cat.', permission: 'simulaciones.ver' },
    ]
  },
  { 
    label: 'Contabilidad', 
    icon: FiDollarSign, 
    isGroup: true,
    children: [
      { path: '/formato', icon: FiDollarSign, label: 'Formato AFP NET', permission: 'formato.ver' },
      { path: '/liquidaciones', icon: FiDollarSign, label: 'Liquidaciones', permission: 'liquidaciones.ver' },
      { path: '/vacaciones', icon: FiDollarSign, label: 'Vacaciones', permission: 'vacaciones.ver' },
    ]
  },
  { 
    label: 'Sistema', 
    icon: FiLock, 
    isGroup: true,
    children: [
      { path: '/usuarios', icon: FiBriefcase, label: 'Usuarios', permission: 'usuarios.ver' },
      { path: '/roles', icon: FiShield, label: 'Roles y Permisos', permission: 'roles.ver' },
      { path: '/configuracion', icon: FiAward, label: 'Configuración', permission: 'configuracion.ver' },
      { path: '/historial-usuarios', icon: FiActivity, label: 'Historial Usuarios', permission: 'historial.ver' },
      { path: '/historial-sistema', icon: FiServer, label: 'Historial Sistema', permission: 'historial.ver' },
      { path: '/backups', icon: FiDatabase, label: 'Backups', permission: 'configuracion.ver' },
    ]
  },
 // { path: '/reportes', icon: FiFileText, label: 'Reportes', permission: 'reportes.ver' },
  {
    label: 'Visitante',
    icon: FiGlobe,
    isGroup: true,
    children: [
      { path: '/visitante', icon: FiFileText, label: 'Boleta Pública', permission: null },
    ]
  },
  {
    label: 'FORMATOS',
    icon: FiGlobe,
    isGroup: true,
    children: [
      { path: '/tarjeta-tareo', icon: FiCalendar, label: 'Tarjeta de Tareo', permission: 'tarjeta_tareo.ver' },
      { path: '/visitante', icon: FiFileText, label: 'HHT FORMATO STAMIN', permission: null },
       { path: '/tramas', icon: FiLayers, label: 'Tramas', permission: 'tramas.ver' },
      { path: '/tramas-sctr', icon: FiLayers, label: 'Tramas SCTR', permission: 'tramas.ver' },
      { path: '/tramas-vida-ley', icon: FiLayers, label: 'Tramas Vida Ley', permission: 'tramas.ver' },
    ]
  },
];

function Sidebar({ isOpen, onClose }) {
  const { user, hasPermission } = useAuth();
  const [openGroups, setOpenGroups] = useState({'Personal': true });

  // Filtrar menú según permisos del usuario
  const filterByPermission = (items) => {
    return items.reduce((acc, item) => {
      if (item.isGroup) {
        const visibleChildren = item.children.filter(child =>
          child.permission === null ? true : hasPermission(child.permission)
        );
        if (visibleChildren.length > 0) {
          acc.push({ ...item, children: visibleChildren });
        }
      } else {
        if (hasPermission(item.permission)) {
          acc.push(item);
        }
      }
      return acc;
    }, []);
  };

  // Usar el menú completo filtrado por permisos para TODOS los usuarios
  // (la visibilidad de cada página se controla solo por permisos del rol asignado)
  const filteredMenuItems = filterByPermission(menuItems);

  const toggleGroup = (label) => {
    setOpenGroups(prev => ({ ...prev, [label]: !prev[label] }));
  };
  return (
    <>
      {/* Overlay para móvil */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}

      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <h2>ECOSERMY</h2>
          <small>Sistema de Planillas</small>
        </div>
        
        <nav className="sidebar-nav">
          {filteredMenuItems.map((item, index) => {
            if (item.isGroup) {
              return (
                <div key={index}>
                  <div 
                    className="nav-group-title" 
                    onClick={() => toggleGroup(item.label)}
                    style={{ cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', fontWeight: '600', fontSize: '13px', color: '#6c757d', textTransform: 'uppercase', letterSpacing: '0.5px' }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <item.icon size={16} />
                      <span>{item.label}</span>
                    </div>
                    <FiChevronDown 
                      size={16} 
                      style={{ 
                        transform: openGroups[item.label] ? 'rotate(0deg)' : 'rotate(-90deg)',
                        transition: 'transform 0.2s'
                      }} 
                    />
                  </div>
                  {openGroups[item.label] && (
                    <div className="nav-submenu">
                      {item.children.map(child => (
                        <NavLink
                          key={child.path}
                          to={child.path}
                          className={({ isActive }) =>
                            `nav-item nav-subitem ${isActive ? 'active' : ''}`
                          }
                        >
                          <child.icon size={18} />
                          <span>{child.label}</span>
                        </NavLink>
                      ))}
                    </div>
                  )}
                </div>
              );
            }
            return (
              <NavLink
                key={item.path}
                to={item.path}
                end={item.path === '/'}
                className={({ isActive }) =>
                  `nav-item ${isActive ? 'active' : ''}`
                }
              >
                <item.icon size={20} />
                <span>{item.label}</span>
              </NavLink>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <small>ECOSERMY v1.0 - Yauli</small>
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
