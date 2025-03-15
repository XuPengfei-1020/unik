import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  styled
} from '@mui/material';
import { RuleFormContent, defaultRule } from './RuleFormContent';

// 自定义样式组件
const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  color: theme.palette.text.primary,
  padding: theme.spacing(3),
  paddingBottom: theme.spacing(2),
  fontSize: '1.2rem',
  fontWeight: 500,
  backgroundColor: '#fff',
  position: 'relative',
  zIndex: 1
}));

export function RuleForm({ open, rule, onSave, onClose, existingTags = [] }) {
  const [currentRule, setCurrentRule] = useState(rule);
  const [error, setError] = useState(null);

  const handleRuleChange = (updatedRule) => {
    setCurrentRule(updatedRule);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!currentRule) {
      onClose();
      return;
    }

    const validation = currentRule.validate();
    if (!validation.isValid) {
      setError(validation.error);
      return;
    }

    try {
      await onSave(currentRule);
      onClose();
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        elevation: 3,
        sx: {
          borderRadius: 2
        }
      }}
    >
      <StyledDialogTitle>
        {rule ? '编辑规则' : '添加规则'}
      </StyledDialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <RuleFormContent
          rule={rule}
          onChange={handleRuleChange}
          error={error}
          existingTags={existingTags}
          formId="rule-form-dialog"
        />
      </DialogContent>

      <DialogActions sx={{ justifyContent: 'center', p: 3 }}>
        <Button
          type="submit"
          form="rule-form-dialog"
          variant="contained"
          size="large"
          onClick={handleSubmit}
          sx={{
            minWidth: 120,
            borderRadius: 2,
            textTransform: 'none',
            fontSize: '1rem'
          }}
        >
          保存规则
        </Button>
      </DialogActions>
    </Dialog>
  );
}