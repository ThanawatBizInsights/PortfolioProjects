'use client';
import { MascotBuddy } from './MascotBuddy';

export function WelcomeMascot(props: { name: string; say: string; colors: { body: string; belly: string; ink: string }; enabled: boolean }) {
  if (!props.enabled) return null;
  return (
    <div className="card" style={{ display: 'flex', justifyContent: 'center', padding: '22px 18px' }}>
      <MascotBuddy mood="happy" say={props.say} colors={props.colors} size={150} bubble="below" />
    </div>
  );
}
