import { IconButton, Snackbar as BaseSnackbar } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { SnackbarProps } from './types';

export const Snackbar = ({ handleClose, open, message }: SnackbarProps) => {
  const action = (
    <IconButton size="small" aria-label="close" color="inherit" onClick={handleClose}>
      <CloseIcon fontSize="small" />
    </IconButton>
  );

  return (
    <>
      <BaseSnackbar open={open} autoHideDuration={6000} onClose={handleClose} message={message} action={action} />
    </>
  );
};
