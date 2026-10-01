import { useEffect } from 'react';
import { useHospital } from '../context/HospitalContext';

const useLiveData = (fetcher, deps = [], resync = true) => {
  const { latestEvent, resyncTick } = useHospital();
  const key = JSON.stringify(deps);

  useEffect(() => {
    fetcher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => {
    if (!latestEvent) return;
    const topic = latestEvent.topic;
    if (resync && ['/topic/beds', '/topic/patients', '/topic/allocations', '/topic/reservations', '/topic/ambulances'].includes(topic)) {
      fetcher();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latestEvent?.receivedAt]);

  useEffect(() => {
    if (resync && resyncTick > 0) fetcher();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resyncTick]);
};

export default useLiveData;
