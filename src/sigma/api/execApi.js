import http from './http';

export const executeTransitionMultipart = async ({ workflowCode, objectType, objectId, transitionCode, request, files, fileTypes }) => {
  const fd = new FormData();
  fd.append('request', new Blob([JSON.stringify(request || {})], { type: 'application/json' }));
  (files || []).forEach((f) => fd.append('files', f));
  (fileTypes || []).forEach((t) => fd.append('fileTypes', t));

  const url = `/workflows/${encodeURIComponent(workflowCode)}/objects/${encodeURIComponent(objectType)}/${encodeURIComponent(objectId)}/transitions/${encodeURIComponent(transitionCode)}`;
  const res = await http.post(url, fd, { headers: { 'Content-Type': 'multipart/form-data' } });
  return res.data;
};

export default { executeTransitionMultipart };
