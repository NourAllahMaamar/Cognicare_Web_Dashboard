import { createContext, useContext } from 'react';

/**
 * The theme context object — created here so ThemeContext.jsx only exports
 * the ThemeProvider component, satisfying react-refresh/only-export-components.
 */
export const ThemeContext = createContext();

/**
 * Consume the theme context.
 */
export const useTheme = () => useContext(ThemeContext);
