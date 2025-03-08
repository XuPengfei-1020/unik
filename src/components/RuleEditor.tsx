import React, { useState } from 'react';
import { TextField, Switch, Button } from '@mui/material';

function RuleEditor({ rule, onSave, onCancel }: RuleEditorProps) {
  const [name, setName] = useState(rule.name);
  const [enabled, setEnabled] = useState(rule.enabled);
  const [urlPattern, setUrlPattern] = useState(rule.urlPattern);
  const [titlePattern, setTitlePattern] = useState(rule.titlePattern);
  const [replacement, setReplacement] = useState(rule.replacement);
  const [priority, setPriority] = useState(rule.priority);

  const handleSave = () => {
    onSave({
      ...rule,
      name,
      enabled,
      urlPattern,
      titlePattern,
      replacement,
      priority,
    });
  };

  return (
    <div className="rule-editor">
      <TextField
        label="Name"
        value={name}
        onChange={(e) => setName(e.target.value)}
      />
      <Switch
        checked={enabled}
        onChange={(e) => setEnabled(e.target.checked)}
        label="Enabled"
      />
      <TextField
        label="URL Pattern"
        value={urlPattern}
        onChange={(e) => setUrlPattern(e.target.value)}
      />
      <TextField
        label="Title Pattern"
        value={titlePattern}
        onChange={(e) => setTitlePattern(e.target.value)}
      />
      <TextField
        label="Replacement"
        value={replacement}
        onChange={(e) => setReplacement(e.target.value)}
      />
      <TextField
        type="number"
        label="Priority"
        value={priority}
        onChange={(e) => setPriority(Number(e.target.value))}
      />
      <div className="button-group">
        <Button onClick={handleSave}>Save</Button>
        <Button onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default RuleEditor;