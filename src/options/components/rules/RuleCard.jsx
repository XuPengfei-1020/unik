import {
  Typography,
  IconButton,
  Chip,
  Box,
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Title as TitleIcon,
  Label as LabelIcon,
  ContentCopy as CopyIcon
} from '@mui/icons-material';
import {
  RegexIcon,
  CaseSensitiveIcon,
  WholeWordIcon
} from '../icons';
import { styled } from '@mui/material/styles';
import React from 'react';

// 添加新的样式组件
const IconGroup = styled('div')({
  display: 'flex',
  gap: '2px',
  alignItems: 'center'
});

const IconWrapper = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '2px',
  borderRadius: '4px',
  backgroundColor: 'rgba(25, 118, 210, 0.08)',
  color: 'rgba(0, 0, 0, 0.4)',
  marginLeft: '0.5em',
  fontSize: '0.8em'
}));

const ActionLink = styled('a')(({ theme }) => ({
  display: 'inline-flex',
  alignItems: 'center',
  color: theme.palette.primary.main,
  fontSize: '0.75rem',
  textDecoration: 'none',
  padding: '4px 8px',
  cursor: 'pointer',
  '&:hover': {
    textDecoration: 'underline'
  },
  '& .MuiSvgIcon-root': {
    fontSize: '1rem',
    marginRight: '4px'
  }
}));

// 添加文本截断组件
const TruncatedText = styled(Typography)({
  whiteSpace: 'nowrap',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  maxWidth: '100%'
});

// 添加规则内容容器
const RuleContent = styled(Box)(({ isScript }) => ({
  display: 'flex',
  alignItems: 'flex-start',
  gap: '8px',
  '&.overflow .content::after': {
    opacity: 1
  },
  '& .content': {
    flex: 1,
    whiteSpace: isScript ? 'pre-wrap' : 'nowrap',
    overflow: isScript ? 'hidden' : 'hidden',
    textOverflow: isScript ? 'none' : 'ellipsis',
    maxHeight: isScript ? '7em' : '1.5em',
    lineHeight: isScript ? '1.5' : '1.5',
    display: isScript ? '-webkit-box' : 'block',
    WebkitLineClamp: isScript ? 7 : 1,
    WebkitBoxOrient: 'vertical',
    wordBreak: 'break-all',
    fontFamily: 'monospace',
    position: 'relative',
    '&::after': isScript ? {
      content: '""',
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: '1.5em',
      background: 'linear-gradient(transparent, white)',
      pointerEvents: 'none',
      opacity: 0,
      transition: 'opacity 0.2s'
    } : {}
  }
}));

export function RuleCard({ rule, onEdit, onDelete }) {
  // 确保 tags 是数组
  const tags = Array.isArray(rule.tags) ? rule.tags : [];
  const [isOverflow, setIsOverflow] = React.useState(false);
  const contentRef = React.useRef(null);

  React.useEffect(() => {
    if (contentRef.current && rule.applyRules.titleScript) {
      const element = contentRef.current;
      setIsOverflow(element.scrollHeight > element.clientHeight);
    }
  }, [rule.applyRules.titleScript, rule.applyRules.fixedTitle]);

  const handleCopy = () => {
    const content = rule.applyRules.fixedTitle || rule.applyRules.titleScript;
    navigator.clipboard.writeText(content);
  };

  return (
    <Box
      sx={{
        py: 2,
        px: 2,
        borderBottom: '1px solid',
        borderColor: 'divider',
        '&:last-child': {
          borderBottom: 'none'
        }
      }}
    >
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flex: 1, minWidth: 0 }}>
          <Tooltip title={rule.domain} placement="top">
            <TruncatedText
              variant="subtitle1"
              component="div"
              className="rule-domain"
              sx={{
                fontSize: '0.95rem',
                fontWeight: 500,
                maxWidth: '40%'
              }}
            >
              {rule.domain}
            </TruncatedText>
          </Tooltip>
          <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                icon={<LabelIcon fontSize="small" />}
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  color: 'primary.main',
                  fontWeight: 500,
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 1
                  }
                }}
              />
            ))}
          </Box>
        </Box>
        <Box sx={{ display: 'flex', gap: 1, ml: 1 }}>
          <Tooltip title="编辑规则">
            <ActionLink onClick={() => onEdit(rule)}>
              <EditIcon />
              编辑
            </ActionLink>
          </Tooltip>
          <Tooltip title="删除规则">
            <ActionLink onClick={() => onDelete(rule.id)}>
              <DeleteIcon />
              删除
            </ActionLink>
          </Tooltip>
        </Box>
      </Box>

      <Box sx={{ mb: 1 }}>
        {rule.matchRules.titlePattern?.pattern && (
          <Box mb={1}>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                当原标题包含：
              </Box>
              <Box component="span" sx={{
                ml: 1,
                color: 'text.primary',
                maxWidth: 'calc(100% - 180px)',
                display: 'inline-block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {rule.matchRules.titlePattern.pattern}
              </Box>
              <IconGroup>
                {rule.matchRules.titlePattern.isRegex && (
                  <Tooltip title="使用正则表达式">
                    <IconWrapper>
                      <RegexIcon />
                    </IconWrapper>
                  </Tooltip>
                )}
                {rule.matchRules.titlePattern.caseSensitive && (
                  <Tooltip title="区分大小写">
                    <IconWrapper>
                      <CaseSensitiveIcon />
                    </IconWrapper>
                  </Tooltip>
                )}
                {rule.matchRules.titlePattern.wholeWord && (
                  <Tooltip title="完整匹配">
                    <IconWrapper>
                      <WholeWordIcon />
                    </IconWrapper>
                  </Tooltip>
                )}
              </IconGroup>
            </Typography>
          </Box>
        )}

        {rule.matchRules.urlPattern?.pattern && (
          <Box>
            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
              <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                当网址URL包含：
              </Box>
              <Box component="span" sx={{
                ml: 1,
                color: 'text.primary',
                maxWidth: 'calc(100% - 180px)',
                display: 'inline-block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis'
              }}>
                {rule.matchRules.urlPattern.pattern}
              </Box>
              <IconGroup>
                {rule.matchRules.urlPattern.isRegex && (
                  <Tooltip title="使用正则表达式">
                    <IconWrapper>
                      <RegexIcon />
                    </IconWrapper>
                  </Tooltip>
                )}
                {rule.matchRules.urlPattern.caseSensitive && (
                  <Tooltip title="区分大小写">
                    <IconWrapper>
                      <CaseSensitiveIcon />
                    </IconWrapper>
                  </Tooltip>
                )}
                {rule.matchRules.urlPattern.wholeWord && (
                  <Tooltip title="完整匹配">
                    <IconWrapper>
                      <WholeWordIcon />
                    </IconWrapper>
                  </Tooltip>
                )}
              </IconGroup>
            </Typography>
          </Box>
        )}
      </Box>

      <Box>
        <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
          {rule.applyRules.titleScript ? (
            <>
              <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                则执行 Javascript 生成网址标题：
              </Box>
              <CodeIcon fontSize="small" sx={{ ml: 0.5, color: 'info.main' }} />
              <Tooltip title="复制内容">
                <IconButton
                  size="small"
                  onClick={handleCopy}
                  sx={{
                    color: 'info.main',
                    padding: '2px',
                    minWidth: 'auto',
                    ml: 1,
                    backgroundColor: 'transparent !important',
                    '&:hover': {
                      backgroundColor: 'transparent !important'
                    },
                    '& .MuiSvgIcon-root': {
                      fontSize: '1rem'
                    },
                    '&:hover .MuiSvgIcon-root': {
                      color: 'info.dark'
                    }
                  }}
                >
                  <CopyIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          ) : (
            <>
              <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                则把网页标题更改为：
              </Box>
            </>
          )}
        </Typography>
        <RuleContent
          isScript={rule.applyRules.titleScript}
          className={isOverflow ? 'overflow' : ''}
          sx={{
            mt: 0.5,
            borderLeft: '3px solid',
            borderColor: rule.applyRules.titleScript
              ? 'info.main'
              : 'success.main',
            p: 1,
            borderRadius: '0 4px 4px 0'
          }}
        >
          <Box className="content" ref={contentRef}>
            {rule.applyRules.fixedTitle || rule.applyRules.titleScript}
          </Box>
        </RuleContent>
      </Box>
    </Box>
  );
}