import { Status } from "../lib/availability";
import { ApiResponse, ApiStatus } from "../types/ApiResponse";
import { Session } from "../types/Session";
import { ApiHost } from "./util";

export const GetSession=async (slug:string): Promise<ApiResponse>=>{
    const response = await fetch(`${ApiHost}sessions/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const res=await response.json()
  
    if (!response.ok) {
      return  { status: ApiStatus.Failure, message: res.message }
    }
  return {status:ApiStatus.Success, message: res.message, data: res.data}
}

export const SaveAvailability=async (session:Session, name: string, heroClass: string, slotsByDate: Record<string, Map<number, Status>>, localTimezone: string): Promise<ApiResponse>=>{
    const convertedSlotsByDate: Record<string, Record<string, Status>> = Object.fromEntries(
      Object.entries(slotsByDate).map(([date, map]) => [
        date,
        Object.fromEntries([...map.entries()].map(([k, v]) => [String(k), v])),
      ])
    )
    const response = await fetch(`${ApiHost}availability`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({slug: session.slug,name, heroClass, slotsByDate: convertedSlotsByDate, localTimezone }),
    })
    const res=await response.json()
  
    if (!response.ok) {
      return  { status: ApiStatus.Failure, message: res.message }
    }
  return {status:ApiStatus.Success, message: res.message, data: res.data}
}

export const UpdateAvailability = async (id:string, slotsByDate: Record<string, Map<number, Status>>): Promise<ApiResponse> => {
    const convertedSlotsByDate: Record<string, Record<string, Status>> = Object.fromEntries(
      Object.entries(slotsByDate).map(([date, map]) => [
        date,
        Object.fromEntries([...map.entries()].map(([k, v]) => [String(k), v])),
      ])
    )
    const response = await fetch(`${ApiHost}availability/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({id, slotsByDate: convertedSlotsByDate }),
    })
    const res=await response.json()
  
    if (!response.ok) {
      return  { status: ApiStatus.Failure, message: res.message }
    }
  return {status:ApiStatus.Success, message: res.message, data: res.data}
}

export const GetAllAvailabilities =async (slug:string): Promise<ApiResponse>=>{
    const response = await fetch(`${ApiHost}availability/${slug}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    })
    const res=await response.json()
  
    if (!response.ok) {
      return  { status: ApiStatus.Failure, message: res.message }
    }
  return {status:ApiStatus.Success, message: res.message, data: res.data}
}