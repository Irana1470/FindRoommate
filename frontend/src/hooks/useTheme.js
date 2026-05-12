import { useThemeContext } from '../context/ThemeContext';

export { applyTheme, getInitialTheme as getStoredTheme, ThemeProvider } from '../context/ThemeContext';

export default function useTheme() {
  return useThemeContext();
}
