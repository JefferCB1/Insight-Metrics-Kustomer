// src/theme.ts

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  typography: {
    fontFamily: [
      'Inter', // La fuente que acabamos de importar
      'sans-serif' // Fuentes de respaldo
    ].join(','),
  },
});

export default theme;