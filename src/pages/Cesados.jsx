import { useState, useEffect } from "react";
import { FiUserX, FiDownload, FiFileText } from "react-icons/fi";
import { getEmpleadosCesados } from "../services/empleadoService";
import DataTable from "../components/common/DataTable";
import Loading from "../components/common/Loading";
import { formatDate } from "../utils/helpers";
import { toast } from "react-toastify";
import * as XLSX from "xlsx";

function Cesados() {
  const [cesados, setCesados] = useState([]);
  const [loading, setLoading] = useState(false);
  const [exportandoPDF, setExportandoPDF] = useState(false);

  useEffect(() => { cargarCesados(); }, []);

  const cargarCesados = async () => {
    try {
      setLoading(true);
      const data = await getEmpleadosCesados();
      setCesados(data);
    } catch (error) {
      toast.error("Error al cargar empleados cesados");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const exportarExcel = () => {
    if (cesados.length === 0) { toast.warning("No hay datos para exportar"); return; }
    const filas = cesados.map((e, i) => ({
      "N°":             i + 1,
      "Código":         e.codigo_trabajador || "",
      "Apellidos":      e.apellidos || "",
      "Nombres":        e.nombres || "",
      "DNI":            e.dni || "",
      "Área":           e.area?.nombre || "",
      "Cargo":          e.cargo?.nombre || "",
      "Fecha Ingreso":  e.fecha_ingreso ? formatDate(e.fecha_ingreso) : "",
      "Fecha Cese":     e.fecha_cese    ? formatDate(e.fecha_cese)    : "",
      "Motivo de Cese": e.motivo_cese   || "",
    }));
    const ws = XLSX.utils.json_to_sheet(filas);
    ws["!cols"] = [
      { wch: 5 }, { wch: 10 }, { wch: 25 }, { wch: 20 }, { wch: 12 },
      { wch: 20 }, { wch: 30 }, { wch: 14 }, { wch: 14 }, { wch: 30 },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Personal Cesado");
    const fecha = new Date().toISOString().split("T")[0];
    XLSX.writeFile(wb, `personal_cesado_${fecha}.xlsx`);
    toast.success(`${cesados.length} registros exportados a Excel`);
  };

  const exportarPDF = async () => {
    if (cesados.length === 0) { toast.warning("No hay datos para exportar"); return; }
    setExportandoPDF(true);
    try {
      const fecha = new Date().toLocaleDateString("es-PE", { day: "2-digit", month: "long", year: "numeric" });
      const filas = cesados.map((e, i) => `
        <tr style="background:${i % 2 === 0 ? "#fff" : "#f1f5f9"};">
          <td style="padding:5px;text-align:center;border:1px solid #ddd;">${i + 1}</td>
          <td style="padding:5px;border:1px solid #ddd;font-weight:600;color:#1d4ed8;">${e.codigo_trabajador || ""}</td>
          <td style="padding:5px;border:1px solid #ddd;font-weight:600;">${e.apellidos || ""}, ${e.nombres || ""}</td>
          <td style="padding:5px;text-align:center;border:1px solid #ddd;">${e.dni || ""}</td>
          <td style="padding:5px;border:1px solid #ddd;">${e.area?.nombre || "-"}</td>
          <td style="padding:5px;border:1px solid #ddd;">${e.cargo?.nombre || "-"}</td>
          <td style="padding:5px;text-align:center;border:1px solid #ddd;">${e.fecha_ingreso ? formatDate(e.fecha_ingreso) : "-"}</td>
          <td style="padding:5px;text-align:center;border:1px solid #ddd;font-weight:600;color:#dc2626;">${e.fecha_cese ? formatDate(e.fecha_cese) : "-"}</td>
          <td style="padding:5px;border:1px solid #ddd;">${e.motivo_cese || "-"}</td>
        </tr>`).join("");

      const html = `
        <div style="font-family:Arial,sans-serif;padding:20px;color:#111;">
          <div style="text-align:center;margin-bottom:18px;">
            <div style="font-size:16pt;font-weight:bold;color:#1e3a5f;">ECOSERMY S.A.C.</div>
            <div style="font-size:13pt;font-weight:bold;margin-top:4px;">REPORTE DE PERSONAL CESADO</div>
            <div style="font-size:9pt;color:#555;margin-top:4px;">Generado el ${fecha} | Total: ${cesados.length} empleados</div>
          </div>
          <table style="width:100%;border-collapse:collapse;font-size:8pt;">
            <thead>
              <tr style="background:#1e3a5f;color:#fff;">
                <th style="padding:6px 5px;text-align:center;border:1px solid #ccc;">N°</th>
                <th style="padding:6px 5px;text-align:left;border:1px solid #ccc;">Código</th>
                <th style="padding:6px 5px;text-align:left;border:1px solid #ccc;">Apellidos y Nombres</th>
                <th style="padding:6px 5px;text-align:center;border:1px solid #ccc;">DNI</th>
                <th style="padding:6px 5px;text-align:left;border:1px solid #ccc;">Área</th>
                <th style="padding:6px 5px;text-align:left;border:1px solid #ccc;">Cargo</th>
                <th style="padding:6px 5px;text-align:center;border:1px solid #ccc;">F. Ingreso</th>
                <th style="padding:6px 5px;text-align:center;border:1px solid #ccc;">F. Cese</th>
                <th style="padding:6px 5px;text-align:left;border:1px solid #ccc;">Motivo</th>
              </tr>
            </thead>
            <tbody>${filas}</tbody>
          </table>
        </div>`;

      const overlay = document.createElement("div");
      overlay.style.cssText = "position:fixed;left:0;top:0;width:100vw;height:100vh;z-index:99999;background:#fff;overflow:auto;";
      const container = document.createElement("div");
      container.style.cssText = "width:1050px;margin:0 auto;background:#fff;";
      container.innerHTML = html;
      overlay.appendChild(container);
      document.body.appendChild(overlay);
      document.body.style.overflow = "auto";
      await new Promise(r => setTimeout(r, 500));

      const html2pdf = (await import("html2pdf.js")).default;
      const fechaArchivo = new Date().toISOString().split("T")[0];
      await html2pdf().set({
        margin:      [8, 8, 8, 8],
        filename:    `personal_cesado_${fechaArchivo}.pdf`,
        image:       { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true, logging: false },
        jsPDF:       { unit: "mm", format: "a4", orientation: "landscape" },
        pagebreak:   { mode: ["css"] },
      }).from(container).save();

      document.body.removeChild(overlay);
      toast.success(`PDF generado con ${cesados.length} registros`);
    } catch (err) {
      console.error(err);
      toast.error("Error al generar PDF");
    } finally {
      setExportandoPDF(false);
    }
  };

  const columns = [
    {
      header: "Código",
      accessor: "codigo_trabajador",
      render: (row) => <span style={{ fontWeight: 600, color: "var(--accent)" }}>{row.codigo_trabajador}</span>,
    },
    {
      header: "Apellidos y Nombres",
      accessor: "apellidos",
      render: (row) => (
        <div>
          <span style={{ fontWeight: 600 }}>{row.apellidos}</span>
          <span style={{ color: "var(--text-secondary)" }}>, {row.nombres}</span>
        </div>
      ),
    },
    { header: "DNI", accessor: "dni" },
    { header: "Área",  render: (row) => row.area?.nombre  || "-" },
    { header: "Cargo", render: (row) => row.cargo?.nombre || "-" },
    {
      header: "Fecha de Ingreso",
      accessor: "fecha_ingreso",
      render: (row) => formatDate(row.fecha_ingreso),
    },
    {
      header: "Fecha de Cese",
      accessor: "fecha_cese",
      render: (row) => (
        <span style={{ fontWeight: 600, color: "var(--danger)", background: "var(--danger-bg)", padding: "2px 8px", borderRadius: "12px", fontSize: "0.8rem" }}>
          {formatDate(row.fecha_cese)}
        </span>
      ),
    },
    {
      header: "Motivo de Cese",
      accessor: "motivo_cese",
      render: (row) => row.motivo_cese || "-",
    },
  ];

  if (loading) return <Loading />;

  return (
    <div className="page-container">
      <div className="page-header">
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <FiUserX size={24} style={{ color: "var(--danger)" }} />
          <div>
            <h2>Personal Cesado</h2>
            <small style={{ color: "var(--text-muted)" }}>
              {cesados.length} empleado{cesados.length !== 1 ? "s" : ""} cesado{cesados.length !== 1 ? "s" : ""}
            </small>
          </div>
        </div>
        <div className="page-actions">
          <button className="btn-secondary" onClick={exportarExcel} disabled={cesados.length === 0} title="Exportar a Excel">
            <FiDownload size={15} /> Excel
          </button>
          <button className="btn-primary" onClick={exportarPDF} disabled={exportandoPDF || cesados.length === 0}
            style={{ background: "#dc2626", borderColor: "#dc2626" }} title="Exportar a PDF">
            <FiFileText size={15} /> {exportandoPDF ? "Generando..." : "PDF"}
          </button>
        </div>
      </div>

      <DataTable columns={columns} data={cesados} searchable pageSize={15} />
    </div>
  );
}

export default Cesados;
