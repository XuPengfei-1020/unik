import {
  List,
  ListItem,
  Card,
  CardContent,
  CardActions,
  Typography,
  Button,
  Chip,
  Box,
  IconButton,
  Tooltip,
  Divider,
  Paper
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Title as TitleIcon,
  Language as LanguageIcon,
  FilterAlt as FilterAltIcon,
  Label as LabelIcon,
  Info as InfoIcon
} from '@mui/icons-material';
import {
  RegexIcon,
  CaseSensitiveIcon,
  WholeWordIcon
} from './icons';
import { styled } from '@mui/material/styles';

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
  backgroundColor: 'rgba(25, 118, 210, 0.12)',
  color: '#1976d2',
  marginLeft: '0.5em',
  fontSize: '0.8em'
}));

function RuleCard({ rule, onEdit, onDelete }) {
  // 确保 tags 是数组
  const tags = Array.isArray(rule.tags) ? rule.tags : [];

  return (
    <Card
      sx={{
        mb: 1.5,
        width: '100%',
        overflow: 'visible'
      }}
      className="MuiCard-root"
    >
      <CardContent className="rule-card-content" sx={{ py: 1.5 }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography
            variant="h6"
            component="div"
            className="rule-domain"
            sx={{ fontSize: '1rem' }}
          >
            {rule.domain}
          </Typography>
          <Box className="rule-tags-container" sx={{ display: 'flex', alignItems: 'center' }}>
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

        <Box className="rule-section" sx={{ mb: 1 }}>
          {rule.matchRules.titlePattern?.pattern && (
            <Box mb={1}>
              <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                  当原标题包含：
                </Box>
                <Box component="span" sx={{ ml: 1, color: 'text.primary' }}>
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
                <Box component="span" sx={{ ml: 1, color: 'text.primary' }}>
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

        <Box className="rule-section">
          <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
            {rule.applyRules.titleScript ? (
              <>
                <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                  则执行 Javascript 生成网址标题：
                </Box>
                <CodeIcon fontSize="small" sx={{ ml: 0.5, color: 'info.main' }} />
              </>
            ) : (
              <>
                <Box component="span" sx={{ color: 'rgba(0, 0, 0, 0.4)' }}>
                  则把网址标题改为：
                </Box>
                <TitleIcon fontSize="small" sx={{ ml: 0.5, color: 'success.main' }} />
              </>
            )}
          </Typography>
          <Box
            className="rule-pattern"
            sx={{
              mt: 0.5,
              backgroundColor: rule.applyRules.titleScript
                ? 'rgba(33, 150, 243, 0.05)'
                : 'rgba(76, 175, 80, 0.05)',
              borderLeft: '3px solid',
              borderColor: rule.applyRules.titleScript
                ? 'info.main'
                : 'success.main',
              p: 1,
              borderRadius: '0 4px 4px 0',
              whiteSpace: 'pre-wrap',
              wordBreak: 'break-all',
              fontFamily: 'monospace'
            }}
          >
            {rule.applyRules.fixedTitle || rule.applyRules.titleScript}
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'flex-end', p: 0.5 }}>
        <Tooltip title="编辑规则">
          <IconButton
            onClick={() => onEdit(rule)}
            size="small"
            color="primary"
            sx={{
              mr: 0.5,
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.08)'
              }
            }}
          >
            <EditIcon fontSize="small" />
          </IconButton>
        </Tooltip>
        <Tooltip title="删除规则">
          <IconButton
            onClick={() => onDelete(rule.id)}
            size="small"
            color="error"
            sx={{
              '&:hover': {
                backgroundColor: 'rgba(244, 67, 54, 0.08)'
              }
            }}
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      </CardActions>
    </Card>
  );
}

export function RuleList({ rules, onEdit, onDelete }) {
  if (!rules.length) {
    return (
      <Box className="empty-state">
        <InfoIcon />
        <Typography variant="body1" color="text.secondary" align="center">
          暂无规则
        </Typography>
        <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
          点击右上角的"添加规则"按钮创建新规则
        </Typography>
      </Box>
    );
  }

  return (
    <List sx={{ p: 2 }}>
      {rules.map(rule => (
        <ListItem key={rule.id} disablePadding sx={{ mb: 2 }}>
          <RuleCard
            rule={rule}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        </ListItem>
      ))}
    </List>
  );
}