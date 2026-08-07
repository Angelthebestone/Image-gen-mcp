## Purpose

Gestiona dónde se guardan las imágenes generadas: una carpeta de salida configurable por el usuario que, por defecto, es la carpeta de Descargas del sistema.

## ADDED Requirements

### Requirement: Carpeta de salida configurable

El server MCP SHALL mantener una carpeta de salida configurable y SHALL exponer tools para consultarla y cambiarla en tiempo de ejecución.

#### Scenario: Consultar carpeta de salida actual

- **WHEN** el usuario consulta la carpeta de salida
- **THEN** el server responde con la ruta absoluta de la carpeta de salida actual

#### Scenario: Cambiar carpeta de salida

- **WHEN** el usuario establece una nueva carpeta de salida que existe y es un directorio
- **THEN** el server guarda esa carpeta como destino de las imágenes siguientes

#### Scenario: Carpeta inválida

- **WHEN** el usuario establece una carpeta que no existe o no es un directorio
- **THEN** el server rechaza el cambio con un error claro

### Requirement: Guardado de imágenes generadas

El server MCP SHALL guardar cada imagen generada en la carpeta de salida con un nombre único, evitando sobrescribir archivos existentes.

#### Scenario: Guardado exitoso en carpeta configurada

- **WHEN** una imagen se genera y hay una carpeta de salida configurada
- **THEN** la imagen se guarda en esa carpeta y el server devuelve la ruta absoluta del archivo guardado

#### Scenario: Guardado por defecto en Descargas

- **WHEN** una imagen se genera y no hay carpeta de salida configurada
- **THEN** la imagen se guarda en la carpeta de Descargas del sistema y el server devuelve la ruta absoluta

#### Scenario: Nombre de archivo único

- **WHEN** ya existe un archivo con el nombre propuesto en la carpeta de salida
- **THEN** el server guarda la imagen con un nombre distinto y único para no sobrescribir el existente

#### Scenario: Carpeta de salida no escribible

- **WHEN** la carpeta de salida no permite escritura
- **THEN** el server falla con un error claro indicando el problema de permisos

### Requirement: Persistencia de la configuración

El server MCP SHALL persistir la carpeta de salida configurada entre ejecuciones.

#### Scenario: Configuración recordada entre ejecuciones

- **WHEN** el usuario cambia la carpeta de salida y reinicia el server
- **THEN** el server conserva la carpeta configurada como carpeta de salida

### Requirement: Ruta de guardado por invocación

El server MCP SHALL aceptar una ruta de destino opcional en cada invocación de generación o edición, de modo que el LLM pueda elegir la ubicación del archivo en cualquier momento sin cambiar la configuración global.

#### Scenario: Guardado en ruta indicada

- **WHEN** el usuario indica una ruta de destino válida (directorio existente) en una invocación
- **THEN** el server guarda la imagen en esa ruta y devuelve la ruta absoluta del archivo

#### Scenario: Ruta inválida en la invocación

- **WHEN** el usuario indica una ruta de destino que no existe o no es un directorio
- **THEN** el server rechaza la solicitud con un error claro, sin modificar la configuración global

#### Scenario: Ruta omitida

- **WHEN** el usuario no indica ruta de destino en la invocación
- **THEN** el server usa la carpeta de salida configurada (o Descargas por defecto)

### Requirement: Nombre de archivo personalizado

El server MCP SHALL aceptar un nombre de archivo opcional en cada invocación, y SHALL sanitizar caracteres inválidos, añadir la extensión de imagen si falta y evitar sobrescribir archivos existentes.

#### Scenario: Nombre de archivo válido

- **WHEN** el usuario indica un nombre de archivo válido sin extensión
- **THEN** el server guarda la imagen con ese nombre y la extensión de imagen correspondiente, devolviendo la ruta absoluta

#### Scenario: Nombre de archivo con extensión

- **WHEN** el usuario indica un nombre de archivo que ya incluye una extensión de imagen
- **THEN** el server conserva la extensión indicada y guarda la imagen con ese nombre

#### Scenario: Caracteres inválidos en el nombre

- **WHEN** el nombre indicado contiene caracteres no permitidos para nombres de archivo
- **THEN** el server reemplaza o elimina los caracteres inválidos antes de guardar, evitando errores de sistema de archivos

#### Scenario: Nombre en conflicto

- **WHEN** ya existe un archivo con el nombre indicado en la carpeta de destino
- **THEN** el server añade un sufijo numérico para no sobrescribir el archivo existente

#### Scenario: Nombre de archivo omitido

- **WHEN** el usuario no indica nombre de archivo
- **THEN** el server genera un nombre por defecto único (`chatgpt-<timestamp>`)
