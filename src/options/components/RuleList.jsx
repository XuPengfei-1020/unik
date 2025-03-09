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
  Tooltip
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Code as CodeIcon,
  Title as TitleIcon
} from '@mui/icons-material';

function RuleCard({ rule, onEdit, onDelete }) {
  // 确保 tags 是数组
  const tags = Array.isArray(rule.tags) ? rule.tags : [];

  return (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
          <Typography variant="h6" component="div">
            {rule.domain}
          </Typography>
          <Box>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{ mr: 0.5 }}
              />
            ))}
          </Box>
        </Box>

        {rule.matchRules.titlePattern?.pattern && (
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              标题匹配:
            </Typography>
            <Typography variant="body2">
              {rule.matchRules.titlePattern.pattern}
            </Typography>
            <Box ml={1}>
              {rule.matchRules.titlePattern.isRegex && (
                <Chip label="正则" size="small" sx={{ mr: 0.5 }} />
              )}
              {rule.matchRules.titlePattern.caseSensitive && (
                <Chip label="区分大小写" size="small" sx={{ mr: 0.5 }} />
              )}
              {rule.matchRules.titlePattern.wholeWord && (
                <Chip label="完整匹配" size="small" sx={{ mr: 0.5 }} />
              )}
            </Box>
          </Box>
        )}

        {rule.matchRules.urlPattern?.pattern && (
          <Box display="flex" alignItems="center" mb={1}>
            <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
              URL匹配:
            </Typography>
            <Typography variant="body2">
              {rule.matchRules.urlPattern.pattern}
            </Typography>
            <Box ml={1}>
              {rule.matchRules.urlPattern.isRegex && (
                <Chip label="正则" size="small" sx={{ mr: 0.5 }} />
              )}
              {rule.matchRules.urlPattern.caseSensitive && (
                <Chip label="区分大小写" size="small" sx={{ mr: 0.5 }} />
              )}
              {rule.matchRules.urlPattern.wholeWord && (
                <Chip label="完整匹配" size="small" sx={{ mr: 0.5 }} />
              )}
            </Box>
          </Box>
        )}

        <Box display="flex" alignItems="center">
          <Typography variant="body2" color="text.secondary" sx={{ mr: 1 }}>
            应用规则:
          </Typography>
          <Typography variant="body2">
            {rule.applyRules.fixedTitle || rule.applyRules.titleScript}
          </Typography>
          {rule.applyRules.titleScript ? (
            <Tooltip title="自定义脚本">
              <CodeIcon fontSize="small" sx={{ ml: 1 }} />
            </Tooltip>
          ) : (
            <Tooltip title="固定标题">
              <TitleIcon fontSize="small" sx={{ ml: 1 }} />
            </Tooltip>
          )}
        </Box>
      </CardContent>

      <CardActions>
        <IconButton onClick={() => onEdit(rule)} size="small" color="primary">
          <EditIcon />
        </IconButton>
        <IconButton onClick={() => onDelete(rule.id)} size="small" color="error">
          <DeleteIcon />
        </IconButton>
      </CardActions>
    </Card>
  );
}

export function RuleList({ rules, onEdit, onDelete }) {
  if (!rules.length) {
    return (
      <Typography variant="body1" color="text.secondary" align="center" py={4}>
        暂无规则
      </Typography>
    );
  }

  return (
    <List>
      {rules.map(rule => (
        <ListItem key={rule.id} disablePadding>
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