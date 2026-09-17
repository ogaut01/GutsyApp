# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.
- NEVER execute commands that kill Python processes globally, such as `Stop-Process -Name python` or `taskkill`.

## Project Overview

This is a full-stack e-commerce application for accessories with:
- **Backend**: Django REST API (`backend_accesorios/`) - Handles inventory, sales, purchases, and financial tracking
- **Frontend**: React + Vite application (`frontend_accesorios/`) - User interface for managing the e-commerce operations

## Development Commands

### Backend (Django)
```bash
# Activate virtual environment (Windows)
backend_accesorios\.venv\Scripts\activate

# Run development server
cd backend_accesorios
python manage.py runserver  # Runs on http://127.0.0.1:8000

# Run tests
python manage.py test tienda  # Runs tests for the tienda app
python manage.py test         # Runs all tests

# Create migrations after model changes
python manage.py makemigrations tienda

# Apply migrations
python manage.py migrate

# Create superuser for admin access
python manage.py createsuperuser

# Load initial data (if seed data exists)
python manage.py seed_data

# Update currency exchange rates
python manage.py actualizar_cotizaciones

# Access Django admin interface
# Visit http://127.0.0.1:8000/admin/ after creating superuser
```

### Frontend (React/Vite)
```bash
# Install dependencies
cd frontend_accesorios
npm install

# Run development server
npm run dev  # Runs on http://localhost:5173 (proxies API to backend)

# Build for production
npm run build

# Preview production build
npm run preview
```

## Code Architecture

### Backend Structure (`backend_accesorios/`)
- **core/** - Django project configuration:
  - `settings.py` - Project configuration (SQLite database, CORS enabled, internationalization)
  - `urls.py` - Main URL routing
  - `wsgi.py` - WSGI configuration
- **tienda/** - Main Django app containing business logic:
  - `models.py` - Database models:
    - Proveedor (Supplier), Courier (Shipping), Material, LoteImportacion (Import Lot)
    - Producto (Product), VarianteProducto (Product Variant)
    - Venta (Sale), DetalleVenta (Sale Detail)
    - Gasto (Expense), Configuracion (Configuration)
    - ItemLote (Intermediate model linking Products to Import Lots)
  - `api_views.py` - REST API ViewSets using Django REST Framework:
    - ProductoViewSet: Product catalog with filtering by category/gender/lot
    - VarianteProductoViewSet: Product variants with SKU/barcode search
    - LoteImportacionViewSet: Import lots with cost calculation and freight updates
    - VentaViewSet: Sales management
    - GastoViewSet: Expense tracking
    - ConfiguracionViewSet: System configuration
    - Custom endpoints: dashboard_stats, upload-foto, actualizar_flete, sync-rates
  - `serializers.py` - DRF serializers for all models
  - `services/currency.py` - Currency exchange rate synchronization service
  - `management/commands/` - Custom Django management commands:
    - `seed_data.py` - Loads sample data
    - `actualizar_cotizaciones.py` - Updates currency rates
- **templates/** - Django templates (if server-side rendering used)
- **media/** - Uploaded product images
- **staticfiles/** - Collected static files (CSS, JS, images)
- **db.sqlite3** - SQLite development database

### Frontend Structure (`frontend_accesorios/`)
- **src/** - React application source:
  - **components/** - Reusable UI components (buttons, forms, cards, modals, tables)
  - **pages/** - Page-level components (Dashboard, Products, Sales, etc.)
  - **hooks/** - Custom React hooks for API calls and state management
  - **utils/** - Utility functions (API service, formatting helpers)
  - **styles/** - Tailwind CSS configuration and custom styles
  - **main.jsx** - Application entry point
  - **App.jsx** - Main application component with routing
- **vite.config.js** - Vite configuration with proxy to backend API:
  - Proxies `/api` to `http://127.0.0.1:8000`
  - Proxies `/media` to `http://127.0.0.1:8000` (for serving uploaded media)
- **tailwind.config.js** - Tailwind CSS configuration

## Key Features

1. **Inventory Management**:
   - Product catalog with variants (sizes, colors)
   - Import lot tracking with automatic cost calculation
   - Real-time stock levels and inventory valuation

2. **Sales & Financial Tracking**:
   - Point-of-sale functionality
   - Sales reporting and analytics
   - Expense tracking
   - Profit calculation (bruta and neta)

3. **Multi-currency Support**:
   - Automatic exchange rate synchronization
   - Cost calculations in local currency (PYG - Guaraní)

4. **Media Handling**:
   - Product image upload with validation (JPEG, PNG, WebP, HEIC/HEIF)
   - Automatic cleanup of old images

5. **API-First Design**:
   - RESTful API built with Django REST Framework
   - Comprehensive filtering and search capabilities
   - Browsable API interface

## Important API Endpoints

All API endpoints are under `/api/` and proxied from frontend:
- **GET/POST** `/api/proveedores/` - Suppliers
- **GET/POST** `/api/couriers/` - Shipping companies
- **GET/POST** `/api/materiales/` - Materials
- **GET/POST** `/api/lotes-importacion/` - Import lots
  - **POST** `/api/lotes-importacion/{id}/actualizar-flete/` - Update freight costs
- **GET/POST** `/api/productos/` - Products (with search/filter)
  - **POST** `/api/productos/{id}/upload-foto/` - Upload product image
- **GET/POST** `/api/variantes-producto/` - Product variants
- **GET/POST** `/api/ventas/` - Sales
- **GET/POST** `/api/gastos/` - Expenses
- **GET/POST** `/api/itemlotes/` - Items in Lotes (relationship between products and lots)
- **GET** `/api/configuracion/` - System configuration
  - **POST** `/api/configuracion/sync-rates/` - Sync currency exchange rates
- **GET** `/api/dashboard-stats/` - Key metrics for dashboard

## Common Development Tasks

### Adding New Models/Features
1. Update `tienda/models.py` with new model
2. Create serializer in `tienda/serializers.py`
3. Create ViewSet in `tienda/api_views.py`
4. Register routes in `tienda/api_urls.py` (if using routers) or add to main urls
5. Run migrations: `python manage.py makemigrations tienda` then `python manage.py migrate`

### Working with the Database
- The SQLite database file is located at `backend_accesorios/db.sqlite3`
- To reset development state: Delete `db.sqlite3` and run migrations again
- Sample data can be loaded with: `python manage.py seed_data`

### API Testing
- Django REST Framework provides a browsable API interface
- Visit `http://127.0.0.1:8000/api/` to explore available endpoints
- Frontend consumes API from `/api/` endpoints via Vite proxy
- Test API directly with tools like curl or Postman against `http://127.0.0.1:8000/api/`

### Currency Exchange Rates
- Rates are synchronized automatically via management command
- Manual sync: `python manage.py actualizar_cotizaciones`
- API endpoint: `POST /api/configuracion/sync-rates/`

## Environment & Configuration

- **Backend**: Runs on port 8000 (Django development server)
- **Frontend**: Runs on port 5173 (Vite development server) with API proxy
- **Database**: SQLite (file-based, zero configuration)
- **CORS**: Enabled for frontend-backend communication
- **Internationalization**: Spanish (Paraguay) locale (`es-py`)
- **Timezone**: America/Asuncion

## Troubleshooting

- **Port conflicts**: If port 8000 or 5173 is in use, stop existing processes or change ports in configurations
- **Migration issues**: Delete migration files in `tienda/migrations/` (except __init__.py) and db.sqlite3, then restart
- **Static files**: Run `python manage.py collectstatic` if serving static files in production
- **Media files**: Ensure MEDIA_ROOT and MEDIA_URL settings are correct for uploads to work