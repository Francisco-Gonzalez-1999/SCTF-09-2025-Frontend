# Estilos Compartidos - Módulo de Configuración

Este archivo contiene estilos reutilizables para los componentes del módulo de configuración.

## Uso

Los estilos están disponibles globalmente una vez importados en `styles.scss`. Simplemente usa las clases en tus componentes HTML.

## Clases Disponibles

### Page Header
```html
<div class="page-header">
  <div class="header-content">
    <div class="header-icon">
      <i class="pi pi-server"></i>
    </div>
    <div>
      <h2>Título</h2>
      <p>Descripción</p>
    </div>
  </div>
  <div class="header-actions">
    <!-- Botones de acción -->
  </div>
</div>
```

### Table Section
```html
<div class="table-section">
  <div class="section-header">
    <div class="section-header-left">
      <div class="section-icon" style="background: ...; color: ...;">
        <i class="pi pi-table"></i>
      </div>
      <div>
        <h3 class="section-title">Título</h3>
        <span class="section-subtitle">Subtítulo</span>
      </div>
    </div>
    <div class="section-header-right">
      <div class="search-wrapper">
        <i class="pi pi-search"></i>
        <input pInputText class="search-input" placeholder="Buscar..." />
      </div>
    </div>
  </div>
  <!-- Tabla aquí -->
</div>
```

### Empty State
```html
<div class="empty-state">
  <div class="empty-state-content">
    <div class="empty-icon">
      <i class="pi pi-inbox"></i>
    </div>
    <h3>No se encontraron registros</h3>
    <p>Descripción del estado vacío</p>
  </div>
</div>
```

### Loading Section
```html
<div class="loading-section">
  <p-progressSpinner></p-progressSpinner>
  <span class="loading-text">Cargando...</span>
</div>
```

### Dialog
```html
<p-dialog [styleClass]="'config-dialog'">
  <!-- Contenido -->
</p-dialog>
```

### Form
```html
<form class="config-form">
  <div class="field">
    <label>Campo <span class="text-red-500">*</span></label>
    <!-- Input -->
  </div>
</form>
```

### Chips y Textos
- `.id-chip` - Para IDs
- `.nombre-text` o `.name-text` - Para nombres
- `.descripcion-text` o `.description-text` - Para descripciones
- `.fecha-text` o `.date-text` - Para fechas
- `.estatus-tag` o `.status-tag` - Para tags de estado

## Ejemplo Completo

```html
<div class="container">
  <!-- Header -->
  <div class="page-header">
    <div class="header-content">
      <div class="header-icon">
        <i class="pi pi-cog"></i>
      </div>
      <div>
        <h2>Mi Catálogo</h2>
        <p>Gestiona los elementos del catálogo</p>
      </div>
    </div>
    <div class="header-actions">
      <p-button label="Nuevo" icon="pi pi-plus"></p-button>
    </div>
  </div>

  <!-- Table Section -->
  <div class="table-section config-table">
    <!-- Contenido de la tabla -->
  </div>
</div>
```
