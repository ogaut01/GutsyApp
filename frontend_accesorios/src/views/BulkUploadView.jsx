import React, { useState } from 'react';
import { Upload, Download, FileSpreadsheet, CheckCircle2, AlertTriangle, ArrowLeft, Layers, Sparkles, RefreshCw, X } from 'lucide-react';
import { bulkUploadProductos, parseUploadFile } from '../services/api';

export default function BulkUploadView({ onBack, onSuccess }) {
  const [file, setFile] = useState(null);
  const [parsedProducts, setParsedProducts] = useState([]);
  const [validationErrors, setValidationErrors] = useState([]);
  const [loading, setLoading] = useState(false);
  const [parsing, setParsing] = useState(false);
  const [successResult, setSuccessResult] = useState(null);

  const downloadSampleTemplate = () => {
    window.location.href = '/api/productos-carga-masiva/descargar-plantilla/';
  };

  const handleFileUpload = async (e) => {
    const uploadedFile = e.target.files[0];
    if (!uploadedFile) return;

    setFile(uploadedFile);
    setValidationErrors([]);
    setSuccessResult(null);
    setParsing(true);

    try {
      const res = await parseUploadFile(uploadedFile);
      setParsedProducts(res.productos || []);
      setValidationErrors(res.errores || []);
    } catch (err) {
      setValidationErrors([err.message || 'Error al procesar el archivo']);
      setParsedProducts([]);
    } finally {
      setParsing(false);
    }
  };


  const handleConfirmImport = async () => {
    if (parsedProducts.length === 0) return;
    setLoading(true);

    try {
      const res = await bulkUploadProductos(parsedProducts);
      setSuccessResult(res);
      if (onSuccess) onSuccess();
    } catch (err) {
      alert('Error en la importación: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const totalVariantes = parsedProducts.reduce((acc, p) => acc + p.variantes.length, 0);
  const totalStock = parsedProducts.reduce((acc, p) => acc + p.variantes.reduce((sum, v) => sum + v.stock, 0), 0);

  const categoryLabels = {
    AN: 'Anillos',
    CA: 'Cadenas',
    CO: 'Collares',
    ST: 'Sets / Parejas',
    LE: 'Lentes / Gafas',
    PU: 'Pulseras',
    AR: 'Aros',
    TO: 'Tobilleras',
    DI: 'Dijes',
    DJ: 'Dijes',
    RE: 'Relojes',
    PI: 'Piercings',
    OT: 'Otros',
  };

  return (
    <div className="pb-24 pt-2 px-3 max-w-5xl mx-auto space-y-4">
      {/* Botón Volver y Título */}
      <div className="flex items-center justify-between">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-xs font-semibold text-stone-500 dark:text-zinc-400 hover:text-stone-900 dark:text-white p-2 rounded-xl bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Volver al Catálogo</span>
        </button>

        <span className="text-[11px] font-bold text-black dark:text-white uppercase tracking-wider">
          Asistente de Importación
        </span>
      </div>

      {/* Tarjeta de Instrucciones y Descarga de Plantilla */}
      <div className="bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/20 border border-neutral-200 dark:border-zinc-800 rounded-3xl p-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-base font-black text-stone-900 dark:text-white flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5 text-black dark:text-white" />
              Carga Masiva de Accesorios (Excel / CSV)
            </h2>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 leading-relaxed">
              Importa decenas o cientos de anillos, cadenas y pulseras con sus talles, colores y costos en segundos.
            </p>
          </div>

          <button
            onClick={downloadSampleTemplate}
            className="px-3.5 py-2.5 bg-zinc-800 hover:bg-zinc-700 text-black dark:text-white font-bold rounded-2xl text-xs flex items-center gap-2 border border-[#d6cebf] dark:border-zinc-700 active:scale-95 transition flex-shrink-0"
          >
            <Download className="w-4 h-4 text-black dark:text-white" />
            <span>Descargar Plantilla</span>
          </button>
        </div>

        {/* Zona de Subida de Archivo */}
        {!successResult && (
          <div className="pt-2">
            <label className={`border-2 border-dashed rounded-2xl p-6 flex flex-col items-center justify-center gap-2 cursor-pointer bg-zinc-950/60 hover:bg-zinc-950 transition text-center group
              ${parsing ? 'border-amber-500 opacity-55 cursor-wait' : 'border-[#d6cebf] dark:border-zinc-700 hover:border-amber-500'}`}>
              {parsing ? (
                <RefreshCw className="w-8 h-8 text-black dark:text-white animate-spin" />
              ) : (
                <Upload className="w-8 h-8 text-stone-400 dark:text-zinc-500 group-hover:text-black dark:text-white transition stroke-[1.5]" />
              )}
              <div>
                <span className="text-xs font-bold text-stone-900 dark:text-white block">
                  {parsing ? 'Leyendo y validando archivo...' : file ? file.name : 'Haz clic para seleccionar tu archivo Excel / CSV'}
                </span>
                <span className="text-[11px] text-stone-400 dark:text-zinc-500">
                  Soporta formatos .xlsx (Excel) y .csv
                </span>
              </div>
              <input
                type="file"
                accept=".xlsx,.csv"
                disabled={parsing}
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
          </div>
        )}
      </div>

      {/* Errores de Validación */}
      {validationErrors.length > 0 && (
        <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-1">
          <div className="flex items-center gap-2 text-rose-400 font-bold text-xs">
            <AlertTriangle className="w-4 h-4" />
            <span>Advertencias de Formato</span>
          </div>
          <ul className="text-xs text-rose-300 list-disc list-inside space-y-0.5">
            {validationErrors.map((err, idx) => (
              <li key={idx}>{err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Vista Previa de Validación */}
      {parsedProducts.length > 0 && !successResult && (
        <div className="space-y-3 animate-in fade-in-50">
          {/* Barra de Resumen de Validación */}
          <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <span className="text-xs text-emerald-400 font-bold flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Archivo validado correctamente
              </span>
              <p className="text-xs text-stone-700 dark:text-zinc-300 font-medium mt-0.5">
                <b>{parsedProducts.length}</b> modelos de accesorios • <b>{totalVariantes}</b> combinaciones de talle/color • <b>{totalStock}</b> unidades en stock.
              </p>
            </div>

            <button
              onClick={handleConfirmImport}
              disabled={loading}
              className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 text-zinc-950 font-black rounded-xl text-xs flex items-center gap-2 shadow-lg shadow-amber-500/25 active:scale-95 transition disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4" />
              {loading ? 'Guardando en Base de Datos...' : 'CONFIRMAR E IMPORTAR'}
            </button>
          </div>

          {/* Tabla de Productos Validados */}
          <div className="space-y-2">
            {parsedProducts.map((p, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800/80 rounded-2xl p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="px-2 py-0.5 rounded-md bg-amber-500/15 text-black dark:text-white text-[10px] font-bold">
                        {categoryLabels[p.categoria] || p.categoria} • {p.genero === 'M' ? 'Hombre' : p.genero === 'F' ? 'Dama' : 'Unisex'}
                      </span>
                      <span className="text-[10px] text-stone-500 dark:text-zinc-400 font-medium">
                        Proveedor: <b className="text-zinc-200">{p.proveedor}</b>
                      </span>
                    </div>
                    <h4 className="text-sm font-bold text-stone-900 dark:text-white leading-tight">{p.nombre}</h4>
                    {/* Link de origen del proveedor */}
                    {p.url_origen ? (
                      <a
                        href={p.url_origen}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-black dark:text-white hover:text-neutral-700 dark:text-neutral-300 underline truncate block max-w-[220px] mt-0.5"
                      >
                        🔗 Ver en {p.proveedor}
                      </a>
                    ) : (
                      <span className="text-[10px] text-zinc-600 mt-0.5 block">Sin URL de origen</span>
                    )}
                  </div>

                  <div className="text-right flex-shrink-0">
                    <span className="text-sm font-black text-stone-900 dark:text-white block">
                      Gs. {p.precio_venta.toLocaleString('es-PY')}
                    </span>
                    <span className="text-[10px] text-stone-500 dark:text-zinc-400">
                      FOB: {p.costo_moneda_origen} {p.moneda_compra}
                    </span>
                  </div>
                </div>

                {/* Variantes del Producto (Talles y Colores) */}
                <div className="flex flex-wrap gap-1.5 pt-2 border-t border-neutral-200 dark:border-zinc-800/80">
                  {p.variantes.map((v, vIdx) => (
                    <span
                      key={vIdx}
                      className="px-2.5 py-1 rounded-xl bg-[#fcfbf9] dark:bg-zinc-950 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-neutral-200 dark:border-zinc-800 text-[11px] text-stone-700 dark:text-zinc-300 flex items-center gap-1.5"
                    >
                      <span className="font-semibold text-stone-900 dark:text-white">{v.color}</span>
                      <span className="text-stone-400 dark:text-zinc-500">|</span>
                      <span>{v.talle_medida}</span>
                      <span className="px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-400 font-bold text-[10px]">
                        {v.stock} u.
                      </span>
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Pantalla de Éxito Post-Importación */}
      {successResult && (
        <div className="bg-white dark:bg-zinc-900 text-stone-900 dark:text-stone-100 border-neutral-200 dark:border-neutral-200 dark:border-zinc-800 border border-emerald-500/40 rounded-3xl p-8 text-center space-y-4 animate-in zoom-in-95">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-10 h-10" />
          </div>

          <div>
            <h3 className="text-lg font-black text-stone-900 dark:text-white">¡Importación Masiva Exitosa!</h3>
            <p className="text-xs text-stone-500 dark:text-zinc-400 mt-1 max-w-md mx-auto">
              {successResult.message}
            </p>
          </div>

          <div className="pt-2 flex justify-center gap-3">
            <button
              onClick={onBack}
              className="px-6 py-3 bg-black hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black shadow-sm font-bold rounded-xl text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
            >
              Ver en el Catálogo de Stock
            </button>
            <button
              onClick={() => {
                setFile(null);
                setParsedProducts([]);
                setSuccessResult(null);
              }}
              className="px-4 py-3 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold rounded-xl text-xs transition"
            >
              Cargar Otro Archivo
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
