import { ApiResponse, ApiStatus } from "../types/ApiResponse";
import { ApiHost } from "./util";

export const CreateSession=async (name: string, endTime:string, startTime:string, timeZone:string, selectedDates: Set<string>): Promise<ApiResponse>=>{
    const response = await fetch(`${ApiHost}sessions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name, startTime, endTime, timeZone, selectedDates: [...selectedDates] }),
    })
    const res=await response.json()
  
    if (!response.ok) {
      return  { status: ApiStatus.Failure, message: res.message }
    }
  return {status:ApiStatus.Success, message: res.message, data: res.data}
}