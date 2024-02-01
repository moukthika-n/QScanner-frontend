import React, { useState, useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import './style.css';
//import WebSocket from 'ws';

function QScanner() {
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);
  const scannerRef = useRef(null); // Use a ref to store the scanner instance
  const webSocket = useRef(null); // Create a WebSocket reference
  //  const webSocket = useRef(new WebSocket('ws://localhost:3000'));

  useEffect(() => {
    if (!webSocket.current) {
      webSocket.current = new WebSocket('wss://qscannerb.onrender.com');

      webSocket.current.onopen = () => {
        console.log('WebSocket connection opened');
      };

      webSocket.current.onmessage = (event) => {
        const response = JSON.parse(event.data);
        setVerificationStatus(response.message);
        setScanResult(null);
        setIsPopupOpen(false);
        // Show alert message based on verification status:
        if (response.isPresent) {
          alert('Data verified and removed successfully!');
        } else {
          alert('Data not found in database.');
        }
      };


      webSocket.current.onerror = (error) => {
        console.error('WebSocket error:', error);
        setVerificationStatus('Error verifying data');
        alert('Error verifying data. Please try again.');
      };
    }

    return () => {
      if (webSocket.current) {
        if (webSocket.readyState === 1) { // <-- This is important
          webSocket.current.close();
        }
      }
    };
  }, []);

  // useEffect(() => {
  //   if (!scannerRef.current) {
  //     const scanner = new Html5QrcodeScanner('reader', {
  //       qrbox: {
  //         width: 250,
  //         height: 250,
  //       },
  //       fps: 5,
  //     });

  //     scanner.render((result) => {
  //       scanner.clear();
  //       setScanResult(result);
  //       setIsPopupOpen(true);
  //     }, (err) => {
  //       console.warn(err);
  //     });

  //     scannerRef.current = scanner;
  //   }

  //   return () => {
  //     if (scannerRef.current) {
  //       scannerRef.current.clear();
  //     }
  //   };
  // }, []);

  useEffect(() => {
    if (!isPopupOpen) {
      const newScanner = new Html5QrcodeScanner('reader', {
        qrbox: {
          width: 250,
          height: 250,
        },
        fps: 5,
      });

      scannerRef.current = newScanner;
      newScanner.render((result) => {
        setScanResult(result);
        setIsPopupOpen(true);
      }, (err) => {
        console.warn(err);
      });
    }
  }, [isPopupOpen]);

  const handleVerify = async () => {
    try {
      // Check if WebSocket is open
      if (webSocket.current && webSocket.current.readyState === WebSocket.OPEN) {
        webSocket.current.send(JSON.stringify({ scanResult }));
  
        // Wait for a response or timeout
        const responseTimeout = setTimeout(() => {
          setVerificationStatus('Error verifying data');
        }, 5000);
  
        let response;
  
        await new Promise((resolve) => {
          webSocket.current.onmessage = (event) => {
            response = JSON.parse(event.data);
            resolve();
          };
        });
  
        // Show alert message based on response
        if (response.isPresent) {
          alert('Data verified and removed successfully!');
        } else {
          alert('Data not found in database.');
        }
        clearTimeout(responseTimeout);
        setVerificationStatus(null);
        setVerificationStatus(response.message);
        setScanResult(null);
        setIsPopupOpen(false);
      } else {
        // Handle case where WebSocket is not open
        console.error('WebSocket connection not open');
        setVerificationStatus('WebSocket connection not open');
      }
    } catch (error) {
      console.error('Error communicating with server:', error);
      setVerificationStatus('Error communicating with server');
    }
  };

  // const handleVerify = async () => {
  //   try {
  //     if (webSocket.current.readyState === WebSocket.OPEN) {
  //       webSocket.current.send(JSON.stringify({ scanResult }));

  //       // Wait for a response or timeout:
  //       const responseTimeout = setTimeout(() => {
  //         setVerificationStatus('Error verifying data');
  //       }, 5000);

  //       let response; // Declare response here

  //       await new Promise((resolve) => {
  //         webSocket.current.onmessage = (event) => {
  //           response = JSON.parse(event.data); // Assign response here
  //           resolve();
  //         };
  //       });

  //       // Show alert message based on response:
  //       if (response.isPresent) {
  //         alert('Data verified and removed successfully!');
  //       } else {
  //         alert('Data not found in database.');
  //       }
  //       clearTimeout(responseTimeout);
  //       setVerificationStatus(null);
  //       setVerificationStatus(response.message);
  //       setScanResult(null);
  //       setIsPopupOpen(false);

  //     } else {
  //       throw new Error('WebSocket connection not open');
  //     }
  //   } catch (error) {
  //     console.error('Error communicating with server:', error);
  //     setVerificationStatus('Error communicating with server');
  //   }
  // };


  return (
    <div>
      <div id="reader" style={{ border: '1px solid red' }}></div>

      {isPopupOpen && (
        <div className="popup" key={isPopupOpen}>
          <h2>Scanned Data:</h2>
          <p>{scanResult}</p>
          {/* {verificationStatus && <p className="verification-status">{verificationStatus}</p>*/}
          <button onClick={handleVerify}>Verify</button>
          <button onClick={() => setIsPopupOpen(false)}>Back</button>
        </div>
      )}
    </div>
  );
}
export default QScanner;
