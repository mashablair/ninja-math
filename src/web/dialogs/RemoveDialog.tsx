import {useEffect,useId,useState} from 'react';
import {Modal} from '../components/Modal.tsx';
import {useData} from '../state/data.tsx';
import {useUi} from '../state/ui.tsx';

// Removing appends a 'remove' event; the old check-in stays in the history and the backups.
export function RemoveDialog({entryId,onClose}:{entryId:string|null;onClose():void}) {
  const {mutate}=useData(), ui=useUi(), title=useId(), [error,setError]=useState(''), [busy,setBusy]=useState(false);
  useEffect(()=>setError(''),[entryId]);
  async function remove() {
    setBusy(true);
    try{await mutate('remove',entryId!);onClose();ui.toast('Check-in removed. Your dates are updated.');}
    catch(failure){setError((failure as Error).message);}
    finally{setBusy(false);}
  }
  return <Modal open={!!entryId} onClose={onClose} labelledBy={title}>
    <h2 id={title}>Remove this check-in?</h2>
    <p className="muted">Progress and dates will recalculate. A recovery copy stays in the private backups.</p>
    <div className="form-row"><button className="secondary close" type="button" onClick={onClose}>Keep it</button><button className="primary" type="button" disabled={busy} onClick={remove}>Remove check-in</button></div>
    <p className="form-error" role="alert">{error}</p>
  </Modal>;
}
