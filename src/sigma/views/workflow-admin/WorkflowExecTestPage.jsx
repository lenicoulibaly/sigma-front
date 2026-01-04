import { useState } from 'react';
import { Autocomplete, Box, Button, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import UploadWithTypes from 'src/sigma/components/workflow-admin/UploadWithTypes';
import JsonEditor from 'src/sigma/components/workflow-admin/JsonEditor';
import { useWorkflows, useAvailableObjectTypes, useTransitionsByWorkflow, useApplyTransition } from 'sigma/hooks/query/useWorkflow';

export default function WorkflowExecTestPage() {
  const [workflow, setWorkflow] = useState(null);
  const [objectType, setObjectType] = useState(null);
  const [objectId, setObjectId] = useState('');
  const [transition, setTransition] = useState(null);
  const [comment, setComment] = useState('');
  const [contextText, setContextText] = useState('{\n  \n}');
  const [files, setFiles] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [response, setResponse] = useState(null);

  const { data: workflows = [], isLoading: loadingWorkflows } = useWorkflows();
  const { data: objectTypes = [], isLoading: loadingObjectTypes } = useAvailableObjectTypes();
  const { data: transitions = [], isLoading: loadingTransitions } = useTransitionsByWorkflow(workflow?.id, { enabled: !!workflow?.id });

  const applyTransitionMutation = useApplyTransition();
  const loading = applyTransitionMutation.isLoading;

  const submit = async () => {
    setResponse(null);
    setError('');
    try {
      if (!workflow || !objectType || !objectId || !transition) {
        setError('Champs requis manquants');
        return;
      }
      if (files.length !== fileTypes.length) {
        setError('Le nombre de fichiers et de types doit correspondre.');
        return;
      }
      let context = {};
      if (contextText) {
        try {
          context = JSON.parse(contextText);
        } catch (e) {
          setError('Context JSON invalide');
          return;
        }
      }

      const workflowCode = workflow.code;
      const transitionId = transition.transitionId;

      const req = { transitionId, comment: comment || undefined, context, workflowCode };

      const res = await applyTransitionMutation.mutateAsync({
        workflowCode,
        objectType,
        objectId,
        transitionId,
        request: req,
        files,
        fileTypes
      });

      setResponse(res);
      setSuccess('Exécution réussie');
    } catch (e) {
      // Try to unwrap common 400 validation format
      const data = e?.response?.data;
      if (e?.response?.status === 400 && data) {
        const msg = data?.violations?.length
          ? 'Violations: ' + data.violations.map((v) => v.messageCode || JSON.stringify(v)).join(', ')
          : data?.message || 'Requête invalide';
        setError(msg);
      } else {
        setError(e?.message || 'Erreur lors de l\'exécution');
      }
    }
  };

  return (
    <Box p={2}>
      <Typography variant="h4" gutterBottom>
        Test d'exécution de transition (multipart)
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Stack spacing={2}>
          <Stack direction="row" spacing={2}>
            <Autocomplete
              size="small"
              options={workflows}
              getOptionLabel={(opt) => (opt ? `${opt.code} - ${opt.libelle}` : '')}
              value={workflow}
              onChange={(_, val) => {
                setWorkflow(val);
                setTransition(null);
              }}
              renderInput={(params) => <TextField {...params} label="Workflow" size="small" required />}
              sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { height: 40 } }}
              loading={loadingWorkflows}
            />
            <Autocomplete
              size="small"
              options={objectTypes}
              getOptionLabel={(opt) => opt || ''}
              value={objectType}
              onChange={(_, val) => setObjectType(val)}
              renderInput={(params) => <TextField {...params} label="Object Type" size="small" required />}
              sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { height: 40 } }}
              loading={loadingObjectTypes}
            />
            <TextField
              size="small"
              label="Object ID"
              value={objectId}
              onChange={(e) => setObjectId(e.target.value)}
              required
              sx={{ minWidth: 220, '& .MuiOutlinedInput-root': { height: 40 } }}
            />
            <Autocomplete
              size="small"
              options={transitions}
              getOptionLabel={(opt) => (opt ? `${opt.transitionId} - ${opt.libelle}` : '')}
              value={transition}
              onChange={(_, val) => setTransition(val)}
              renderInput={(params) => <TextField {...params} label="Transition" size="small" required />}
              sx={{ minWidth: 300, '& .MuiOutlinedInput-root': { height: 40 } }}
              loading={loadingTransitions}
              disabled={!workflow}
            />
          </Stack>
          <TextField
            size="small"
            label="Commentaire"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            multiline
            minRows={2}
          />
          <JsonEditor label="Context JSON" value={contextText} onChange={setContextText} />
          <UploadWithTypes files={files} setFiles={setFiles} fileTypes={fileTypes} setFileTypes={setFileTypes} />
          <Button
            variant="contained"
            onClick={submit}
            disabled={loading || !workflow || !objectType || !objectId || !transition}
          >
            {loading ? 'Envoi...' : 'Envoyer'}
          </Button>
          {response && (
            <Paper variant="outlined" sx={{ p: 1 }}>
              <Typography variant="subtitle2">Réponse</Typography>
              <pre style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{JSON.stringify(response, null, 2)}</pre>
            </Paper>
          )}
        </Stack>
      </Paper>
      <Snackbar open={!!error} autoHideDuration={6000} onClose={() => setError('')} message={error} />
      <Snackbar open={!!success} autoHideDuration={3000} onClose={() => setSuccess('')} message={success} />
    </Box>
  );
}
