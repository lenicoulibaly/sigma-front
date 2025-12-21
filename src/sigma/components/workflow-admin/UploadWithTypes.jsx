import { useEffect, useState } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, Stack, Typography } from '@mui/material';
import { typeApi } from 'src/sigma/api/administrationApi';

export default function UploadWithTypes({ files, setFiles, fileTypes, setFileTypes }) {
  const [docTypes, setDocTypes] = useState([]);

  useEffect(() => {
    let mounted = true;
    typeApi
      .getTypesByGroup('DOC')
      .then((data) => {
        if (mounted) setDocTypes(data || []);
      })
      .catch(() => {
        if (mounted) setDocTypes([]);
      });
    return () => (mounted = false);
  }, []);

  const handleFilesChange = (e) => {
    const f = Array.from(e.target.files || []);
    setFiles(f);
    // reset types to same length
    setFileTypes(new Array(f.length).fill(''));
  };

  const handleTypeChange = (idx, val) => {
    const arr = [...fileTypes];
    arr[idx] = val;
    setFileTypes(arr);
  };

  const removeAt = (idx) => {
    const f = files.filter((_, i) => i !== idx);
    const t = fileTypes.filter((_, i) => i !== idx);
    setFiles(f);
    setFileTypes(t);
  };

  return (
    <Stack spacing={1}>
      <Button variant="contained" component="label">
        Sélectionner des fichiers
        <input hidden multiple type="file" onChange={handleFilesChange} />
      </Button>
      {files?.length ? (
        <Typography variant="caption" color={files.length !== fileTypes.length ? 'error' : 'text.secondary'}>
          {files.length} fichiers sélectionnés — {fileTypes.length} types
        </Typography>
      ) : null}
      <Stack spacing={1}>
        {files?.map((f, idx) => (
          <Box key={idx} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography sx={{ flex: 1 }}>{f.name}</Typography>
            <FormControl size="small" sx={{ minWidth: 220 }}>
              <InputLabel>Type</InputLabel>
              <Select label="Type" value={fileTypes[idx] || ''} onChange={(e) => handleTypeChange(idx, e.target.value)}>
                <MenuItem value="">
                  <em>— choisir —</em>
                </MenuItem>
                {docTypes.map((dt) => (
                  <MenuItem key={dt.code} value={dt.code}>
                    {dt.name || dt.code}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Button color="error" size="small" onClick={() => removeAt(idx)}>
              Retirer
            </Button>
          </Box>
        ))}
      </Stack>
    </Stack>
  );
}
