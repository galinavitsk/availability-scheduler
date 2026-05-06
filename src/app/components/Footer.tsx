"use client";
import React from 'react'
import { Dices, Sparkles as SparkIcon } from 'lucide-react'
import { motion } from 'framer-motion'
import { redirect } from 'next/navigation';
export function Footer() {
  return (
    <motion.header
      initial={{
        y: -20,
        opacity: 0,
      }}
      animate={{
        y: 0,
        opacity: 1,
      }}
      className="bottom-0 fixed backdrop-blur-sm border-gold-light/20 border-b-1 w-full"
    >
      <div className="flex justify-between items-center mx-auto px-4 max-w-7xl h-20">
       
        <span className="font-body text-ink-light/60 text-xs">© {new Date().getFullYear()} Quest Scheduler</span>
        <nav className="flex items-end gap-1">
          <form action="https://www.paypal.com/donate" method="post" target="_top">
<input type="hidden" name="business" value="84Q7M99LXDSRU" />
<input type="hidden" name="no_recurring" value="0" />
<input type="hidden" name="currency_code" value="USD" />
<input type="image" src="https://www.paypalobjects.com/en_US/i/btn/btn_donate_LG.gif" style={{border: 0}} name="submit" title="PayPal - The safer, easier way to pay online!" alt="Donate with PayPal button" />
<img alt="" style={{border: 0}} src="https://www.paypal.com/en_US/i/scr/pixel.gif" width="1" height="1" />
</form>

        </nav>
      </div>
    </motion.header>
  )
}

