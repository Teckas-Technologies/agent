"use client";

import InlineSVG from 'react-inlinesvg';
import './Hero.css';
import { useEffect, useState } from 'react';
import { useAppKit, useAppKitAccount } from '@reown/appkit/react';
import { useAccount } from 'wagmi';
import { ethers } from "ethers";
import { useContract } from '@/contexts/ContractProvider';
import { usdtABI } from '@/config/usdtABI';
import { constant } from '@/config/constants';

interface CustomError {
    code?: string | number;
    message?: string;
    data?: {
        message?: string;
    };
};

const phaseStartDate = new Date('2024-10-20T15:00:00-04:00'); // Phase 1 starts (Oct 20, 3 PM EDT)
const phaseEndDates = [
    new Date('2024-11-17T15:00:00-04:00'), // Phase 1 ends (Nov 17, 3 PM EDT)
    new Date('2024-12-01T15:00:00-04:00'), // Phase 2 ends (Dec 01, 3 PM EDT)
    new Date('2024-12-15T00:00:00-04:00')  // Phase 3 ends (Dec 15, Midnight EDT)
];

export const Hero: React.FC = () => {
    const [selectedToken, setSelectedToken] = useState<string>('ETH');
    const [inputValue, setInputValue] = useState<string>('');
    const [receivedValue, setReceivedValue] = useState<string>('');
    const [inputMissing, setInputMissing] = useState(false);
    const [processing, setProcessing] = useState(false);
    const [success, setSuccess] = useState(false);
    const [failed, setFailed] = useState(false);
    const [convertionFailed, setConvertionFailed] = useState(false);
    const [errorReason, setErrorReason] = useState("");
    const [approveSuccess, setApproveSuccess] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const { isConnected } = useAppKitAccount();
    const { address } = useAccount();
    const { open } = useAppKit();
    const { contract, refetchBalance, provider } = useContract();

    useEffect(() => {
        if (success) {
            const timer = setTimeout(() => setSuccess(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [success]);

    useEffect(() => {
        if (approveSuccess) {
            const timer = setTimeout(() => setApproveSuccess(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [approveSuccess]);

    useEffect(() => {
        if (resetSuccess) {
            const timer = setTimeout(() => setResetSuccess(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [resetSuccess]);

    useEffect(() => {
        if (failed) {
            const timer = setTimeout(() => setFailed(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [failed]);

    useEffect(() => {
        if (convertionFailed) {
            const timer = setTimeout(() => setConvertionFailed(false), 10000);
            return () => clearTimeout(timer);
        }
    }, [convertionFailed]);

    const handleTokenSelect = (token: string) => {
        setSelectedToken(token);
    };

    useEffect(() => {
        if (inputValue) {
            const fetchTokenValue = async () => {
                const result = await getTokenValue(selectedToken, inputValue);
                setReceivedValue(result?.toString() || '');
            };

            fetchTokenValue();
        } else {
            setReceivedValue('');
        }
    }, [selectedToken, inputValue]);

    const handleInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (inputMissing) {
            setInputMissing(false);
        }
        // alert("value changed");
        const value = e.target.value;
        setInputValue(value);
        if (value) {
            const result = await getTokenValue(selectedToken, value);
            setReceivedValue(result?.toString() as string);
        } else {
            setReceivedValue('');
        }
    };

    const handleError = (error: unknown, token: string) => {
        let errorMessage = `Failed to fetch ${token} to Tokens rate.`;

        if (isCustomError(error)) {
            switch (error.code) {
                case "INSUFFICIENT_FUNDS":
                    errorMessage = "Insufficient funds for gas + value.";
                    break;
                case "ACTION_REJECTED":
                case 4001:
                    errorMessage = "Rejected by you.";
                    break;
                case "UNSUPPORTED_OPERATION":
                    errorMessage = "Connect your wallet.";
                    break;
                case "NETWORK_ERROR":
                    errorMessage = "Network error. Please check your connection.";
                    break;
                case "INVALID_ARGUMENT":
                    errorMessage = "Invalid argument provided. Please check your input.";
                    break;
                case "CALL_EXCEPTION":
                    errorMessage = "Call to contract method failed. Contract may not be deployed.";
                    break;
                case "OUT_OF_GAS":
                    errorMessage = "Transaction ran out of gas.";
                    break;
                case "TRANSACTION_REVERTED":
                    errorMessage = "Transaction reverted. Please check contract conditions.";
                    break;
                default:
                    errorMessage = error.message || errorMessage;
                    break;
            }
        } else {
            errorMessage = "An unknown error occurred.";
        }
        setErrorReason(errorMessage);
    };

    // const safeStringify = (obj: object | null): string => {
    //     const seen = new WeakSet();
    //     return JSON.stringify(obj, (key, value) => {
    //         if (typeof value === "object" && value !== null) {
    //             if (seen.has(value)) {
    //                 return "[Circular]";
    //             }
    //             seen.add(value);
    //         }
    //         return value;
    //     }, 2);
    // };

    // function ethToWei(ethAmount: string) {
    //     return Number(ethAmount) * 10 ** 18;
    //     // return BigNumber.from(ethAmount).mul(BigNumber.from("1000000000000000000")); // Multiply by 10^18
    // }

    const getTokenValue = async (token: string, value: string) => {
        if (!contract) return;
        // alert(`Get token reached${safeStringify(contract)}`);
        if (token === "USDT") {
            try {
                const usdtAmountBigNumber = ethers.utils.parseUnits(value, 6);
                const tokenAmount = await contract.usdtToTokens(usdtAmountBigNumber);
                const tokenValue = Number(ethers.utils.formatUnits(tokenAmount, 6));
                // console.log("Token:", tokenValue)
                return tokenValue;
            } catch (error: unknown) {
                // console.error("Failed to fetch ETH to Tokens rate:", error);
                handleError(error, "USDT");
                setConvertionFailed(true);
                // setTextError(error as string);
                // alert(error as string);
            }
        }

        if (token === "ETH") {
            try {
                const ethAmountBigNumber = ethers.utils.parseEther(value);
                // const ethAmount = ethToWei(value);
                // const stringValue = String(ethAmount)
                const tokenAmount = await contract.ethToTokens(ethAmountBigNumber);
                console.log("ETH to Token :", tokenAmount);
                return Number(ethers.utils.formatUnits(tokenAmount, 18));
            } catch (error: unknown) {
                console.error("Failed to fetch ETH to Tokens rate:", error);
                handleError(error, "ETH");
                setConvertionFailed(true);
            }
        }
    }


    const getfuncTokenValue = async (func: string, value: string) => {
        if (!contract) return;
        console.log(func,value)
        // alert(`Get token reached${safeStringify(contract)}`);
            try {
                const usdtAmountBigNumber = ethers.utils.parseUnits(value, 6);
                console.log(usdtAmountBigNumber);
                if (typeof contract[func] !== "function") {
                    throw new Error(`Function ${func} does not exist on the contract`);
                }
                const tokenAmount = await contract[func](usdtAmountBigNumber,{ gasLimit: 500000 });  
                console.log(tokenAmount);
                // const tx = await contract.contributeUSDT(usdtAmountBigNumber, { gasLimit: 300000 });
                   // const receipt = await tokenAmount.wait();
                // console.log(receipt);
                const tokenValue = Number(ethers.utils.formatUnits(tokenAmount, 6));
                console.log("Token:", tokenValue)
                return tokenValue;
            } catch (error: any) {
                console.log(error.message);
                // console.error("Failed to fetch ETH to Tokens rate:", error);
                handleError(error, "USDT");
                setConvertionFailed(true);
                // setTextError(error as string);
                // alert(error as string);
            }
    }

    const funcCall = async()=>{
        console.log(contract);
        if (!contract) return;
        // alert("Buy button clicked");
        // if (processing) return;

        // setProcessing(true);
                const usdtAmountBigNumber = ethers.utils.parseUnits("2", 6);
                console.log(usdtAmountBigNumber)
                // console.log(`USDT Value : ${value}`);
                // console.log(`USDT BIG Number : ${usdtAmountBigNumber}`);
                const usdtAddress = constant.usdtAddress;
                console.log(usdtAddress)
                const presaleAddress = constant.presaleAddress;
                console.log(presaleAddress)
                const signer = await provider?.getSigner();
                console.log(signer)
                const signerAddress = await signer?.getAddress();
                console.log(signerAddress)
                const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
                console.log(usdtAddress,presaleAddress,signer,signerAddress,usdtContract);
                const usdtBalance = await usdtContract.balanceOf(signerAddress);
                if (usdtBalance.lt(usdtAmountBigNumber)) {
                    // console.log("Insufficient USDT balance.");
                    setFailed(true);
                    alert("Insufficient USDT balance.");
                    setProcessing(false);
                    return;
                }

                const currentAllowance = await usdtContract.allowance(signerAddress, presaleAddress);
                // console.log("Current Allowance:", currentAllowance.toString());

                if (currentAllowance.lt(usdtAmountBigNumber)) {
                    // console.log("Allowance not enough, approving...");
                    // const shortfall = usdtAmountBigNumber.sub(currentAllowance);
                    // console.log(`Allowance is insufficient. Shortfall: ${shortfall.toString()}`);

                    if (currentAllowance.gt(0)) {
                        console.log("Resetting allowance to zero...");
                        const resetTx = await usdtContract.approve(presaleAddress, 0, { gasLimit: 100000 });
                        const resetReceipt = await resetTx.wait();
                        if (resetReceipt.status === 1) {
                            // console.log("Reset allowance to zero success.");
                            setResetSuccess(true);
                        } else {
                            setFailed(true);
                            alert("Failed to reset allowance.");
                            return;
                        }
                        // console.log("Allowance reset to zero.");
                    }

                    // Estimate gas for approval if necessary (optional)
                    // const gasEstimateForApprove = await usdtContract.estimateGas.approve(presaleAddress, usdtAmountBigNumber);
                    // console.log("Estimated gas for approve:", gasEstimateForApprove.toString());

                    // Approve USDT allowance to the presale contract
                    const approveTx = await usdtContract.approve(presaleAddress, usdtAmountBigNumber, { gasLimit: 100000 });
                    const approveReceipt = await approveTx.wait();

                    if (approveReceipt.status === 1) {
                        console.log("USDT allowance approved successfully.");
                        setApproveSuccess(true);
                    } else {
                        console.log("USDT approval transaction failed.");
                        setFailed(true);
                        setErrorReason("USDT approval transaction failed.");
                        // setProcessing(false);
                        return;
                    }
                }
    }



    const isCustomError = (error: unknown): error is CustomError => {
        return typeof error === 'object' && error !== null && 'message' in error;
    };

    const handleSwap = async (token: string, value: string) => {
        if (!contract) return;
        // alert("Buy button clicked");
        if (!value) {
            setInputMissing(true);
            return;
        }

        // if (processing) return;

        setProcessing(true);

        try {
            console.log(`Token:${token}, value: ${value}`);

            if (token === "USDT") {
                console.log(`Token:${token}`);
                const usdtAmountBigNumber = ethers.utils.parseUnits(value, 6);
                // console.log(`USDT Value : ${value}`);
                // console.log(`USDT BIG Number : ${usdtAmountBigNumber}`);
                const usdtAddress = constant.usdtAddress;
                const presaleAddress = constant.presaleAddress;
                const signer = await provider?.getSigner();
                const signerAddress = await signer?.getAddress();
                const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);

                const usdtBalance = await usdtContract.balanceOf(signerAddress);
                if (usdtBalance.lt(usdtAmountBigNumber)) {
                    // console.log("Insufficient USDT balance.");
                    setFailed(true);
                    setErrorReason("Insufficient USDT balance.");
                    setProcessing(false);
                    return;
                }

                const currentAllowance = await usdtContract.allowance(signerAddress, presaleAddress);
                // console.log("Current Allowance:", currentAllowance.toString());

                if (currentAllowance.lt(usdtAmountBigNumber)) {
                    // console.log("Allowance not enough, approving...");
                    // const shortfall = usdtAmountBigNumber.sub(currentAllowance);
                    // console.log(`Allowance is insufficient. Shortfall: ${shortfall.toString()}`);

                    if (currentAllowance.gt(0)) {
                        console.log("Resetting allowance to zero...");
                        const resetTx = await usdtContract.approve(presaleAddress, 0, { gasLimit: 100000 });
                        const resetReceipt = await resetTx.wait();
                        if (resetReceipt.status === 1) {
                            // console.log("Reset allowance to zero success.");
                            setResetSuccess(true);
                        } else {
                            setFailed(true);
                            setErrorReason("Failed to reset allowance.");
                            return;
                        }
                        // console.log("Allowance reset to zero.");
                    }

                    // Estimate gas for approval if necessary (optional)
                    // const gasEstimateForApprove = await usdtContract.estimateGas.approve(presaleAddress, usdtAmountBigNumber);
                    // console.log("Estimated gas for approve:", gasEstimateForApprove.toString());

                    // Approve USDT allowance to the presale contract
                    const approveTx = await usdtContract.approve(presaleAddress, usdtAmountBigNumber, { gasLimit: 100000 });
                    const approveReceipt = await approveTx.wait();

                    if (approveReceipt.status === 1) {
                        console.log("USDT allowance approved successfully.");
                        setApproveSuccess(true);
                    } else {
                        console.log("USDT approval transaction failed.");
                        setFailed(true);
                        setErrorReason("USDT approval transaction failed.");
                        setProcessing(false);
                        return;
                    }
                } else {
                    // console.log("Current allowance is sufficient, no need to approve.");
                }

                // console.log("Proceeding with contribution...");

                // console.log("New Allowance:", currentAllowance.toString());
                // console.log(`USDT Value : ${value}`);
                // console.log(`MYID Want to receive : ${receivedValue}`);

                // const gasEstimateForContribute = await contract.estimateGas.contributeUSDT(usdtAmountBigNumber);
                // console.log("Estimated gas for contributeUSDT:", gasEstimateForContribute.toString());

                const tx = await contract.contributeUSDT(usdtAmountBigNumber, { gasLimit: 300000 });
                const receipt = await tx.wait();

                console.log("USDT contribution successful:", receipt);
                if (receipt.status === 1) {
                    // console.log("Transaction successful!");
                    setSuccess(true);
                    await refetchBalance(address as `0x${string}`);
                } else {
                    // console.log("Transaction failed.");
                    setFailed(true);
                }
            } else if (token === "ETH") {
                // console.log(`Token:${token}`);
                const ethAmountBigNumber = ethers.utils.parseEther(value);

                const tx = await contract.contributeEth({ value: ethAmountBigNumber });
                const receipt = await tx.wait();

                // console.log("ETH contribution successful:", receipt);
                if (receipt.status === 1) {
                    // console.log("Transaction successful!");
                    setSuccess(true);
                    await refetchBalance(address as `0x${string}`);
                } else {
                    // console.log("Transaction failed.");
                    setFailed(true);
                }
            }
        } catch (error: unknown) {
            // console.error("Error occurred during swap:", error);
            setFailed(true);
            setProcessing(false);

            let errorMessage = "An unknown error occurred";
            if (isCustomError(error)) {
                switch (error.code) {
                    case "INSUFFICIENT_FUNDS":
                        errorMessage = "Insufficient funds for gas + value.";
                        break;
                    case 4001:
                    case "ACTION_REJECTED":
                        errorMessage = "Rejected by you.";
                        break;
                    case "UNSUPPORTED_OPERATION":
                        errorMessage = "Connect your wallet.";
                        break;
                    case "NETWORK_ERROR":
                        errorMessage = "Network error. Please check your connection.";
                        break;
                    case "INVALID_ARGUMENT":
                        errorMessage = "Invalid argument provided. Please check your input.";
                        break;
                    case "CALL_EXCEPTION":
                        errorMessage = "Call to contract method failed. Contract may not be deployed.";
                        break;
                    case "OUT_OF_GAS":
                        errorMessage = "Transaction ran out of gas.";
                        break;
                    case "TRANSACTION_REVERTED":
                        errorMessage = "Transaction reverted. Please check contract conditions.";
                        break;
                    default:
                        errorMessage = error.message || "An unknown error occurred";
                        break;
                }
            }

            setErrorReason(errorMessage);
        } finally {
            setProcessing(false);
            // setInputValue('');
            // setReceivedValue('');
        }
    };

    const handleConnectWallet = () => {
        open({ view: 'Connect' });
    }

    const [isPhase1Start, setIsPhase1Start] = useState(true); // Track if we're in Phase 1 start countdown
    const [targetDateIndex, setTargetDateIndex] = useState(0); // Index to track the current phase
    const [timeRemaining, setTimeRemaining] = useState<{ days: number; hours: number; minutes: number; seconds: number }>({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
    });
    const [message, setMessage] = useState('Buy MYID Now During Phase 1 Presale. Starts In:');

    useEffect(() => {
        // console.log("TEST:", isPhase1Start, targetDateIndex)
        const updateCountdown = () => {
            const now = new Date();
            let targetDate: Date;

            // If we are before Phase 1 starts, set the target to Phase 1 start date
            if (isPhase1Start) {
                targetDate = phaseStartDate;
                setMessage('Buy MYID Now During Phase 1 Presale. Starts In:');
            } else {
                // Once Phase 1 starts, set the target to the current phase end date
                targetDate = phaseEndDates[targetDateIndex];
                setMessage(`Buy MYID Now During Phase ${targetDateIndex + 1} Presale. Ends In:`);
            }

            const distance = targetDate.getTime() - now.getTime();

            // If the countdown for Phase 1 start is over, switch to Phase 1 end countdown
            if (isPhase1Start && distance < 0) {
                setIsPhase1Start(false); // Phase 1 has started, now countdown to its end
                setMessage('Buy MYID Now During Phase 1 Presale. Ends In:');
                return;
            }

            // When a phase countdown ends, move to the next phase if applicable
            if (!isPhase1Start && distance < 0) {
                if (targetDateIndex < phaseEndDates.length - 1) {
                    setTargetDateIndex(targetDateIndex + 1); // Move to the next phase
                    setMessage(`Buy MYID Now During Phase ${targetDateIndex + 2} Presale. Ends In:`);
                } else {
                    setTimeRemaining({ days: 0, hours: 0, minutes: 0, seconds: 0 }); // Last phase ended
                    setMessage('Buy MYID Presale Is Completed!');
                }
                return;
            }

            // Calculate time remaining
            const days = Math.floor(distance / (1000 * 60 * 60 * 24));
            const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
            const seconds = Math.floor((distance % (1000 * 60)) / 1000);

            setTimeRemaining({ days, hours, minutes, seconds });
        };

        const interval = setInterval(updateCountdown, 1000);

        return () => clearInterval(interval);
    }, [isPhase1Start, targetDateIndex]);

    return (
        <div className='w-full h-auto bg-black relative justify-center' id="hero">
            <div className="hero-section w-full mt-[6rem] md:pb-20 pb-10 bg-black">

                {/* Desktop design */}
                <div className="layer2 w-full hidden md:block lg:px-[6rem] md:px-[6rem] px-3">
                    <div className="main relative w-full flex">

                        {/* Left Hero box */}
                        <div className="left w-[40%] flex flex-col pt-[4rem] pl-[2rem] bg-blac">

                            <div className="top w-full flex justify-start">
                                <div className="first-btn flex items-center gap-2 px-[1.2rem] py-[0.5rem] rounded-3xl">
                                    <InlineSVG
                                        src="/icons/star.svg"
                                        className="w-3 h-3"
                                    />
                                    <h2 className='font-medium first-text text-sm'>First Identity Coin</h2>
                                </div>
                            </div>
                            <h1 className='intro-text font-semibold lg:text-5xl md:text-2xl mt-4 py-1'>Introducing My</h1>
                            <h2 className='intro-text font-semibold lg:text-5xl md:text-2xl pb-1'>Identity (MYID) Coin</h2>
                            <p className='first-para lg:text-lg md:text-md font-medium pt-2 pb-4'>your gateway to true financial freedom!</p>
                            <div className="bottom w-full flex justify-start">
                                <button className="connect-btn flex items-center justify-center gap-[0.3rem] px-[1.5rem] py-[0.7rem] rounded-[4rem] cursor-pointer" onClick={() => window.open("https://www.clarusmoneyproject.com/", "_blank")}>
                                    <h2 className="text-black font-semibold text-md">Learn More</h2>
                                    <InlineSVG
                                        src="/icons/right-arrow.svg"
                                        className="w-3 h-3"
                                    />
                                </button>
                            </div>
                            <div className="users-bottom w-full flex justify-start">
                                <div className="users relative flex pt-8">
                                    <div className="user1 w-[3rem] h-[3rem] rounded-full">
                                        <img src="/images/user1.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user2.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user3.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user4.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user5.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <button className="absolute z-40 top-8 right-0 bottom-0 left-0 rounded-3xl" onClick={() => window.open("https://x.com/Clarus_money/", "_blank")}>

                                    </button>
                                </div>
                            </div>
                            <div className="join-text relative">
                                <p className='join-text font-normal text-xs pt-2 pb-5'>Join 15K+ MYID Community</p>
                                <button className="absolute z-40 top-2 right-[55%] bottom-5 left-0 rounded-3xl" onClick={() => window.open("https://x.com/Clarus_money/", "_blank")}>

                                </button>
                            </div>
                            <div className="running hidden md:flex cursor-pointer" onClick={() => window.open("https://www.clarusmoneyproject.com", "_blank")}>
                                <div className="marquee">
                                    <h2 className='text-white font-semibold text-md'>Visit <span className='text-[#BBFDFF]'>https://clarusmoneyproject.com</span> to know more!</h2>
                                </div>
                            </div>
                        </div>

                        {/* Right Hero box */}
                        <div className="right w-[60%] pl-[2rem] pr-[2rem] bg-blac" id="buy-now">
                            <div className="right-outer w-full mt-[1rem] rounded-[3rem]">
                                <div className="bg-black w-full rounded-[3rem]">
                                    <div className="right-box w-full flex flex-col items-center rounded-[3rem]">

                                        {/* Timer */}
                                        <div className="right-top w-full flex flex-col justify-center items-center px-3">
                                            <h2 className='text-white font-medium text-md text-white mb-[0.5rem] mt-[1rem] text-center'>{message}</h2>
                                            <div className="timer flex justify-center gap-[3rem] items-center lg:px-[6.5rem] md:px-[2rem] py-[1rem] mb-[1rem] mt-[0.5rem] rounded-[3rem]">
                                                <div className="days flex flex-col items-center">
                                                    <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.days).padStart(2, '0')}</h2>
                                                    <h2 className='text-white font-normal text-sm'>Days</h2>
                                                </div>
                                                <div className="hours flex flex-col items-center">
                                                    <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.hours).padStart(2, '0')}</h2>
                                                    <h2 className='text-white font-normal text-sm'>Hours</h2>
                                                </div>
                                                <div className="minutes flex flex-col items-center">
                                                    <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.minutes).padStart(2, '0')}</h2>
                                                    <h2 className='text-white font-normal text-sm'>Mins</h2>
                                                </div>
                                                <div className="seconds flex flex-col items-center">
                                                    <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.seconds).padStart(2, '0')}</h2>
                                                    <h2 className='text-white font-normal text-sm'>Secs</h2>
                                                </div>
                                            </div>
                                        </div>

                                        <h4 className='font-medium span pb-2 px-3 text-center'> 🚀 Previous All-Time High: <span className='font-semibold span-bold'>$0.33 USD/MYID! </span></h4>

                                        {/* ICO phases */}
                                        <h3 className='right-top-text font-semibold text-md px-3 text-center'>Announcing the 3-Phase MYID Final Private Offering, starting on October 20th at 3 PM EST</h3>
                                        <h4 className='font-medium span pt-2 px-3 text-center'><span className='font-semibold span-bold'>Phase 1:</span> MYID at <span className='font-semibold span-bold'>$0.004</span> USD/MYID from <span className='font-semibold span-bold'>Oct 20</span> to <span className='font-semibold span-bold'>Nov 17</span>, 3 PM EST.</h4>
                                        <h4 className='font-medium span pt-2 px-3 text-center'><span className='font-semibold span-bold'>Phase 2:</span> MYID at <span className='font-semibold span-bold'>$0.006</span> USD/MYID from <span className='font-semibold span-bold'>Nov 17</span> to <span className='font-semibold span-bold'>Dec 01</span>, 3 PM EST.</h4>
                                        <h4 className='font-medium span py-2 px-3 text-center'><span className='font-semibold span-bold'>Phase 3:</span> MYID at <span className='font-semibold span-bold'>$0.008</span> USD/MYID from <span className='font-semibold span-bold'>Dec 01</span>, 3PM to <span className='font-semibold span-bold'>Dec 15</span>, midnight EST.</h4>

                                        <h4 className='font-medium py-2 px-3 text-center text-red-500'> Only available on the <span className='font-semibold'>Ethereum mainnet.</span> </h4>

                                        {/* Supply buttons */}
                                        <div className="supply-btns w-full flex md:flex-col lg:flex-row justify-center md:gap-[1rem] 2xl:gap-[2rem] pt-3 pb-1 items-center px-3">
                                            <div className="supply-btn flex items-center gap-2 px-[1.5rem] py-[1rem] rounded-[2rem]">
                                                <InlineSVG
                                                    src="/icons/star.svg"
                                                    className="w-4 h-4"
                                                />
                                                <h2 className='font-medium first-text lg:text-md md:text-sm'>Total Supply - 100,000,000,000 </h2>
                                            </div>
                                            <div className="price-btn flex items-center gap-2 px-[1.5rem] py-[1rem] rounded-[2rem]">
                                                <InlineSVG
                                                    src="/icons/star.svg"
                                                    className="w-4 h-4"
                                                />
                                                <h2 className='font-medium first-text lg:text-md md:text-sm'>PRICE ${targetDateIndex ===0 ? "0.004": targetDateIndex === 1 ? "0.006" : "0.008"} USD = 1 MYID</h2>
                                            </div>
                                        </div>

                                        {/* Radio option selection */}
                                        <div className="pay-with w-full flex justify-center items-center pt-3 pb-2 px-3">
                                            <div className="paywith flex flex-row md:flex-col lg:flex-col xl:flex-row justify-center items-center lg:gap-3 md:gap-1">
                                                <h2 className='font-medium text-white text-lg lg:pr-4'>Pay With</h2>
                                                <div className="erc20 flex justify-center items-center gap-3">
                                                    <div className={`usdt-pay flex justify-center items-center gap-2 w-[12rem] py-[0.7rem] rounded-md cursor-pointer ${selectedToken === "USDT" ? "border border-[#BBFDFF]" : ""}`} onClick={() => handleTokenSelect('USDT')}>
                                                        <div className={`radio w-[0.8rem] h-[0.8rem] rounded-full ${selectedToken === "USDT" ? 'bg-[#BBFDFF]' : 'bg-none'}`}>
                                                        </div>
                                                        <div className="usdt-logo w-[2rem] h-[2rem]">
                                                            <img src="/images/usdt-logo.png" alt="usdt" className='w-full h-full object-cover' />
                                                        </div>
                                                        <h2 className='font-medium text-white text-md'>USDT-ERC20</h2>
                                                    </div>
                                                    <p className='font-medium text-white text-md'>or</p>
                                                    <div className={`eth-pay flex justify-center items-center gap-2 md:w-[11rem] lg:w-[12rem] py-[0.7rem] rounded-md cursor-pointer ${selectedToken === "ETH" ? "border border-[#BBFDFF]" : ""}`} onClick={() => handleTokenSelect('ETH')}>
                                                        <div className={`radio w-[0.8rem] h-[0.8rem] rounded-full ${selectedToken === "ETH" ? 'bg-[#BBFDFF]' : 'bg-none'}`}>
                                                        </div>
                                                        <div className="usdt-logo w-[2rem] h-[2rem]">
                                                            <img src="/images/eth-logo.png" alt="usdt" className='w-full h-full object-cover' />
                                                        </div>
                                                        <h2 className='font-medium text-white text-lg'>ETH</h2>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Swap coin buttons */}
                                        <div className="swap-btns w-full flex md:flex-col lg:flex-row justify-center items-center lg:gap-[1rem] md:gap-[0.5rem] pt-4 pb-3 px-3">
                                            <div className={`from-token flex items-center justify-center gap-3 lg:px-[2rem] md:px-[1rem] py-[0.7rem] rounded-[2rem] border ${inputMissing ? "border-[#ED2121]" : "border-[#BBFDFF]"}`}>
                                                <input
                                                    type="number"
                                                    value={inputValue}
                                                    onChange={handleInputChange}
                                                    placeholder={`${inputMissing ? "Invalid Input" : "Enter a Value"}`}
                                                    disabled={processing}
                                                    className={`h-[1.5rem]  lg:w-[10rem] md:w-[6rem] bg-transparent border-none outline-none appearance-none ${inputMissing ? 'placeholder-ed' : 'placeholder-bb'}`}
                                                />
                                                <div className="usdt-logo w-[2rem] h-[2rem]">
                                                    <img src={`/images/${selectedToken === "USDT" ? "usdt-logo.png" : "eth-logo.png"}`} alt="usdt" className='w-full h-full object-cover' />
                                                </div>
                                            </div>

                                            <InlineSVG
                                                src="/icons/swap.svg"
                                                className="w-6 h-6 md:transform md:rotate-90 lg:rotate-0"
                                            />

                                            <div className="from-token to flex items-center justify-center gap-3 lg:px-[2rem] md:px-[1rem] py-[0.7rem] rounded-[2rem]">
                                                <input
                                                    type="number"
                                                    value={receivedValue}
                                                    readOnly
                                                    placeholder='you get MYID'
                                                    className="h-[1.5rem] lg:w-[10rem] md:w-[6rem] bg-transparent border-none outline-none appearance-none"
                                                />
                                                <InlineSVG
                                                    src="/icons/myid.svg"
                                                    className="w-[2.1rem] h-[2.1rem]"
                                                />
                                            </div>
                                        </div>

                                        {/* Connect wallet button */}
                                        <div className="connect-wallet w-full flex justify-center items-center gap-[1rem] pt-4 pb-6">
                                            <div className="connect-wallet-btn px-[5rem] py-[0.8rem] flex items-center gap-1 rounded-xl cursor-pointer" onClick={!isConnected && !address ? () => handleConnectWallet() : () => handleSwap(selectedToken, inputValue)}>
                                                <h2 className='font-semibold text-lg text-black'>{isConnected && address && processing ? "Processing.." : isConnected && address && !processing ? "Buy Now" : "Connect Wallet"}</h2>
                                                {!processing ?
                                                    <InlineSVG
                                                        src="/icons/right-arrow.svg"
                                                        className="w-4 h-4"
                                                    /> :
                                                    <div className='loader ml-3'></div>}
                                            </div>
                                        </div>
                                      
                                        <div className="connect-wallet w-full flex justify-center items-center gap-[1rem] pt-4 pb-6">
                                            <div className="connect-wallet-btn px-[5rem] py-[0.8rem] flex items-center gap-1 rounded-xl cursor-pointer"  onClick={()=>getfuncTokenValue("usdtToTokens","1")} >
                                                <h2 className='font-semibold text-lg text-black'>Get token</h2>
                                                {!processing ?
                                                    <InlineSVG
                                                        src="/icons/right-arrow.svg"
                                                        className="w-4 h-4"
                                                    /> :
                                                    <div className='loader ml-3'></div>}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="bg absolute w-[20rem] h-[20rem] left-[-5.5rem] bottom-[-3.8rem]">

                        </div>
                    </div>
                </div>

                {/* Mobile Design */}
                <div className="mobile-section md:hidden w-full">
                    {/* Timer */}
                    <div className="right-top w-full flex flex-col justify-center items-center px-3">
                        <h2 className='text-white font-medium md:text-md text-sm text-white mb-[0.5rem] mt-[1rem] text-center'>{message}</h2>
                        <div className="timer flex justify-center gap-[3rem] items-center px-[2rem] py-[0.8rem] mb-[1rem] mt-[0.5rem] rounded-[3rem]">
                            <div className="days flex flex-col items-center">
                                <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.days).padStart(2, '0')}</h2>
                                <h2 className='text-white font-normal text-sm'>Days</h2>
                            </div>
                            <div className="hours flex flex-col items-center">
                                <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.hours).padStart(2, '0')}</h2>
                                <h2 className='text-white font-normal text-sm'>Hours</h2>
                            </div>
                            <div className="minutes flex flex-col items-center">
                                <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.minutes).padStart(2, '0')}</h2>
                                <h2 className='text-white font-normal text-sm'>Mins</h2>
                            </div>
                            <div className="seconds flex flex-col items-center">
                                <h2 className='text-white font-medium text-2xl'>{String(timeRemaining.seconds).padStart(2, '0')}</h2>
                                <h2 className='text-white font-normal text-sm'>Secs</h2>
                            </div>
                        </div>
                    </div>
                    {/* Phase intro mobile */}
                    <div className="top-intro py-3" id="buy">

                        {/* ICO phases */}
                        <h3 className='right-top-text font-semibold text-md text-center px-3'>Announcing the 3-Phase MYID Final Private Offering, starting on October 20th at 3 PM Eastern Standard Time</h3>
                        <h4 className='font-medium span pt-6 text-center px-3'><span className='font-semibold span-bold'>Phase 1:</span> MYID at <span className='font-semibold span-bold'>$0.004</span> USD/MYID from <span className='font-semibold span-bold'>Oct 20</span> to <span className='font-semibold span-bold'>Nov 17</span>, 3 PM EST.</h4>
                        <h4 className='font-medium span pt-2 text-center px-3'><span className='font-semibold span-bold'>Phase 2:</span> MYID at <span className='font-semibold span-bold'>$0.006</span> USD/MYID from <span className='font-semibold span-bold'>Nov 17</span> to <span className='font-semibold span-bold'>Dec 01</span>, 3 PM EST.</h4>
                        <h4 className='font-medium span pt-2 pb-4 text-center px-3'><span className='font-semibold span-bold'>Phase 3:</span> MYID at <span className='font-semibold span-bold'>$0.008</span> USD/MYID from <span className='font-semibold span-bold'>Dec 01</span>, 3PM to <span className='font-semibold span-bold'>Dec 15</span>, midnight EST.</h4>

                        <h4 className='font-medium py-2 px-3 text-center text-red-500'> Only available on the <span className='font-semibold'>Ethereum mainnet.</span> </h4>

                        <div className="supply-btns-mob w-full flex flex-col justify-center items-center gap-4 py-3 px-3">
                            <div className="supply-btn flex justify-center items-center gap-2 md:px-[1.5rem] px-[1rem] py-[1rem] rounded-[2rem] w-full">
                                <InlineSVG
                                    src="/icons/star.svg"
                                    className="w-4 h-4"
                                />
                                <h2 className='font-medium first-text text-sm'>Total Supply - 100,000,000,000 MYID Token </h2>
                            </div>
                            <div className="price-btn flex justify-center items-center gap-2 px-[1.5rem] py-[1rem] rounded-[2rem] w-full">
                                <InlineSVG
                                    src="/icons/star.svg"
                                    className="w-4 h-4"
                                />
                                <h2 className='font-medium first-text text-sm'>PRICE ${targetDateIndex ===0 ? "0.004": targetDateIndex === 1 ? "0.006" : "0.008"} USD = 1 MYID</h2>
                            </div>
                        </div>
                    </div>

                    {/* Radio option selection */}
                    <h3 className='text-center font-semibold text-md text-white py-2'>Pay with</h3>
                    <div className="paywith flex justify-center items-center gap-2">
                        <div className={`usdt-pay flex justify-center items-center gap-2 w-[11rem] py-[0.7rem] rounded-md ${selectedToken === "USDT" ? "border border-[#BBFDFF]" : ""}`} onClick={() => handleTokenSelect('USDT')}>
                            <div className={`radio w-[0.8rem] h-[0.8rem] rounded-full ${selectedToken === "USDT" ? 'bg-[#BBFDFF]' : 'bg-none'}`}>
                            </div>
                            <div className="usdt-logo w-[1.5rem] h-[1.5rem]">
                                <img src="/images/usdt-logo.png" alt="usdt" className='w-full h-full object-cover' />
                            </div>
                            <h2 className='font-medium text-white text-md'>USDT-ERC20</h2>
                        </div>
                        <p className='font-medium text-white text-md'>or</p>
                        <div className={`eth-pay flex justify-center items-center gap-2 w-[11rem] py-[0.7rem] rounded-md ${selectedToken === "ETH" ? "border border-[#BBFDFF]" : ""}`} onClick={() => handleTokenSelect('ETH')}>
                            <div className={`radio w-[0.8rem] h-[0.8rem] rounded-full ${selectedToken === "ETH" ? 'bg-[#BBFDFF]' : 'bg-none'}`}>
                            </div>
                            <div className="usdt-logo w-[1.5rem] h-[1.5rem]">
                                <img src="/images/eth-logo.png" alt="usdt" className='w-full h-full object-cover' />
                            </div>
                            <h2 className='font-medium text-white text-md'>ETH</h2>
                        </div>
                    </div>

                    {/* Swap coin buttons */}
                    <div className="swap-btns w-full flex flex-col justify-center items-center gap-[0.5rem] pt-4 pb-3">
                        <div className={`from-token flex items-center justify-center gap-3 px-[2rem] py-[0.9rem] rounded-[2rem] border ${inputMissing ? "border-[#ED2121]" : "border-[#BBFDFF]"}`}>
                            <input
                                type="number"
                                value={inputValue}
                                onChange={handleInputChange}
                                placeholder={`${inputMissing ? "Invalid Input" : "Enter a Value"}`}
                                disabled={processing}
                                className={`h-[1.5rem] bg-transparent border-none outline-none appearance-none ${inputMissing ? 'placeholder-ed' : 'placeholder-bb'}`}
                            />
                            <div className="usdt-logo w-[1.5rem] h-[1.5rem]">
                                <img src={`/images/${selectedToken === "USDT" ? "usdt-logo.png" : "eth-logo.png"}`} alt="usdt" className='w-full h-full object-cover' />
                            </div>
                        </div>

                        <InlineSVG
                            src="/icons/swap.svg"
                            className="w-6 h-6 transform rotate-90"
                        />

                        <div className="from-token to flex items-center justify-center gap-3 px-[2rem] py-[0.9rem] rounded-[2rem]">
                            <input
                                type="number"
                                value={receivedValue}
                                readOnly
                                placeholder='you get MYID'
                                className="h-[1.5rem] bg-transparent border-none outline-none appearance-none"
                            />
                            <div className="usdt-logo w-[1.7rem] h-[1.8rem]">
                                <img src="/icons/myid.svg" alt="usdt" className='w-full h-full object-cover' />
                            </div>
                        </div>
                    </div>

                    {/* Connect wallet button */}
                    <div className="connect-wallet w-full flex justify-center items-center gap-[1rem] pt-4 md:pb-6 pb-0">
                        <div className="connect-wallet-btn px-[5rem] py-[0.8rem] flex items-center gap-1 rounded-xl" onClick={() => {
                            console.log('Button clicked');
                            // alert(`Clicked! ${selectedToken}, ${inputValue}, ${receivedValue}, ${testError}`)
                            if (!isConnected && !address) {
                                handleConnectWallet();
                            } else {
                                handleSwap(selectedToken, inputValue);
                            }
                        }}>
                            <h2 className='font-semibold text-lg text-black'>{isConnected && address && processing ? "Processing.." : isConnected && address && !processing ? "Buy Now" : "Connect Wallet"}</h2>
                            {!processing ?
                                <InlineSVG
                                    src="/icons/right-arrow.svg"
                                    className="w-4 h-4"
                                /> :
                                <div className='loader ml-3'></div>}
                        </div>
                    </div>

                    {/* Intro text mobile */}
                    <div className="intro-mobile w-full flex flex-col justify-center items-center pt-10 pb-3">
                        <div className="top w-full flex justify-center">
                            <div className="first-btn flex items-center gap-2 px-[1.2rem] py-[0.5rem] rounded-3xl">
                                <InlineSVG
                                    src="/icons/star.svg"
                                    className="w-3 h-3"
                                />
                                <h2 className='font-medium first-text text-sm'>First Identity Coin</h2>
                            </div>
                        </div>
                        <h1 className='intro-text font-semibold lg:text-5xl md:text-2xl text-4xl mt-2 py-1'>Introducing My</h1>
                        <h2 className='intro-text font-semibold lg:text-5xl md:text-2xl text-4xl pb-1'>Identity (MYID) Coin</h2>
                        <p className='first-para lg:text-lg md:text-md font-normal text-md pt-1 pb-4'>your gateway to true financial freedom!</p>
                    </div>

                    {/* Learn More and Twitter Community */}
                    <div className="mob-twitter w-full flex items-center flex-col px-3">
                        <div className="bottom w-full flex justify-center">
                            <button className="connect-btn flex items-center justify-center gap-[0.3rem] px-[1.5rem] py-[0.7rem] rounded-[4rem] cursor-pointer" onClick={() => window.open("https://www.clarusmoneyproject.com/", "_blank")}>
                                <h2 className="text-black font-semibold text-md">Learn More</h2>
                                <InlineSVG
                                    src="/icons/right-arrow.svg"
                                    className="w-3 h-3"
                                />
                            </button>
                        </div>
                        <div className="intro-mob-right">
                            <div className="users-bottom w-full flex justify-start">
                                <div className="users relative flex pt-8">
                                    <div className="user1 w-[3rem] h-[3rem] rounded-full">
                                        <img src="/images/user1.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user2.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user3.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user4.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <div className="user1 w-[3rem] h-[3rem] ml-[-10px] rounded-full">
                                        <img src="/images/user5.png" alt="user1" className='w-full h-full object-cover' />
                                    </div>
                                    <button className="absolute z-40 top-8 right-0 bottom-0 left-0 rounded-3xl" onClick={() => window.open("https://x.com/Clarus_money/", "_blank")}>

                                    </button>
                                </div>
                            </div>
                            <div className="join-text relative">
                                <p className='join-text text-center font-normal text-xs pt-2 pb-5'>Join 15K+ MYID Community</p>
                                <button className="absolute z-40 top-2 right-[55%] bottom-5 left-0 rounded-3xl" onClick={() => window.open("https://x.com/Clarus_money/", "_blank")}>

                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="running" onClick={() => window.open("https://www.clarusmoneyproject.com", "_blank")}>
                        <div className="marquee">
                            <h2 className='text-white font-semibold text-md'>Visit <span className='text-[#BBFDFF]'>https://clarusmoneyproject.com</span> to know more!</h2>
                        </div>
                    </div>

                </div>
            </div>

            {success && <div id="toast-success" className="flex fixed top-[6.5rem] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[6rem] items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800" role="alert">
                <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    <span className="sr-only">Check icon</span>
                </div>
                <div className="ms-3 text-sm font-normal flex flex-col"><h2>Transaction Successful!</h2><p className='text-xs font-normal'>Received {receivedValue} MYID Coins.</p></div>
                <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close" onClick={() => setSuccess(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            </div>}
            {approveSuccess && <div id="toast-success" className="flex fixed top-[6.5rem] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[6rem] items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800" role="alert">
                <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    <span className="sr-only">Check icon</span>
                </div>
                <div className="ms-3 text-sm font-normal flex flex-col"><h2>USDT approval Successful!</h2><p className='text-xs font-normal'>Please wait & confirm the transaction.</p></div>
                <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close" onClick={() => setApproveSuccess(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            </div>}
            {resetSuccess && <div id="toast-success" className="flex fixed top-[6.5rem] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[6rem] items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800" role="alert">
                <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
                    </svg>
                    <span className="sr-only">Check icon</span>
                </div>
                <div className="ms-3 text-sm font-normal flex flex-col"><h2>USDT Reset Successful!</h2><p className='text-xs font-normal'>Please wait & approve the USDT allowance.</p></div>
                <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close" onClick={() => setResetSuccess(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            </div>}
            {failed && <div id="toast-danger" className="flex fixed top-[6.5rem] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[6rem] items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800" role="alert">
                <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                    </svg>
                    <span className="sr-only">Error icon</span>
                </div>
                <div className="ms-3 text-sm font-normal flex flex-col"><h2>Transaction Failed!</h2><p className='text-xs font-normal'>{errorReason}</p></div>
                <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-danger" aria-label="Close" onClick={() => setFailed(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            </div>}
            {convertionFailed && <div id="toast-danger" className="flex fixed top-[6.5rem] left-1/2 -translate-x-1/2 md:left-auto md:translate-x-0 md:right-[6rem] items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow dark:text-gray-400 dark:bg-gray-800" role="alert">
                <div className="inline-flex items-center justify-center flex-shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
                    <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
                    </svg>
                    <span className="sr-only">Error icon</span>
                </div>
                <div className="ms-3 text-sm font-normal flex flex-col"><h2>Conversion Failed!</h2><p className='text-xs font-normal'>{errorReason}</p></div>
                <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-danger" aria-label="Close" onClick={() => setConvertionFailed(false)}>
                    <span className="sr-only">Close</span>
                    <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                        <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
                    </svg>
                </button>
            </div>}
        </div>
    )
}