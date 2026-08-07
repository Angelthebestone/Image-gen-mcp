## Purpose

Automatiza la generación de imágenes en ChatGPT web: el server abre el sitio, envía el prompt del usuario con la sesión de cuenta ya iniciada y entrega la imagen generada.

## ADDED Requirements

### Requirement: Sesión persistente de ChatGPT

El server MCP SHALL mantener un perfil persistente de navegador Chromium que conserve la sesión de OpenAI entre ejecuciones, de modo que el usuario solo necesite iniciar sesión manualmente la primera vez.

#### Scenario: Primera ejecución sin sesión

- **WHEN** el server se inicia y no existe una sesión activa de ChatGPT en el perfil persistente
- **THEN** el server abre el navegador en `chatgpt.com` y reporta el estado de sesión como no autenticado, permitiendo al usuario iniciar sesión manualmente

#### Scenario: Ejecuciones posteriores con sesión guardada

- **WHEN** el server se inicia y el perfil persistente ya contiene una sesión de OpenAI válida
- **THEN** el server usa la sesión guardada sin requerir un nuevo inicio de sesión

### Requirement: Envío de prompt de generación de imágenes

El server MCP SHALL aceptar un prompt de texto, navegar a ChatGPT web y enviar el prompt en el modo de generación de imágenes (GPT-4o/DALL·E), esperando a que ChatGPT produzca la imagen resultante.

#### Scenario: Generación exitosa

- **WHEN** el usuario invoca la generación con un prompt válido y la sesión está activa
- **THEN** el server envía el prompt en ChatGPT web y devuelve la imagen generada

#### Scenario: Prompt vacío

- **WHEN** el usuario invoca la generación con un prompt vacío o solo espacios
- **THEN** el server rechaza la solicitud con un error claro indicando que el prompt es obligatorio

#### Scenario: Sin sesión activa

- **WHEN** el usuario invoca la generación sin una sesión de ChatGPT activa
- **THEN** el server falla con un error claro indicando que el usuario debe iniciar sesión primero

#### Scenario: Tiempo de espera agotado

- **WHEN** ChatGPT no completa la generación de la imagen dentro del tiempo límite configurado
- **THEN** el server falla con un error de timeout y no deja archivos parciales

### Requirement: Estados de sesión consultables

El server MCP SHALL exponer un tool para consultar el estado actual de la sesión de ChatGPT (autenticada o no) sin necesidad de generar una imagen.

#### Scenario: Consulta de estado

- **WHEN** el usuario consulta el estado de sesión
- **THEN** el server responde indicando si la sesión de ChatGPT está activa o si se requiere inicio de sesión manual

### Requirement: Robusto ante cambios de página

El server SHALL esperar por los selectores correctos con reintentos y tiempos de espera configurables, y SHALL reportar errores descriptivos cuando la interfaz de ChatGPT no responda como se espera.

#### Scenario: La interfaz no responde

- **WHEN** los elementos esperados de ChatGPT web no aparecen tras varios reintentos
- **THEN** el server falla con un mensaje que describe qué se esperaba encontrar y qué se encontró

#### Scenario: Generación fallida por ChatGPT

- **WHEN** ChatGPT responde con un error o se niega a generar la imagen solicitada
- **THEN** el server comunica el fallo al usuario sin intentar guardar nada

### Requirement: Relación de aspecto configurable

El server MCP SHALL aceptar una relación de aspecto opcional (`cuadrada`, `horizontal` o `vertical`) y SHALL aplicar el control de relación de aspecto de ChatGPT web antes de generar la imagen.

#### Scenario: Relación de aspecto válida

- **WHEN** el usuario indica una relación de aspecto soportada (`cuadrada`, `horizontal` o `vertical`)
- **THEN** el server selecciona esa relación en el control de ChatGPT antes de enviar el prompt

#### Scenario: Relación de aspecto omitida

- **WHEN** el usuario no indica relación de aspecto
- **THEN** el server usa la relación de aspecto por defecto de ChatGPT sin modificar el control

#### Scenario: Relación de aspecto inválida

- **WHEN** el usuario indica una relación de aspecto no soportada
- **THEN** el server rechaza la solicitud con un error claro listando los valores válidos

#### Scenario: Control de aspecto no disponible

- **WHEN** el usuario pide una relación de aspecto pero el control no está disponible en la interfaz de ChatGPT
- **THEN** el server falla con un error descriptivo y no envía el prompt

### Requirement: Edición de imágenes generadas

El server MCP SHALL aceptar una instrucción de edición en texto, enviarla en el hilo de conversación para modificar la imagen generada más reciente y devolver la imagen editada.

#### Scenario: Edición exitosa

- **WHEN** el usuario envía una instrucción de edición válida y existe una imagen generada en la conversación
- **THEN** el server envía la instrucción, espera la nueva imagen y la devuelve

#### Scenario: Instrucción vacía

- **WHEN** el usuario envía una instrucción de edición vacía o solo espacios
- **THEN** el server rechaza la solicitud con un error claro indicando que la instrucción es obligatoria

#### Scenario: Sin imagen previa

- **WHEN** el usuario solicita editar una imagen pero no hay una imagen generada en la conversación
- **THEN** el server falla con un error claro indicando que primero debe generarse una imagen

#### Scenario: Timeout en la edición

- **WHEN** ChatGPT no completa la edición dentro del tiempo límite configurado
- **THEN** el server falla con un error de timeout y no deja archivos parciales
