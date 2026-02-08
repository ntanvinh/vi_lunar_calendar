import React, {useEffect, useState} from 'react';
import AppCalendar from '/@/components/calendar/AppCalendar';
import EventManagement from '/@/components/EventManagement';

export default function App() {
  const [hash, setHash] = useState(window.location.hash);

  useEffect(() => {
    console.log('Current hash:', window.location.hash);
    const handleHashChange = () => {
      console.log('Hash changed:', window.location.hash);
      setHash(window.location.hash);
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  if (hash === '#/events') {
    return <EventManagement />;
  }

  return (
    <div
      className={''}
    >
      <AppCalendar />
    </div>
  );
}
