import React, { useState, useEffect } from 'react';
import { TOTP } from 'otpauth';

export default function TwoFactorAuth({ item, onDelete }) {
  const [otp, setOtp] = useState('------');
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    const totp = new TOTP({
      issuer: item.serviceName,
      label: item.serviceName,
      algorithm: 'SHA1',
      digits: 6,
      period: 30,
      secret: item.secret,
    });

    const updateOtp = () => {
      try {
        setOtp(totp.generate());
        const remaining = totp.period - (Math.floor(Date.now() / 1000) % totp.period);
        setProgress((remaining / totp.period) * 100);
      } catch(e) {
        setOtp('Invalid Secret');
        setProgress(0);
      }
    };
    
    updateOtp();
    const interval = setInterval(updateOtp, 1000);
    return () => clearInterval(interval);
  }, [item]);

  const copyToClipboard = () => {
    navigator.clipboard.writeText(otp);
  };

  return (
    <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col justify-between">
      <div>
        <h3 className="text-xl font-semibold mb-2">{item.serviceName}</h3>
        <p className="text-4xl font-mono tracking-widest text-cyan-400 mb-4 cursor-pointer" onClick={copyToClipboard}>
          {otp.slice(0, 3)} {otp.slice(3)}
        </p>
        <div className="w-full bg-gray-700 rounded-full h-1.5 mb-4">
          <div className="bg-blue-500 h-1.5 rounded-full" style={{ width: `${progress}%`, transition: 'width 1s linear' }}></div>
        </div>
      </div>
      <button onClick={() => onDelete(item.id)} className="text-sm text-red-400 hover:text-red-300 self-end">
        Delete
      </button>
    </div>
  );
}
