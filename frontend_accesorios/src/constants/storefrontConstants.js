import {
  Tag, ShieldCheck, Award, Layers, Truck
} from 'lucide-react';

// ============================================================================
// 🏦 CONFIGURACIÓN DE CUENTAS BANCARIAS & ALIAS (EDITABLE)
// ============================================================================
export const BANK_ACCOUNTS = [
  {
    id: 'ueno',
    name: 'ueno bank',
    shortName: 'ueno bank',
    tipoAlias: 'Cédula de Identidad (C.I.)',
    tipoAliasBadge: 'C.I.',
    alias: '5554700',
    titular: 'Osmar Jose Gauto Martinez',
    documento: '5.554.700',
    cuenta: '15782039',
    tipoCuenta: 'Caja de Ahorro',
  },
  {
    id: 'continental',
    name: 'Banco Continental S.A.E.C.A.',
    shortName: 'Continental',
    tipoAlias: 'Correo Electrónico (Email)',
    tipoAliasBadge: 'Email',
    alias: 'ogautom01@gmail.com',
    titular: 'Osmar Jose Gauto Martinez',
    documento: '5.554.700',
    cuenta: '010045504404',
    tipoCuenta: 'Caja de Ahorro',
  },
  {
    id: 'Itau',
    name: 'Banco Itaú Paraguay S.A.',
    shortName: 'Banco Itaú',
    tipoAlias: 'Número de Celular',
    tipoAliasBadge: 'Celular',
    alias: '0986191356',
    titular: 'Osmar Jose Gauto Martinez',
    documento: '5.554.700',
    cuenta: '320568978',
    tipoCuenta: 'Caja de Ahorro',
  },
];

// Categorías amigables para el cliente con Slugs para URLs directas (/collares, /pulseras, etc.)
export const ALL_STORE_CATEGORIES = [
  { id: 'ALL', label: 'Todos', slug: 'todos', icon: Tag },
  { id: 'AN', label: 'Anillos', slug: 'anillos', icon: Tag },
  { id: 'CA', label: 'Cadenas', slug: 'cadenas', icon: Tag },
  { id: 'CO', label: 'Collares', slug: 'collares', icon: Tag },
  { id: 'PU', label: 'Pulseras & Brazaletes', slug: 'pulseras', icon: Tag },
  { id: 'AR', label: 'Aros', slug: 'aros', icon: Tag },
  { id: 'ST', label: 'Sets & Combos', slug: 'sets', icon: Tag },
  { id: 'PA', label: 'Parejas', slug: 'parejas', icon: Tag },
  { id: 'LE', label: 'Lentes', slug: 'lentes', icon: Tag },
  { id: 'TO', label: 'Tobilleras', slug: 'tobilleras', icon: Tag },
  { id: 'DI', label: 'Dijes & Colgantes', slug: 'dijes', icon: Tag },
  { id: 'OT', label: 'Otros', slug: 'otros', icon: Tag },
];

// Mensajes para la marquesina infinita superior
export const ANNOUNCEMENT_ITEMS = [
  { text: 'MATERIALES SELECCIONADOS', icon: ShieldCheck },
  { text: 'GARANTÍA DE CALIDAD', icon: Award },
  { text: '+100 MODELOS', icon: Layers },
  { text: 'ENVÍOS A TODO EL PAÍS', icon: Truck },
];

// Opciones de Filtro de Color
export const COLOR_FILTER_OPTIONS = [
  { id: 'ALL', label: 'Todos los Colores' },
  { id: 'negro', label: 'Negro' },
  { id: 'plateado', label: 'Plateado' },
  { id: 'dorado', label: 'Dorado' },
  { id: 'rose_gold', label: 'Rose Gold' },
  { id: 'blanco', label: 'Blanco' },
];

// Teléfono WhatsApp oficial de Gutsy (Paraguay)
export const STORE_WHATSAPP = '595961370929'; // Formato internacional
export const STORE_WHATSAPP_DISPLAY = '+595 961 370 929';
