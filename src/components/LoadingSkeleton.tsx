import React from 'react';
import {Spinner} from "@nextui-org/spinner";

const LoadingSkeleton: React.FC = () => {
  return (
    <div className="flex items-center justify-center h-screen">
        <Spinner/>
    </div>
  );
};

export default LoadingSkeleton;