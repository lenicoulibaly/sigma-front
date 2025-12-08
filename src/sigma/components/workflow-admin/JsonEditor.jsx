import { useState, useEffect } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';

export default function JsonEditor({ value, onChange, minRows = 12, label = 'JSON', error, helperText }) {
  const [text, setText] = useState(typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2));

  useEffect(() => {
    const next = typeof value === 'string' ? value : JSON.stringify(value || {}, null, 2);
    setText(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(value)]);

  const handleFormat = () => {
    try {
      const obj = text ? JSON.parse(text) : {};
      const formatted = JSON.stringify(obj, null, 2);
      setText(formatted);
      onChange && onChange(formatted);
    } catch (e) {
      // ignore format error, keep text
    }
  };

  const handleChange = (e) => {
    const t = e.target.value;
    setText(t);
    onChange && onChange(t);
  };

  return (
    <Stack spacing={1} sx={{ width: '100%' }}>
      <TextField
        label={label}
        value={text}
        onChange={handleChange}
        multiline
        minRows={minRows}
        fullWidth
        error={!!error}
        helperText={helperText}
        InputProps={{ sx: { fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace' } }}
      />
      <Box>
        <Button size="small" variant="outlined" onClick={handleFormat}>Formater</Button>
      </Box>
    </Stack>
  );
}
