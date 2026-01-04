import { useState } from 'react';
import { Box, Button, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import { Autocomplete, Box, Button, Paper, Snackbar, Stack, TextField, Typography } from '@mui/material';
import UploadWithTypes from 'src/sigma/components/workflow-admin/UploadWithTypes';
import JsonEditor from 'src/sigma/components/workflow-admin/JsonEditor';
import { useWorkflows, useAvailableObjectTypes, useTransitionsByWorkflow, useApplyTransition } from 'sigma/hooks/query/useWorkflow';

export default function WorkflowExecTestPage() {
  const [workflowCode, setWorkflowCode] = useState('');
  const [objectType, setObjectType] = useState('');
  const [objectType, setObjectType] = useState(null);
  const [objectId, setObjectId] = useState('');
  const [transitionCode, setTransitionCode] = useState('');
  const [transition, setTransition] = useState(null);
  const [comment, setComment] = useState('');
  const [contextText, setContextText] = useState('{\n  \n}');
  const [files, setFiles] = useState([]);
  const [fileTypes, setFileTypes] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [response, setResponse] = useState(null);

  const { data: workflows = [], isLoading: loadingWorkflows } = useWorkflows();
  const { data: objectTypes = [], isLoading: loadingObjectTypes } = useAvailableObjectTypes();
  const { data: transitions = [], isLoading: loadingTransitions } = useTransitionsByWorkflow(workflow?.id, { enabled: !!workflow?.id });

  const applyTransitionMutation = useApplyTransition();
  const submit = async () => {
    setResponse(null);
    setError('');
    try {
      if (!workflowCode || !objectType || !objectId || !transitionCode) {
        setError('Champs requis manquants');
        return;
      }
      if (files.length !== fileTypes.length) {
        setError('Le nombre de fichiers et de types doit correspondre.');
        return;
      }
      let context = {};
      if (contextText) {
        try { context = JSON.parse(contextText); } catch (e) { setError('Context JSON invalide'); return; }
      }
      const req = { transitionCode, comment: comment || undefined, context, workflowCode };
      setLoading(true);
      const res = await executeTransitionMultipart({ workflowCode, objectType, objectId, transitionCode, request: req, files, fileTypes });
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
    } finally {
      setLoading(false);
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
            <TextField label="Workflow Code" value={workflowCode} onChange={(e) => setWorkflowCode(e.target.value)} required sx={{ minWidth: 220 }} />
            <TextField label="Object Type" value={objectType} onChange={(e) => setObjectType(e.target.value)} required sx={{ minWidth: 220 }} />
            <TextField label="Object ID" value={objectId} onChange={(e) => setObjectId(e.target.value)} required sx={{ minWidth: 220 }} />
            <TextField label="Transition Code" value={transitionCode} onChange={(e) => setTransitionCode(e.target.value)} required sx={{ minWidth: 220 }} />
          </Stack>
          <TextField label="Commentaire" value={comment} onChange={(e) => setComment(e.target.value)} multiline minRows={2} />
          <JsonEditor label="Context JSON" value={contextText} onChange={setContextText} />
          <UploadWithTypes files={files} setFiles={setFiles} fileTypes={fileTypes} setFileTypes={setFileTypes} />
          <Button variant="contained" onClick={submit} disabled={loading || !workflowCode || !objectType || !objectId || !transitionCode}>
            Envoyer
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
