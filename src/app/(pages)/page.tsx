"use client";

import { motion } from "framer-motion";
import { Castle } from "lucide-react";
import { redirect } from "next/navigation";
import { useState } from "react";

export default function Home() {
  const [code, setCode] = useState("");
 
  return (
    <div className="relative flex flex-col overflow-hidden">
      <main className="z-10 relative flex lg:flex-row flex-col flex-1 gap-6 mx-auto p-4 md:p-6 w-full max-w-7xl">
      <motion.div
        initial={{
          opacity: 0,
          y: 20,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        className="flex flex-1 justify-center items-center mx-auto p-6 w-full max-w-2xl"
      >
        <div className="p-10 w-full text-center parchment-panel">
          <motion.div
            animate={{
              y: [0, -6, 0],
              rotate: [0, -4, 4, 0],
            }}
            transition={{
              duration: 5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
            className="mx-auto mb-4 w-fit text-gold"
          >
            <Castle size={56} />
          </motion.div>
          
          <button onClick={()=>{redirect("/setup")}} className="btn-primary">
            Visit the Setup Chamber
          </button>
          <h2 className="m-2 font-heading font-bold text-burgundy text-3xl">
            OR
          </h2>
        <input type="text" 
        placeholder="Enter your session code" 
        className="p-2 border rounded w-full"  
        value={code} 
        onChange={(e)=>{setCode(e.target.value)}}/>
        <div className="flex flex-row justify-center items-center gap-5 mt-2">
        <button onClick={()=>{redirect("/selector/"+code.split("/").pop())}} className="btn-primary">
            Enter Availability
          </button>
        <button onClick={()=>{redirect("/council/"+code.split("/").pop())}} className="btn-primary">
            Check Availability
          </button>
        </div>
        </div>
      </motion.div>
      
       </main>
    </div>
  )
}
