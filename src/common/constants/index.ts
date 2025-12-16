/**
 * Application-wide constants
 */

export const BCRYPT_SALT_ROUNDS = 10;

export const PIPELINE_TYPES = {
	REGRESSION: 'regression',
	SECURITY: 'security',
	PERFORMANCE: 'performance',
} as const;

export const USER_ROLES = {
	ADMIN: 'admin',
	VIEWER: 'viewer',
} as const;

export const ERROR_MESSAGES = {
	// Users
	USER_NOT_FOUND: 'Usuario no encontrado',
	USER_EMAIL_EXISTS: 'Ya existe un usuario con este email',
	USER_USERNAME_EXISTS: 'Ya existe un usuario con este username',
	INVALID_CREDENTIALS: 'Credenciales inválidas',
	UNAUTHORIZED: 'No autorizado',
	FORBIDDEN: 'No tienes permisos para realizar esta acción',

	// Projects
	PROJECT_NOT_FOUND: 'Proyecto no encontrado',
	PROJECT_PREFIX_EXISTS: 'Ya existe un proyecto con este prefijo',
	PROJECT_PRODUCT_EXISTS: 'Ya existe un proyecto con este nombre de producto',

	// Indicators
	INDICATOR_NOT_FOUND: 'Indicador no encontrado',
	INVALID_PIPELINE_TYPE: 'Tipo de pipeline inválido',

	// General
	VALIDATION_ERROR: 'Error de validación',
	INTERNAL_ERROR: 'Error interno del servidor',
};

export const SUCCESS_MESSAGES = {
	PROJECT_CREATED: 'Proyecto creado exitosamente',
	PROJECT_UPDATED: 'Proyecto actualizado exitosamente',
	PROJECT_DELETED: 'Proyecto eliminado exitosamente',
	USER_CREATED: 'Usuario creado exitosamente',
	USER_UPDATED: 'Usuario actualizado exitosamente',
	USER_DELETED: 'Usuario eliminado exitosamente',
	INDICATOR_CREATED: 'Indicador creado exitosamente',
	INDICATOR_DELETED: 'Indicador eliminado exitosamente',
};
