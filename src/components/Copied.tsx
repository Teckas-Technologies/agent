import React from 'react';
import './Toast.css'
import InlineSVG from 'react-inlinesvg';

const Copied: React.FC = () => {
    return (
        <>
            <div className="custom-shadow flex z-50 mt-20 items-center bg-black gap-2 w-auto px-4 py-2 mb-4 bg-zink-900 rounded-lg dark:text-gray-400 dark:bg-gray-800 fixed top-5 left-1/2 transform -translate-x-1/2">
                <InlineSVG
                    src={"images/clipboard.svg"}
                    className="fill-current w-5 h-5 text-white"
                />
                <h2 className='text-white text-lg font-medium'>Copied!</h2>
            </div>
        </>
    );
};

export default Copied;
