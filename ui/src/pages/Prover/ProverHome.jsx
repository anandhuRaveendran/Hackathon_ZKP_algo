/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import algosdk from 'algosdk';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const algodToken = ''; // Add your Algod token here
const algodServer = 'https://testnet-algorand.api.purestake.io/ps2'; // Algorand testnet server
const algodPort = ''; // typically empty or 443

const client = new algosdk.Algodv2(algodToken, algodServer, algodPort);
const contractAddress = 'YourAlgorandContractAddress'; // Replace with actual address

const ProverHome = () => {
  const [message, setMessage] = useState({ type: '', content: '' });
  const [isConnected, setIsConnected] = useState(localStorage.getItem('digilockerConnected') === 'true');
  const [isConnecting, setIsConnecting] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [proverAddress, setProverAddress] = useState(null);
  const [account, setAccount] = useState(null);
  const [zkpStatus, setZkpStatus] = useState(false);
  const [contractId, setContractId] = useState(''); // Add the deployed contract ID

  useEffect(() => {
    const initBlockchain = async () => {
      try {
        if (window.AlgoSigner) {
          await window.AlgoSigner.connect();
          const accounts = await window.AlgoSigner.accounts({ ledger: 'TestNet' });
          setAccount(accounts[0].address);
          setProverAddress(accounts[0].address);
          setIsConnected(true);
        } else {
          console.log('AlgoSigner extension not found');
        }
      } catch (error) {
        console.error('Error initializing Algorand:', error);
      }
    };
  
    initBlockchain();
  }, []);

  const handleCompleteVerification = async () => {
    try {
      // Create a transaction to send data to the contract (example purpose)
      const suggestedParams = await client.getTransactionParams().do();
      const txn = algosdk.makeApplicationCallTxnFromObject({
        from: proverAddress,
        appIndex: contractId,
        onComplete: algosdk.OnApplicationComplete.NoOpOC,
        appArgs: [algosdk.encodeUint64(zkpStatus ? 1 : 0)],
        suggestedParams,
      });

      const signedTxn = await window.AlgoSigner.signTxn([{ txn: txn.toByte() }]);
      const response = await client.sendRawTransaction(signedTxn.blob).do();
      console.log('Data stored successfully:', response);

      const maxAge = localStorage.getItem('maxAge');
      const minAge = localStorage.getItem('minAge');
      const data = { inputValue, maxAge, minAge };

      const result = await fetch('http://localhost:3000/post-file', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      const resultData = await result.json();
      setZkpStatus(true);
      setMessage({ type: 'success', content: resultData.message });
    } catch (error) {
      console.error('Error storing data:', error);
      setMessage({ type: 'error', content: 'Failed to store data' });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    handleCompleteVerification();
  };

  const handleDigiLockerConnect = () => {
    if (!isConnected) {
      setIsConnecting(true);
      setTimeout(() => {
        localStorage.setItem('digilockerConnected', 'true');
        setIsConnected(true);
        setIsConnecting(false);
      }, 3000);
    }
  };

  return (
    <div className='pt-[10%] lg:pt-[5%] lg:ml-[35%] md:ml-[30%] sm:ml-[20%] ml-5'>
      <ToastContainer /> 
      <div className='lg:w-[400px] lg:h-[400px] border-[3px] border-[white] rounded-md w-[340px] h-[470px]'>
        <div className='flex items-center gap-[5%] justify-center w-[300px] mt-3 ml-[12%] rounded-full bg-white text-black '>
          <div>
            <p>Connected Account:</p>
          </div>
          <div>{account ? `${account.slice(0, 8)}...${account.slice(-4)}` : ''}</div>
        </div>

        <form className='flex flex-col gap-4 text-black lg:ml-[20%] ml-[15%] mt-[10%]' onSubmit={handleSubmit}>
          <button
            type="button"
            className={`w-[250px] h-10 text-center text-xl font-bold text-white border-white border-[3px] rounded-full ${
              isConnected ? 'bg-green-500' : isConnecting ? 'bg-blue-400' : 'bg-[#db9410]'
            }`}
            onClick={handleDigiLockerConnect}
            disabled={isConnected || isConnecting}
          >
            {isConnecting ? 'Connecting...' : isConnected ? 'Connected' : 'Connect DigiLocker'}
          </button>

          <div className='mt-[5%]'>
            <label className="block text-sm font-medium text-white">Enter proof</label>
            <input
              id="textInput"
              type="text"
              placeholder="Enter your text here"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              className="mt-1 block w-[250px] p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
          <button type="submit" className='w-[250px] bg-[orange] h-10 text-center rounded-lg text-white font-semibold'>
            Generate Proof & Send
          </button>
          {message.content && (
            <div
              className={`mt-5 px-2 w-[255px] rounded-full ${
                message.type === 'success' ? 'bg-green-200 text-green-800' : 'bg-red-200 text-red-800'
              } flex items-center`}
            >
              {message.type === 'success' ? (
                <FaCheckCircle className="mr-2 text-green-600" />
              ) : (
                <FaExclamationCircle className="mr-2 text-red-600" />
              )}
              <span>{message.content}</span>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default ProverHome;
