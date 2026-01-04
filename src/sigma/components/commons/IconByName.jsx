import React from 'react';
// Core MUI icons used across workflow actions
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import PlayCircleIcon from '@mui/icons-material/PlayCircle';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import SendIcon from '@mui/icons-material/Send';
import TransformIcon from '@mui/icons-material/Transform';
import CheckIcon from '@mui/icons-material/Check';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import CloseIcon from '@mui/icons-material/Close';
import CancelIcon from '@mui/icons-material/Cancel';
import BlockIcon from '@mui/icons-material/Block';
import ThumbDownIcon from '@mui/icons-material/ThumbDown';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import WatchLaterIcon from '@mui/icons-material/WatchLater';
import ScheduleIcon from '@mui/icons-material/Schedule';
import DeleteIcon from '@mui/icons-material/Delete';
import DeleteForeverIcon from '@mui/icons-material/DeleteForever';
import InboxIcon from '@mui/icons-material/Inbox';
import MoveToInboxIcon from '@mui/icons-material/MoveToInbox';
import DownloadIcon from '@mui/icons-material/Download';
import SaveIcon from '@mui/icons-material/Save';
import SaveAltIcon from '@mui/icons-material/SaveAlt';
import EditIcon from '@mui/icons-material/Edit';
import RuleIcon from '@mui/icons-material/Rule';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import ApprovalIcon from '@mui/icons-material/Approval';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ChatBubbleIcon from '@mui/icons-material/ChatBubble';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import PrintIcon from '@mui/icons-material/Print';
import UploadIcon from '@mui/icons-material/Upload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SearchIcon from '@mui/icons-material/Search';
import SettingsIcon from '@mui/icons-material/Settings';
import HistoryIcon from '@mui/icons-material/History';
import ReplayIcon from '@mui/icons-material/Replay';
import PauseIcon from '@mui/icons-material/Pause';
import StopIcon from '@mui/icons-material/Stop';
import DraftsIcon from '@mui/icons-material/Drafts';
import HourglassTopIcon from '@mui/icons-material/HourglassTop';
import HourglassBottomIcon from '@mui/icons-material/HourglassBottom';
import PaymentsIcon from '@mui/icons-material/Payments';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

// Canonical map: persisted string name -> Icon component
// Keep names simple and meaningful (French labels mapped to stable English keys when needed)
export const iconMap = {
  // Principales actions workflow demandées
  Valider: CheckCircleIcon, // validation/approve
  Initier: PlayArrowIcon, // start/initiate
  Transmettre: SendIcon, // send/forward
  Annuler: CancelIcon, // cancel
  Rejeter: ThumbDownIcon, // reject
  Ajourner: WatchLaterIcon, // postpone
  Supprimer: DeleteIcon, // delete
  Receptionner: MoveToInboxIcon, // receive
  Enregistrer: SaveIcon, // save
  Payer: PaymentsIcon,

  // Alias usuels (au cas où les codes côté back soient differents)
  Approver: ApprovalIcon,
  Approve: ApprovalIcon,
  Check: CheckIcon,
  CheckAll: DoneAllIcon,
  PlayArrow: PlayArrowIcon,
  PlayCircle: PlayCircleIcon,
  ArrowForward: ArrowForwardIcon,
  Send: SendIcon,
  Transform: TransformIcon,
  Close: CloseIcon,
  Cancel: CancelIcon,
  Block: BlockIcon,
  PauseCircle: PauseCircleIcon,
  Schedule: ScheduleIcon,
  WatchLater: WatchLaterIcon,
  Delete: DeleteIcon,
  DeleteForever: DeleteForeverIcon,
  Inbox: InboxIcon,
  MoveToInbox: MoveToInboxIcon,
  Download: DownloadIcon,
  Save: SaveIcon,
  SaveAlt: SaveAltIcon,
  Edit: EditIcon,
  Rule: RuleIcon,
  VerifiedUser: VerifiedUserIcon,
  Assignment: AssignmentIndIcon,
  PersonAdd: PersonAddIcon,
  Comment: ChatBubbleIcon,
  Attach: AttachFileIcon,
  Print: PrintIcon,
  Upload: UploadIcon,
  Visibility: VisibilityIcon,
  Search: SearchIcon,
  Settings: SettingsIcon,
  History: HistoryIcon,
  Restart: ReplayIcon,
  Replay: ReplayIcon,
  Pause: PauseIcon,
  Pay: PaymentsIcon,
  Payment: PaymentsIcon,
  Payments: PaymentsIcon,
  // Draft/Brouillon icons
  Brouillon: DraftsIcon,
  Draft: DraftsIcon,
  Drafts: DraftsIcon,

  // En cours / In progress
  'En cours': HourglassTopIcon,
  EnCours: HourglassTopIcon,
  InProgress: HourglassTopIcon,

  // En attente de traitement / Pending processing
  'En attente de traitement': ScheduleIcon,
  EnAttenteDeTraitement: ScheduleIcon,
  PendingProcessing: ScheduleIcon,

  // En attente de paiement / Pending payment
  'En attente de paiement': HourglassBottomIcon,
  EnAttenteDePaiement: HourglassBottomIcon,
  PendingPayment: HourglassBottomIcon,

  Stop: StopIcon
};

export function getMuiIcon(name, props) {
  const Cmp = iconMap[name] || HelpOutlineIcon; // fallback for unknown names
  return <Cmp {...props} />;
}

export default function IconByName({ name, ...props }) {
  return getMuiIcon(name, props);
}

// Options for Autocomplete components (id/label/icon)
export const ICON_OPTIONS = Object.entries(iconMap).map(([id, Cmp]) => ({
  id,
  label: id,
  icon: <Cmp fontSize="small" />
}));
