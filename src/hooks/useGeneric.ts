import { useState } from "react";
import { ethers } from "ethers";
import { constant } from "@/config/constants";
import { usdtABI } from '@/config/usdtABI';
import { useContract } from "@/contexts/ContractProvider";
type UnknownObject = Record<string, any>;
type ValueFields = Record<string, string | number>;
export const useGeneric = () => {
    const [processing, setProcessing] = useState(false);
    const [convertionFailed, setConvertionFailed] = useState(false);
    const [approveSuccess, setApproveSuccess] = useState(false);
    const [resetSuccess, setResetSuccess] = useState(false);
    const [failed, setFailed] = useState(false);
    const [errorReason, setErrorReason] = useState("");
    const { contract, provider } = useContract();
    const handleError = (error: any, tokenType: string) => {
        console.error(`Error with ${tokenType}:`, error);
        setErrorReason(error.message || "An unknown error occurred.");
    };
    const getfuncTokenValue = async (func: string, value: UnknownObject, isGasLimit: boolean) => {
        if (!contract) {
            console.log("Contract not found", isGasLimit)
            return;
        }
        console.log("value", value);
        try {
            // const usdtAmountBigNumber = ethers.utils.parseUnits(value, 6);
            const args = Object.values(value);
            console.log("args", args);
            if (typeof contract[func] !== "function") {
                throw new Error(`Function ${func} does not exist on the contract`);
            }
            let res;
            if (isGasLimit === true) {
                console.log("Step1:", isGasLimit)
                const token = await contract[func](...args, { gasLimit: 300000 });
                const receipt = await token.wait();
                return { data: receipt, isGas: true, success: true };
            } else {
                console.log("Step2:", isGasLimit)
                res = await contract[func](...args);
                const tokenValue = Number(ethers.utils.formatUnits(res, 6));
                return { data: tokenValue, isGas: false, success: true };
            }
        } catch (error: any) {
            console.log("Step3:", error)
            console.error("Error fetching token value:", error);
            handleError(error, "USDT");
            setConvertionFailed(true);
            return { data: null, isGas: false, success: false };
        }
    };
    const funcCall = async (usdtValue: string) => {
        if (!contract || !provider) return;
        setProcessing(true);
        try {
            const usdtAmountBigNumber = ethers.utils.parseUnits(usdtValue, 6);
            const { usdtAddress, presaleAddress } = constant;
            const signer = provider.getSigner();
            const signerAddress = await signer.getAddress();
            const usdtContract = new ethers.Contract(usdtAddress, usdtABI, signer);
            const usdtBalance = await usdtContract.balanceOf(signerAddress);
            if (usdtBalance.lt(usdtAmountBigNumber)) {
                alert("Insufficient USDT balance.");
                setFailed(true);
                return;
            }
            const currentAllowance = await usdtContract.allowance(signerAddress, presaleAddress);
            if (currentAllowance.lt(usdtAmountBigNumber)) {
                if (currentAllowance.gt(0)) {
                    const resetTx = await usdtContract.approve(presaleAddress, 0, { gasLimit: 100000 });
                    const resetReceipt = await resetTx.wait();
                    if (resetReceipt.status === 1) {
                        setResetSuccess(true);
                    } else {
                        alert("Failed to reset allowance.");
                        setFailed(true);
                        return;
                    }
                }
                const approveTx = await usdtContract.approve(presaleAddress, usdtAmountBigNumber, { gasLimit: 100000 });
                const approveReceipt = await approveTx.wait();
                if (approveReceipt.status === 1) {
                    setApproveSuccess(true);
                } else {
                    setFailed(true);
                    setErrorReason("USDT approval transaction failed.");
                    return;
                }
            }
        } catch (error: any) {
            console.error("Error in funcCall:", error);
            setFailed(true);
            setErrorReason(error.message);
        } finally {
            setProcessing(false);
        }
    };
    return {
        getfuncTokenValue,
        funcCall,
        states: {
            processing,
            convertionFailed,
            approveSuccess,
            resetSuccess,
            failed,
            errorReason,
        },
    };
};