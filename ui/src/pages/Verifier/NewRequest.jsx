// eslint-disable-next-line no-unused-vars
import React, { useState, useEffect } from 'react';
import algosdk from 'algosdk';

const ALGOD_SERVER = 'https://testnet-algorand.api.purestake.io/ps2';
const ALGOD_PORT = '';
const ALGOD_TOKEN = { 'X-API-Key': 'Your-PureStake-API-Key' }; // Replace with your API key
const contractAppId = 123456; // Replace with your Algorand smart contract App ID

const NewRequest = () => {
    const [proverAddress, setProverAddress] = useState('');
    const [selectedOption, setSelectedOption] = useState('');
    const [account, setAccount] = useState(null);
    const [zkpStatus, setZkpStatus] = useState(false);
    const [minAge, setMinage] = useState('');
    const [maxAge, setMaxage] = useState('');
    const algodClient = new algosdk.Algodv2(ALGOD_TOKEN, ALGOD_SERVER, ALGOD_PORT);

    useEffect(() => {
        const connectWallet = async () => {
            if (window.algorand) {
                const accounts = await window.algorand.enable();
                setAccount(accounts[0]);
                console.log('Connected Account:', accounts[0]);
            } else {
                console.log('Algorand wallet not found');
            }
        };
        connectWallet();
    }, []);

    const handleStoreData = async () => {
        try {
            const params = await algodClient.getTransactionParams().do();

            // Prepare application call transaction
            const txn = algosdk.makeApplicationNoOpTxnFromObject({
                from: account,
                appIndex: contractAppId,
                appArgs: [
                    algosdk.encodeUint64(proverAddress),  // Encode data as needed
                    algosdk.encodeUint64(zkpStatus ? 1 : 0)
                ],
                suggestedParams: params
            });

            const signedTxn = await window.algorand.signTransaction(txn.toByte());
            const { txId } = await algodClient.sendRawTransaction(signedTxn.blob).do();
            console.log('Data stored successfully, Transaction ID:', txId);
        } catch (error) {
            console.error('Error storing data:', error);
        }
    };

    const handleSelectChange = (e) => {
        e.preventDefault();
        setSelectedOption(e.target.value);
        console.log('Selected Option:', e.target.value);
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setZkpStatus(true);
        handleStoreData();
        localStorage.setItem('minAge', minAge);
        localStorage.setItem('maxAge', maxAge);
        localStorage.setItem('category', selectedOption);
    };

    return (
        <div className='lg:pt-[4%] pt-[10%] lg:ml-[35%] md:ml-[30%] sm:ml-[20%] ml-3'>
            <div className='lg:w-[400px] lg:h-[495px] border-[3px]
                           md:w-[400px] md:h-[450px]
                           w-[350px] h-[475px] border-[white]'>
                <p>Connected Account: {account}</p>

                <div className='text-center mt-5 text-2xl font-bold'>Request Form</div>
                <form className='flex flex-col gap-4 text-black lg:ml-[20%] ml-[15%] mt-[10%]' onSubmit={handleSubmit}>
                    <div>
                        <label className="block text-sm font-medium text-[white]">Prover Address</label>
                        <input
                            id="textInput1"
                            type="text"
                            placeholder="Prover Address"
                            value={proverAddress}
                            onChange={(e) => setProverAddress(e.target.value)}
                            className="mt-1 block w-[250px] p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        />
                        <label className="block text-sm font-medium text-[white]">
                            Select an Option
                        </label>
                        <select
                            id="selectOption"
                            value={selectedOption}
                            onChange={handleSelectChange}
                            className="mt-1 block w-[250px] p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="choose">Choose which to verify</option>
                            <option value="name">Name</option>
                            <option value="age">Age</option>
                            <option value="address">Address</option>
                        </select>
                    </div>

                    {selectedOption === 'age' && (
                        <div>
                            <label className="block text-sm font-medium text-[white]">Minimum Age</label>
                            <input
                                type="text"
                                placeholder="Enter your text here"
                                onChange={(e) => setMinage(e.target.value)}
                                className="mt-1 block w-[250px] p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                            <label className="mt-2 block text-sm font-medium text-[white]">Maximum Age</label>
                            <input
                                type="text"
                                placeholder="Enter your text here"
                                onChange={(e) => setMaxage(e.target.value)}
                                className="mt-1 block w-[250px] p-2 bg-gray-50 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                    )}

                    <button
                        type="submit"
                        className='w-[250px] bg-[orange] h-10 text-center rounded-lg text-white font-semibold'
                    >
                        Send Request
                    </button>
                </form>
            </div>
        </div>
    );
};

export default NewRequest;
