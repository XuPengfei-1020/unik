import { SvgIcon } from '@mui/material';
import { Title as TitleIcon, Code as CodeIcon } from '@mui/icons-material';

const iconStyles = {
  fontSize: '20px',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: '1.2em',
  height: '1.2em',
  verticalAlign: 'middle',
  color: 'rgba(0, 0, 0, 0.54)',
  '&.selected': {
    color: '#1976d2'
  }
};

// 正则表达式图标
export const RegexIcon = (props) => (
  <SvgIcon {...props} sx={iconStyles}>
    <text
      x="50%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        font: 'bold 14px monospace'
      }}
    >
      .*
    </text>
  </SvgIcon>
);

// 区分大小写图标
export const CaseSensitiveIcon = (props) => (
  <SvgIcon {...props} sx={iconStyles}>
    <text
      x="32%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        font: 'bold 15px sans-serif'
      }}
    >
      A
    </text>
    <text
      x="68%"
      y="50%"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        font: '13px sans-serif'
      }}
    >
      a
    </text>
  </SvgIcon>
);

// 完整匹配图标
export const WholeWordIcon = (props) => (
  <SvgIcon {...props} sx={iconStyles}>
    <text
      x="50%"
      y="42%"
      textAnchor="middle"
      dominantBaseline="central"
      style={{
        font: '15px sans-serif'
      }}
    >
      ab
    </text>
    <line
      x1="6"
      y1="18"
      x2="18"
      y2="18"
      style={{
        stroke: 'currentColor',
        strokeWidth: 1.5
      }}
    />
  </SvgIcon>
);

export { TitleIcon, CodeIcon };