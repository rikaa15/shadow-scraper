import { deepMerge } from 'grommet/utils';
import {ExtendProps} from "grommet/themes/base";

export const palette = {
  White: '#FFFFFF',
  Black: '#0E0C1D'
};

export const grommet = {
  global: {
    focus: {
      border: {
        color: "transparent",
      },
    },
    colors: {},
    palette,
    select: {
      clear: {
        color: "brand",
      },
    },
    font: {
      family: "Roboto Mono",
      size: "14px",
      height: "22px",
      weight: 400
    },
  },
  checkBox: {
    size: '16px',
    color: 'white',
    border: {
      width: '2px',
      color: '#5359C6'
    },
    toggle: {
      color: '#5359C6'
    },
    icon: {
      size: '12px',
      extend: () => `
        background: #5359C6;
      `
    },
    check: {
      radius: '2px',
      thickness: '3px',
      extend: () => `
        border-color: #5359C6;
      `
    },
    hover: {
      border: {
        color: '#5359C6'
      },
    }
  },
  anchor: {
    color: 'text',
    textDecoration: "none",
    hover: {
      textDecoration: "none",
    },
  },
  button: {
    default: {}
  },
  dataTable: {
    border: {
      header: {
        color: 'border'
      }
    },
    body: {
      extend: () => ``
    },
  },
  text: {
    xsmall: {
      size: '10px',
      height: '18px',
    },
    small: {
      size: '12px',
      height: '20px',
    },
    medium: {
      size: '14px',
      height: '22px',
    },
    large: {
      size: '18px',
      height: '24px',
    },
    xlarge: {
      size: '22px',
      height: '28px',
    },
    xxlarge: {
      size: '26px',
      height: '32px',
    },
  }
};

export const darkTheme = deepMerge(grommet, {
  global: {
    colors: {
      background: '#1A1E2A',
      accentWhite: '#E4E4E8',
      text: '#E6E8F0',
      textSecondary: '#A0A5B8',
      border: '#3A4157',
      positiveButtonBg: '#00c4b4',
      positiveButtonBgTransparent: '#00c4b49e',
      positiveButtonBgHover: '#00a396',
      negativeButtonBg: '#e63946',
      negativeButtonBgTransparent: '#e6394670',
      negativeButtonBgHover: '#c9303c',
      disabledButtonBg: '#495057',
      disabledButtonBgHover: '#343a40',
      accentOutcome: '#3a86ff',
      spinner: '#3a86ff',
      accent: '#FF007A',
      accentSecondary: '#34C759',
      widgetBg: '#2D3344',
      widgetBgHover: '#3A4157',
      panelBg: '#252B3B',
      headerBg: '#232733',
      negativeValue: '#e63946',
      positiveValue: '#34C759',
      divider: '#3A4157',
      filterButtonBg: '#FFFFFF14',
      filterButtonActiveBg: '#FFFFFF2D',
      menuItemHover: '#2D3344',
      menuButtonHoverBg: '#2D3344',
      primaryButtonBg: '#00A3FF',
    },
  },
  button: {
    extend: (props: ExtendProps<never>) => {
      const background = props.primary
        ? '#373E62'
        : 'rgba(255, 255, 255, 0.06);'
      const color = props.primary ? '#C6C7EC' : palette.White
      const hoverBackground = props.primary ? '#495383' : 'rgba(255, 255, 255, 0.08)'

      return `
        padding: 8px 16px;
        text-align: center;
        background: ${background};
        border-radius: 5px;
        font-size: 14px;
        font-weight: 500;
        line-height: 22px;
        color: ${color};
        user-select: none;
        
        &:hover {
          background: ${hoverBackground};
          color: ${palette.White}
        }
      `
    },
  },
});
