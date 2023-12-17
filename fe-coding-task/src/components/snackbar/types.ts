export interface SnackbarProps {
  open: boolean;
  handleClose: (event: React.SyntheticEvent | Event, reason?: string) => void;
  message: string;
}
