// 'use client';
// import Architecture from '@/components/core/architecture'
// import RevArchitecture from '@/components/core/revArchitecture'
// import React, { useEffect, useState } from 'react'
// import { getSandboxLink } from '../../../actions/e2bSandbox';

// const page = () => {

//   const [sandboxLink, setSandboxLink] = useState<string | null>(null);

//   useEffect(() => {
//     const fetchSandboxLink = async () => {
//       const link = await getSandboxLink();
//       setSandboxLink(link);
//     }
//     fetchSandboxLink();
//   }, []);


//   return (
//     <div className='w-full h-full bg-black'>
//       <span className='text-white'>{sandboxLink}</span>
      
//     </div>
//   )
// }

// export default page


const page = () => {
  return (
    <div>
      <h1>Design Test</h1>
    </div>
  )
}

export default page