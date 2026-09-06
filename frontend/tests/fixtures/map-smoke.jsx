import React, { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DeliveryMap from '../../src/components/DeliveryMap.jsx';
import '../../src/index.css';

function MapSmoke() {
  const [picked, setPicked] = useState(null);
  return <>
    <div style={{ width: '100%', maxWidth: 900, height: 450 }}>
      <DeliveryMap origin={[123.1948, 13.6218]} destination={[123.2, 13.63]}
        routeGeometry={[[123.1948, 13.6218], [123.197, 13.625], [123.2, 13.63]]}
        onPick={setPicked} className="w-full h-full rounded-2xl" />
    </div>
    <p role="status">{picked ? `Selected: ${picked.lat}, ${picked.lng}` : 'No point selected'}</p>
  </>;
}

createRoot(document.getElementById('root')).render(<MapSmoke />);
