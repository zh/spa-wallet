import Switch from '@material-ui/core/Switch';
import FormGroup from '@material-ui/core/FormGroup';
import FormControlLabel from '@material-ui/core/FormControlLabel';

const ModeSwitch = ({ checked, onChange }) => {
  return (
    <FormGroup>
      <FormControlLabel
        control={<Switch checked={checked} onChange={onChange} />}
        label="Advanced Mode"
      />
    </FormGroup>
  );
};

export default ModeSwitch;
