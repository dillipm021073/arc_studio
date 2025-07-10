import React from 'react';

interface InterfaceDebugInfoProps {
  interface: any;
  show: boolean;
}

export function InterfaceDebugInfo({ interface: iml, show }: InterfaceDebugInfoProps) {
  if (!show || !iml) return null;

  return (
    <div className="absolute bottom-0 left-0 bg-black/80 text-white text-xs p-2 rounded max-w-xs z-50">
      <div className="font-semibold mb-1">Interface Debug Info</div>
      <div>IML: {iml.imlNumber}</div>
      <div>Type: {iml.interfaceType}</div>
      <div>Provider: {iml.providerApp?.name || iml.providerApplicationName || 'Unknown'} (ID: {iml.providerApplicationId})</div>
      <div>Consumer: {iml.consumerApp?.name || iml.consumerApplicationName || 'Unknown'} (ID: {iml.consumerApplicationId})</div>
      <div>Status: {iml.status}</div>
      <div className="mt-1 text-yellow-300">
        Expected flow for {iml.interfaceType}: {
          iml.interfaceType?.toLowerCase() === 'file' 
            ? `${iml.providerApp?.name || 'Provider'} → ${iml.consumerApp?.name || 'Consumer'}`
            : `${iml.consumerApp?.name || 'Consumer'} → ${iml.providerApp?.name || 'Provider'}`
        }
      </div>
    </div>
  );
}