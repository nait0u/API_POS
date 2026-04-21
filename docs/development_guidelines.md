1. Manejo de Identidad y Claves Primarias (PK)
Regla de Oro: Los campos que forman parte de una PK en el backend (especialmente date-time) deben tratarse como Cadenas Opacas de Identidad.

Inmutabilidad: Está estrictamente prohibido aplicar new Date(), .toISOString() o cualquier formateo de fecha a los valores recibidos de la API si estos van a ser enviados de vuelta en un PUT o POST.

Consistencia: El valor enviado al servidor debe ser un calco exacto (carácter por carácter) del valor recibido en el GET inicial.

2. Contrato de API (Basado en YAML)
Mapeo de Tipos: Seguir estrictamente las definiciones del archivo POS.AI_API.Precios.xListaDePrecios.yaml.

Parámetros de CaducarPrecio: Para la operación de caducar, se deben incluir obligatoriamente: EmpKey, ProductoKey, PrecioTimeInicio, PrecioUbiCod, CategoriaPrecioIdl, PrecioCantidad, PrecioHoraInicio y el Token.

3. Manejo de Errores y Mensajería
Estructura de Errores: El backend puede devolver errores en formato JSON o XML dentro de la propiedad Mensaje.

Validación de Éxito: No asumas éxito solo por recibir un 200 OK. Verifica siempre que el campo Mensaje contenga la cadena "OK".
