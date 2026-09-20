import React, { useEffect } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '../components/ui/tabs';
import Header from '../components/Header';
import IntakeForm from '../components/dispatcher/IntakeForm';
import DispatchFeed from '../components/dispatcher/DispatchFeed';
import QueueDispatchPanel from '../components/dispatcher/QueueDispatchPanel';
import HospitalNetwork from '../components/hospitals/HospitalNetwork';
import PatientPortal from '../components/patients/PatientPortal';
import Analytics from '../components/analytics/Analytics';
import { Toaster } from '../components/ui/sonner';
import { useSimulationStore } from '../store/useSimulationStore';
import { TABS } from '../constants/testIds/medflow';

export default function Dashboard() {
  const loadState = useSimulationStore(s => s.loadState);
  const theme = useSimulationStore(s => s.theme);
  const [tab, setTab] = React.useState('dispatcher');

  useEffect(() => { loadState(); }, [loadState]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header
        onOpenNewCase={() => setTab('dispatcher')}
        onOpenPatients={() => setTab('patients')}
      />
      <main className="max-w-[1600px] mx-auto px-6 py-6">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList className="mb-6 bg-secondary/60">
            <TabsTrigger value="dispatcher" data-testid={TABS.dispatcher}>Dispatcher Console</TabsTrigger>
            <TabsTrigger value="hospitals" data-testid={TABS.hospitals}>Hospital Network</TabsTrigger>
            <TabsTrigger value="patients" data-testid={TABS.patients}>Patient Footprint</TabsTrigger>
            <TabsTrigger value="analytics" data-testid={TABS.analytics}>Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="dispatcher">
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(340px,420px)_1fr_minmax(320px,380px)] gap-4">
              <IntakeForm />
              <DispatchFeed />
              <QueueDispatchPanel />
            </div>
          </TabsContent>

          <TabsContent value="hospitals"><HospitalNetwork /></TabsContent>
          <TabsContent value="patients"><PatientPortal /></TabsContent>
          <TabsContent value="analytics"><Analytics /></TabsContent>
        </Tabs>
        <footer className="mt-8 text-[11px] text-muted-foreground text-center border-t border-border pt-4">
          MedFlow is a fictional simulation and decision-support demonstration. All hospitals, patients, alerts and recommendations are synthetic. Not for clinical use.
        </footer>
      </main>
      <Toaster position="top-right" richColors closeButton theme={theme} />
    </div>
  );
}
