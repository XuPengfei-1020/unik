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

function RuleCard({ rule, onEdit, onDelete }) {
  // 确保 tags 是数组
  const tags = Array.isArray(rule.tags) ? rule.tags : [];

  return (
    <Card
      sx={{
        mb: 2,
        width: '100%',
        overflow: 'visible'
      }}
      className="MuiCard-root"
    >
      <CardContent className="rule-card-content">
        <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
          <Typography
            variant="h6"
            component="div"
            className="rule-domain"
          >
            {rule.domain}
          </Typography>
          <Box className="rule-tags-container">
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                icon={<LabelIcon fontSize="small" />}
                sx={{
                  backgroundColor: 'rgba(25, 118, 210, 0.08)',
                  color: 'primary.main',
                  fontWeight: 500
                }}
              />
            ))}
          </Box>
        </Box>

        <Box className="rule-section">
          <Typography
            variant="subtitle2"
            className="rule-section-title"
          >
            <FilterAltIcon fontSize="small" />
            匹配条件
          </Typography>

          {rule.matchRules.titlePattern?.pattern && (
            <Box mb={1.5}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                标题匹配:
              </Typography>
              <Box className="rule-pattern">
                {rule.matchRules.titlePattern.pattern}
              </Box>
              <Box className="rule-pattern-options">
                {rule.matchRules.titlePattern.isRegex && (
                  <Chip
                    label="正则"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      color: 'success.main'
                    }}
                  />
                )}
                {rule.matchRules.titlePattern.caseSensitive && (
                  <Chip
                    label="区分大小写"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 152, 0, 0.08)',
                      color: 'warning.main'
                    }}
                  />
                )}
                {rule.matchRules.titlePattern.wholeWord && (
                  <Chip
                    label="完整匹配"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.08)',
                      color: 'info.main'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}

          {rule.matchRules.urlPattern?.pattern && (
            <Box>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                URL匹配:
              </Typography>
              <Box className="rule-pattern">
                {rule.matchRules.urlPattern.pattern}
              </Box>
              <Box className="rule-pattern-options">
                {rule.matchRules.urlPattern.isRegex && (
                  <Chip
                    label="正则"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(76, 175, 80, 0.08)',
                      color: 'success.main'
                    }}
                  />
                )}
                {rule.matchRules.urlPattern.caseSensitive && (
                  <Chip
                    label="区分大小写"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(255, 152, 0, 0.08)',
                      color: 'warning.main'
                    }}
                  />
                )}
                {rule.matchRules.urlPattern.wholeWord && (
                  <Chip
                    label="完整匹配"
                    size="small"
                    sx={{
                      backgroundColor: 'rgba(33, 150, 243, 0.08)',
                      color: 'info.main'
                    }}
                  />
                )}
              </Box>
            </Box>
          )}
        </Box>

        <Box className="rule-section">
          <Typography
            variant="subtitle2"
            className="rule-section-title"
          >
            {rule.applyRules.titleScript ? (
              <CodeIcon fontSize="small" />
            ) : (
              <TitleIcon fontSize="small" />
            )}
            应用规则
          </Typography>

          <Box
            className="rule-pattern"
            sx={{
              backgroundColor: rule.applyRules.titleScript
                ? 'rgba(33, 150, 243, 0.05)'
                : 'rgba(76, 175, 80, 0.05)',
              borderLeft: '3px solid',
              borderColor: rule.applyRules.titleScript
                ? 'info.main'
                : 'success.main',
            }}
          >
            {rule.applyRules.fixedTitle || rule.applyRules.titleScript}
          </Box>
        </Box>
      </CardContent>

      <Divider />

      <CardActions sx={{ justifyContent: 'flex-end', p: 1 }}>
        <Tooltip title="编辑规则">
          <IconButton
            onClick={() => onEdit(rule)}
            size="small"
            color="primary"
            sx={{
              mr: 1,
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