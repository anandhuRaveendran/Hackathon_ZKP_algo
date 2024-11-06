import { useState, useEffect } from 'react';
import { ToastContainer } from 'react-toastify';
import algosdk from 'algosdk';
import 'react-toastify/dist/ReactToastify.css';
import { FaCheckCircle, FaExclamationCircle } from 'react-icons/fa';

const ALGOD_SERVER = 'https://testnet-algorand.api.purestake.io/ps2';
const ALGOD_TOKEN = { 'X-API-Key': 'Your-PureStake-API-Key' }; // Replace with your API key
const contractAppId = 123456; // Replace with your contract App ID

// Create Algod Client once, outside the component's functions
const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, '');

const ProverHome = () => {
    const [message, setMessage] = useState({ type: '', content: '' });
    const [isConnected, setIsConnected] = useState(localStorage.getItem('digilockerConnected') === 'true');
    const [isConnecting, setIsConnecting] = useState(false);
    const [inputValue, setInputValue] = useState('');
    const [account, setAccount] = useState(null);
    const [zkpStatus, setZkpStatus] = useState(false);

    useEffect(() => {
        const initAlgorand = async () => {
            try {
                const accounts = await window.algorand.enable();
                setAccount(accounts[0]);
                setIsConnected(true);
            } catch (error) {
                console.log('Error initializing Algorand:', error);
            }
        };

        if (!account && window.algorand) {
            initAlgorand();
        }
    }, [account]);

    const handleCompleteVerification = async () => {
        const maxAge = localStorage.getItem('maxAge');
        const minAge = localStorage.getItem('minAge');
        const data = { inputValue, maxAge, minAge };

        const response = await fetch('http://localhost:3000/post-file', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });

        const result = await response.json();

        if (response.ok) {
            setZkpStatus(true);
            setMessage({ type: 'success', content: result.message });

            // Store proof details on Algorand if verification is successful
            await storeDataOnAlgorand();
        } else {
            setZkpStatus(false);
            setMessage({ type: 'error', content: result.message });
        }
    };

    const storeDataOnAlgorand = async () => {
        try {
            const params = await algodClient.getTransactionParams().do();

            const txn = algosdk.makeApplicationNoOpTxnFromObject({
                from: account,
                appIndex: contractAppId,
                appArgs: [algosdk.encodeUint64(zkpStatus ? 1 : 0)], // Use application arguments for status
                suggestedParams: params,
            });

            const signedTxn = await window.algorand.signTransaction(txn.toByte());
            await algodClient.sendRawTransaction(signedTxn.blob).do();
            console.log('Data stored successfully on Algorand');
        } catch (error) {
            console.error('Error storing data on Algorand:', error);
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
                            isConnected
                                ? 'bg-green-500'
                                : isConnecting
                                ? 'bg-blue-400'
                                : 'bg-[#db9410]'
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
