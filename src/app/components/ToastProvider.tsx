"use client"

import { ToastContainer } from "react-toastify"

const contextClass: Record<string, string> = {
  success: "bg-emerald",
  error: "bg-burgundy",
  info: "bg-gray-600",
  warning: "bg-orange-400",
  default: "bg-indigo-600",
  dark: "bg-white-600 font-gray-300",
}

export function ToastProvider() {
  return (
    <ToastContainer
      toastClassName={(context) =>
        (contextClass[context?.type ?? "default"] ?? contextClass.default) +
        " relative flex p-1 min-h-10 rounded-md justify-between  cursor-pointer pr-20"
      }
    />
  )
}
