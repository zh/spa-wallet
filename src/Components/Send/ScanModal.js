import { useState } from 'react';
import {
  ModalContent,
  ModalFooter,
  ModalButton,
  useDialog,
} from 'react-st-modal';
import QrReader from 'react-qr-reader';
import './ScanModal.css';

const ScanModal = () => {
  const dialog = useDialog();
  const [loading, setLoading] = useState(false);
  const [facing, setFacing] = useState('environment');
  const [address, setAddress] = useState('');

  const handleChangeMode = () => {
    setFacing(facing === 'user' ? 'environment' : 'user');
  };

  const handleScan = async (data) => {
    if (data) {
      setLoading(true);
      try {
        // check for valid SLP/BCH/Legacy address
        setAddress(data);
      } catch (error) {
        console.log(error);
      }
      setLoading(false);
    }
  };

  const handleError = (err) => {
    console.error(err);
  };

  return (
    <>
      <ModalContent className="qr-container">
        <div>
          Facing Mode: {facing}
          <button className="change-button" onClick={handleChangeMode}>
            Change
          </button>
        </div>
        <div className="qr-scanner">
          <QrReader delay={300} onError={handleError} onScan={handleScan} />
        </div>
        <table id="qr-result">
          <tbody>
            <tr>
              <th>Address:</th>
              <td>{loading ? 'loading...' : address}</td>
            </tr>
          </tbody>
        </table>
      </ModalContent>
      <ModalFooter>
        <ModalButton
          onClick={() => {
            dialog.close(address);
          }}
        >
          Scan
        </ModalButton>
        <ModalButton
          type="dark"
          onClick={() => {
            dialog.close();
          }}
        >
          Close
        </ModalButton>
      </ModalFooter>
    </>
  );
};

export default ScanModal;
