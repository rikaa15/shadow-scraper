import {ThemeConfig, theme} from "antd";
import { createStyles } from 'antd-style';

export const antdTheme: ThemeConfig = {
  algorithm: theme.darkAlgorithm,
  token: {
    fontFamily: 'Roboto Mono',
    fontSize: 14,
    colorBgContainer: '#19191A',
    // colorBorder: 'transparent'
  },
  components: {
    InputNumber: {
      algorithm: false,
      borderRadius: 3,
      colorBgContainer: '#232733',
      activeBorderColor: 'transparent',
      hoverBorderColor: 'transparent',
      // addonBg: '#2E2E38',
      // colorBgBase: '#26262C',
      // colorTextBase: '#ADAEB8',
      controlHeight: 36,
      // handleBg: '#222530',
      colorBorder: '#33344C',
      fontSize: 14,
      activeShadow: 'none'
    },
    Select: {
      colorBorder: '#383D57'
    },
    Input: {
      activeBg: '#19191A',
    },
    Slider: {
      colorPrimaryBorderHover: '#E4E4E8',
      handleActiveColor: '#E4E4E8',
      handleColor: '#E4E4E8',
      handleLineWidth: 2,
      handleLineWidthHover: 2.5,
      colorText: '#ADADB8'
    },
    Checkbox: {
      colorBorder: 'white'
    },
    Table: {
      borderColor: '#3A415775',
      colorBgContainer: '#1A1E2A',
      headerBg: '#1A1E2A',
      headerColor: '#E4E4E8',
      rowExpandedBg: '#1E222E',
      footerBg: '#1E222E',
    },
    Popover: {
      colorBgElevated: '#1A1E2A'
    },
    Tabs: {
      itemSelectedColor: '#00A3FF',
      inkBarColor: '#00A3FF',
      itemColor: '#E4E4E8',
      colorBorderSecondary: '#3A415775'
    },
    Collapse: {
      colorBorder: '#3A415775'
    }
  }
}

export const gradientButtonStyles = createStyles(({ prefixCls, css }) => ({
  linearGradientButton: css`
    &.${prefixCls}-btn-primary:not([disabled]):not(.${prefixCls}-btn-dangerous) {
      > span {
        position: relative;
      }

      &::before {
        content: '';
        background: linear-gradient(135deg, #6253e1, #04befe);
        position: absolute;
        inset: -1px;
        opacity: 1;
        transition: all 0.3s;
        border-radius: inherit;
      }

      &:hover::before {
        opacity: 0;
      }
    }
  `,
}));
