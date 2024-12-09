import React, { useEffect, useState } from 'react';
import './Toast.css'
import InlineSVG from 'react-inlinesvg';
import Copied from './Copied';

interface Props {
    codeSnippet: string;
    onClose: () => void;
}

const Popup: React.FC<Props> = ({ codeSnippet, onClose }) => {
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (copied) {
            setTimeout(() => {
                setCopied(false);
            }, 3000)
        }
    }, [copied])
    const copyToClipboard = (snippet: string) => {
        navigator.clipboard.writeText(snippet || "").then(() => {
            // alert("Copied to clipboard!");
            setCopied(true);
        }).catch(err => {
            console.error("Failed to copy text: ", err);
        });
    };
    return (
        <div className="fixed left-0 top-0 w-full h-[100vh] flex items-center justify-center bg-[#000000B2]">
            <div className="relative custom-shadow popup-box w-[24rem] flex flex-col gap-2 h-auto bg-white p-5 rounded-lg">
                <div className="absolute top-3 right-3 w-[1.6rem] h-[1.6rem] flex items-center justify-center rounded-md border border-zinc-800 cursor-pointer" onClick={onClose}>
                    <InlineSVG
                        src={"images/close.svg"}
                        className="fill-current w-5 h-5 text-zinc-900"
                    />
                </div>
                <div className="text">
                    <h2 className='text-center dark:text-black text-black text-lg font-semibold'>Code Snippet for your Agent!</h2>
                </div>
                <div className="bg-gray-100 p-2 rounded-md border border-gray-300 cursor-pointer">
                    <code className="snippet-content dark:text-black block font-mono whitespace-pre-wrap">
                        {codeSnippet}
                    </code>
                </div>
                <div className="copy-btn-section w-full flex justify-center">
                    <button
                        onClick={() => copyToClipboard(codeSnippet)}
                        className={`w-auto bg-black backdrop-blur supports-[backdrop-filter]:bg-mb-black/60 text-white py-2 px-5 rounded-md`}
                    >
                        <h2 className="font-semibold text-white">Copy</h2>
                    </button>
                </div>
            </div>
            {copied && <Copied />}
        </div>
    );
};

export default Popup;
