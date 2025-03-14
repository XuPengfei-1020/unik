import { Box, Typography } from '@mui/material';
import { Info as InfoIcon } from '@mui/icons-material';
import { RuleCard } from './RuleCard';

export function RuleList({ rules, onEdit, onDelete }) {
  if (!rules.length) {
    return (
      <Box className="empty-state" sx={{ p: 3, textAlign: 'center' }}>
        <InfoIcon sx={{ color: 'text.secondary', mb: 1 }} />
        <Typography variant="body1" color="text.secondary">
          暂无规则
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          点击右上角的"添加规则"按钮创建新规则
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      {rules.map(rule => (
        <RuleCard
          key={rule.id}
          rule={rule}
          onEdit={onEdit}
          onDelete={onDelete}
        />
      ))}
    </Box>
  );
}