import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { ThemeProvider } from './contexts/ThemeContext';
import { AuthProvider } from './contexts/AuthContext';
import { CatalogosProvider } from './contexts/CatalogosContext';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ProtectedRoute from './components/common/ProtectedRoute';
import Layout from './components/layout/Layout';
import Loading from './components/common/Loading';
import Login from './pages/Login';

// Lazy loading de páginas
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Empleados = lazy(() => import('./pages/Empleados'));
const Areas = lazy(() => import('./pages/Areas'));
const Cargos = lazy(() => import('./pages/Cargos'));
const SistemasPensiones = lazy(() => import('./pages/SistemasPensiones'));
const Tareo = lazy(() => import('./pages/Tareo'));
const Planilla = lazy(() => import('./pages/Planilla'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Configuracion = lazy(() => import('./pages/Configuracion'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const Roles = lazy(() => import('./pages/Roles'));
const Simulador5taCat = lazy(() => import('./pages/Simulador5taCat'));
const UIT = lazy(() => import('./pages/UIT'));
const CalculoRenta = lazy(() => import('./pages/CalculoRenta'));
const Cesados = lazy(() => import('./pages/Cesados'));
const Amonestaciones = lazy(() => import('./pages/Amonestaciones'));
const HistorialContratos = lazy(() => import('./pages/HistorialContratos'));
const Formato = lazy(() => import('./pages/Formato'));
const Liquidaciones = lazy(() => import('./pages/Liquidaciones'));
const Vacaciones = lazy(() => import('./pages/Vacaciones'));
const Boletas = lazy(() => import('./pages/Boletas'));
const BoletaPublica = lazy(() => import('./pages/BoletaPublica'));
const Visitante = lazy(() => import('./pages/Visitante'));
const TarjetaTareo = lazy(() => import('./pages/TarjetaTareo'));
const HistorialUsuarios = lazy(() => import('./pages/HistorialUsuarios'));
const HistorialSistema = lazy(() => import('./pages/HistorialSistema'));
const Tramas = lazy(() => import('./pages/Tramas'));
const TramasSCTR = lazy(() => import('./pages/TramasSCTR'));
const TramasVidaLey = lazy(() => import('./pages/TramasVidaLey'));
const CambiosPersonal = lazy(() => import('./pages/CambiosPersonal'));
const ContratosUnidad = lazy(() => import('./pages/ContratosUnidad'));
const Backups = lazy(() => import('./pages/Backups'));
const FichaPersonal = lazy(() => import('./pages/FichaPersonal'));
const SueldosPeriodo = lazy(() => import('./pages/SueldosPeriodo'));

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <CatalogosProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/mi-boleta" element={
                <Suspense fallback={<Loading />}>
                  <BoletaPublica />
                </Suspense>
              } />
              <Route path="/visitante" element={
                <Suspense fallback={<Loading />}>
                  <Visitante />
                </Suspense>
              } />
              <Route path="/" element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }>
                <Route index element={
                  <Suspense fallback={<Loading />}>
                    <Dashboard />
                  </Suspense>
                } />
                <Route path="empleados" element={
                  <ProtectedRoute requiredPermission="empleados.ver">
                    <Suspense fallback={<Loading />}><Empleados /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="cesados" element={
                  <ProtectedRoute requiredPermission="cesados.ver">
                    <Suspense fallback={<Loading />}><Cesados /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="amonestaciones" element={
                  <ProtectedRoute requiredPermission="empleados.ver">
                    <Suspense fallback={<Loading />}><Amonestaciones /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="areas" element={
                  <ProtectedRoute requiredPermission="areas.ver">
                    <Suspense fallback={<Loading />}><Areas /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="cargos" element={
                  <ProtectedRoute requiredPermission="cargos.ver">
                    <Suspense fallback={<Loading />}><Cargos /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="contratos-unidad" element={
                  <ProtectedRoute requiredPermission="cargos.ver">
                    <Suspense fallback={<Loading />}><ContratosUnidad /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="sistemas-pensiones" element={
                  <ProtectedRoute requiredPermission="pensiones.ver">
                    <Suspense fallback={<Loading />}><SistemasPensiones /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="tareo" element={
                  <ProtectedRoute requiredPermission="tareo.ver">
                    <Suspense fallback={<Loading />}><Tareo /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="planilla" element={
                  <ProtectedRoute requiredPermission="planilla.ver">
                    <Suspense fallback={<Loading />}><Planilla /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="reportes" element={
                  <ProtectedRoute requiredPermission="reportes.ver">
                    <Suspense fallback={<Loading />}><Reportes /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="configuracion" element={
                  <ProtectedRoute requiredPermission="configuracion.ver">
                    <Suspense fallback={<Loading />}><Configuracion /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="usuarios" element={
                  <ProtectedRoute requiredPermission="usuarios.ver">
                    <Suspense fallback={<Loading />}><Usuarios /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="roles" element={
                  <ProtectedRoute requiredPermission="roles.ver">
                    <Suspense fallback={<Loading />}><Roles /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="historial-usuarios" element={
                  <ProtectedRoute requiredPermission="historial.ver">
                    <Suspense fallback={<Loading />}><HistorialUsuarios /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="historial-sistema" element={
                  <ProtectedRoute requiredPermission="historial.ver">
                    <Suspense fallback={<Loading />}><HistorialSistema /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="simulador-5ta" element={
                  <ProtectedRoute requiredPermission="simulaciones.ver">
                    <Suspense fallback={<Loading />}><Simulador5taCat /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="uit" element={
                  <ProtectedRoute requiredPermission="uit.ver">
                    <Suspense fallback={<Loading />}><UIT /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="calculo-renta" element={
                  <ProtectedRoute requiredPermission="simulaciones.ver">
                    <Suspense fallback={<Loading />}><CalculoRenta /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="historial-contratos" element={
                  <ProtectedRoute requiredPermission="contratos.ver">
                    <Suspense fallback={<Loading />}><HistorialContratos /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="cambios-personal" element={
                  <ProtectedRoute requiredPermission="cambios_personal.ver">
                    <Suspense fallback={<Loading />}><CambiosPersonal /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="formato" element={
                  <ProtectedRoute requiredPermission="formato.ver">
                    <Suspense fallback={<Loading />}><Formato /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="liquidaciones" element={
                  <ProtectedRoute requiredPermission="liquidaciones.ver">
                    <Suspense fallback={<Loading />}><Liquidaciones /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="vacaciones" element={
                  <ProtectedRoute requiredPermission="vacaciones.ver">
                    <Suspense fallback={<Loading />}><Vacaciones /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="boletas" element={
                  <ProtectedRoute requiredPermission="boletas.ver">
                    <Suspense fallback={<Loading />}><Boletas /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="tarjeta-tareo" element={
                  <ProtectedRoute requiredPermission="tarjeta_tareo.ver">
                    <Suspense fallback={<Loading />}><TarjetaTareo /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="tramas" element={
                  <ProtectedRoute requiredPermission="tramas.ver">
                    <Suspense fallback={<Loading />}><Tramas /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="tramas-sctr" element={
                  <ProtectedRoute requiredPermission="tramas.ver">
                    <Suspense fallback={<Loading />}><TramasSCTR /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="tramas-vida-ley" element={
                  <ProtectedRoute requiredPermission="tramas.ver">
                    <Suspense fallback={<Loading />}><TramasVidaLey /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="backups" element={
                  <ProtectedRoute requiredPermission="configuracion.ver">
                    <Suspense fallback={<Loading />}><Backups /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="ficha-personal" element={
                  <ProtectedRoute requiredPermission="ficha_personal.ver">
                    <Suspense fallback={<Loading />}><FichaPersonal /></Suspense>
                  </ProtectedRoute>
                } />
                <Route path="sueldos-periodo" element={
                  <ProtectedRoute requiredPermission="planilla.ver">
                    <Suspense fallback={<Loading />}><SueldosPeriodo /></Suspense>
                  </ProtectedRoute>
                } />
              </Route>
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </BrowserRouter>
          <ToastContainer position="top-right" autoClose={3000} theme="colored" />
        </CatalogosProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
